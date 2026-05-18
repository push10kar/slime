from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.routes.auth import get_current_user
from app.core.database import get_db
from app import models
from app.middleware.adapters.csv_adapter import CSVAdapter
from app.middleware.adapters.xml_adapter import XMLAdapter
from app.middleware.adapters.soap_adapter import SOAPAdapter
from app.middleware.adapters.fixed_width_adapter import FixedWidthAdapter
from app.core.config import settings
from app.core.redis_client import get_redis
from app.core.metrics import LEGACY_FAILURES, CACHE_REQUESTS, TRANSFORMATION_REQUESTS, TRANSFORMATION_LATENCY
from app.schemas.models import NormalizedResponse, DataSourceCreate, DataSourceOut, TransformedRecordOut
import time
import json
import logging
from tenacity import AsyncRetrying, stop_after_attempt, wait_exponential, retry_if_exception_type
import httpx

logger = logging.getLogger("api_gateway.adapters")

router = APIRouter()

ADAPTER_MAP = {
    "csv": CSVAdapter,
    "xml": XMLAdapter,
    "soap": SOAPAdapter,
    "fixed_width": FixedWidthAdapter,
}


async def save_transformation_record(
    db: AsyncSession,
    adapter_type: str,
    payload: dict,
    latency_ms: float,
    cached: bool
):
    try:
        preview = json.dumps(payload)[:1000]
        record = models.TransformedRecord(
            adapter_type=adapter_type,
            payload_preview=preview,
            latency_ms=latency_ms,
            cached=cached
        )
        db.add(record)
        await db.commit()
    except Exception as e:
        logger.error(f"Failed to save transform history to DB: {e}")


@router.post("/", response_model=DataSourceOut, status_code=status.HTTP_201_CREATED, summary="Onboard new legacy source")
async def create_data_source(
    source: DataSourceCreate,
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    new_source = models.DataSource(
        name=source.name,
        type=source.type,
        connection_type=source.connection_type,
        endpoint=source.endpoint,
        mapping_mode=source.mapping_mode,
        manual_mapping=source.manual_mapping,
        latency="Calculating..."
    )
    db.add(new_source)
    await db.commit()
    await db.refresh(new_source)
    return new_source


@router.get("/", response_model=List[DataSourceOut], summary="List all legacy sources")
async def list_adapters(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    result = await db.execute(select(models.DataSource))
    sources = result.scalars().all()
    
    # Return defaults if database has none onboarded yet
    if not sources:
        default_sources = [
            models.DataSource(
                id=1,
                name="Flat File (CSV)",
                type="csv",
                connection_type="api",
                endpoint="http://localhost:7000/legacy/csv",
                mapping_mode="ai",
                latency="12ms"
            ),
            models.DataSource(
                id=2,
                name="Hierarchical (XML)",
                type="xml",
                connection_type="api",
                endpoint="http://localhost:7000/legacy/xml",
                mapping_mode="ai",
                latency="45ms"
            ),
            models.DataSource(
                id=3,
                name="SOAP / WSDL",
                type="soap",
                connection_type="api",
                endpoint="http://localhost:7000/legacy/soap",
                mapping_mode="manual",
                latency="180ms"
            ),
            models.DataSource(
                id=4,
                name="Fixed-Width (Mainframe)",
                type="fixed_width",
                connection_type="api",
                endpoint="http://localhost:7000/legacy/fixed",
                mapping_mode="ai",
                latency="8ms"
            )
        ]
        return default_sources
        
    return sources


@router.get("/history", response_model=List[TransformedRecordOut], summary="Retrieve normalized data history logs")
async def get_transform_history(
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    result = await db.execute(
        select(models.TransformedRecord)
        .order_by(models.TransformedRecord.created_at.desc())
        .limit(20)
    )
    return result.scalars().all()


@router.get("/{adapter_type}/fetch", response_model=NormalizedResponse, summary="Fetch & normalize data via adapter")
async def fetch_via_adapter(
    adapter_type: str,
    endpoint: str = Query(default="customers", description="Legacy endpoint to call"),
    db: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user),
):
    # Map fixed_width mapping to fixed adapter if requested
    mapped_type = "fixed_width" if adapter_type == "fixed" else adapter_type
    adapter_cls = ADAPTER_MAP.get(mapped_type)
    if not adapter_cls:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Adapter '{adapter_type}' not found.")

    # 1. Cache Look-up
    redis = get_redis()
    cache_key = f"cache:{adapter_type}:{endpoint}"
    stale_key = f"stale:{adapter_type}:{endpoint}"
    
    try:
        cached_val = await redis.get(cache_key)
        if cached_val:
            data = json.loads(cached_val)
            await save_transformation_record(db, adapter_type, data, 0.0, True)
            
            CACHE_REQUESTS.labels(adapter_type=adapter_type, endpoint=endpoint, status="hit").inc()
            TRANSFORMATION_REQUESTS.labels(adapter_type=adapter_type, status="success").inc()
            TRANSFORMATION_LATENCY.labels(adapter_type=adapter_type).observe(0.0)
            
            return NormalizedResponse(
                normalized=data.get("records", data),
                adapter=data.get("adapter", adapter_cls.__name__),
                latency_ms=0.0,
                _cached=True,
                _legacy_down_serving_stale=False
            )
        else:
            CACHE_REQUESTS.labels(adapter_type=adapter_type, endpoint=endpoint, status="miss").inc()
    except Exception as e:
        logger.warning(f"Redis cache lookup failed: {e}")
        CACHE_REQUESTS.labels(adapter_type=adapter_type, endpoint=endpoint, status="miss").inc()

    # 2. Resilient Fetching & 3. Parsing/Normalization
    adapter = adapter_cls(base_url=settings.LEGACY_BASE_URL)
    start_time = time.time()
    
    try:
        async for attempt in AsyncRetrying(
            stop=stop_after_attempt(3),
            wait=wait_exponential(multiplier=1, min=1, max=8),
            retry=retry_if_exception_type((httpx.RequestError, httpx.HTTPStatusError, HTTPException)),
            reraise=True
        ):
            with attempt:
                result = await adapter.fetch(endpoint)
    except Exception as exc:
        logger.error(f"Downstream fetch failed after retries: {exc}. Activating stale-cache lookup.")
        
        # Increment custom Legacy Failure counter
        LEGACY_FAILURES.labels(adapter_type=adapter_type, endpoint=endpoint, error_type=type(exc).__name__).inc()
        
        # 5. Circuit Breaking / Stale Serve
        try:
            stale_val = await redis.get(stale_key)
            if stale_val:
                data = json.loads(stale_val)
                await save_transformation_record(db, adapter_type, data, 0.0, True)
                
                CACHE_REQUESTS.labels(adapter_type=adapter_type, endpoint=endpoint, status="stale").inc()
                TRANSFORMATION_REQUESTS.labels(adapter_type=adapter_type, status="success").inc()
                TRANSFORMATION_LATENCY.labels(adapter_type=adapter_type).observe(0.0)
                
                return NormalizedResponse(
                    normalized=data.get("records", data),
                    adapter=data.get("adapter", adapter_cls.__name__),
                    latency_ms=0.0,
                    _cached=True,
                    _legacy_down_serving_stale=True
                )
        except Exception as cache_err:
            logger.error(f"Failed to fetch stale cache from Redis: {cache_err}")
            
        TRANSFORMATION_REQUESTS.labels(adapter_type=adapter_type, status="failure").inc()
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Downstream legacy service is unavailable after repeated attempts, and no stale cache is present. Error: {str(exc)}"
        )

    latency_ms = (time.time() - start_time) * 1000

    # Record successful transformation latency & request outcomes
    TRANSFORMATION_REQUESTS.labels(adapter_type=adapter_type, status="success").inc()
    TRANSFORMATION_LATENCY.labels(adapter_type=adapter_type).observe(latency_ms / 1000.0)

    # 4. Cache & Respond
    try:
        await redis.setex(cache_key, settings.CACHE_TTL_SECONDS, json.dumps(result))
        await redis.set(stale_key, json.dumps(result))
    except Exception as cache_err:
        logger.warning(f"Failed to write to Redis cache: {cache_err}")

    # Persist the clean legacy output to PostgreSQL database for future analytics
    await save_transformation_record(db, adapter_type, result, latency_ms, False)

    return NormalizedResponse(
        normalized=result.get("records", result),
        adapter=result.get("adapter", adapter_cls.__name__),
        latency_ms=latency_ms,
        _cached=False,
        _legacy_down_serving_stale=False
    )
