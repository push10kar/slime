from fastapi import APIRouter, Depends, Query, HTTPException, status
from app.routes.auth import get_current_user
from app.middleware.adapters.csv_adapter import CSVAdapter
from app.middleware.adapters.xml_adapter import XMLAdapter
from app.middleware.adapters.soap_adapter import SOAPAdapter
from app.middleware.adapters.fixed_width_adapter import FixedWidthAdapter
from app.core.config import settings
from app.core.redis_client import get_redis
from app.schemas.models import NormalizedResponse
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

@router.get("/", summary="List available adapters")
async def list_adapters(_: str = Depends(get_current_user)):
    return {"adapters": list(ADAPTER_MAP.keys())}

@router.get("/{adapter_type}/fetch", response_model=NormalizedResponse, summary="Fetch & normalize data via adapter")
async def fetch_via_adapter(
    adapter_type: str,
    endpoint: str = Query(default="customers", description="Legacy endpoint to call"),
    _: str = Depends(get_current_user),
):
    adapter_cls = ADAPTER_MAP.get(adapter_type)
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
            return NormalizedResponse(
                normalized=data.get("records", data),
                adapter=data.get("adapter", adapter_cls.__name__),
                latency_ms=0.0,
                _cached=True,
                _legacy_down_serving_stale=False
            )
    except Exception as e:
        logger.warning(f"Redis cache lookup failed: {e}")

    # 2. Resilient Fetching & 3. Parsing/Normalization
    adapter = adapter_cls(base_url=settings.LEGACY_BASE_URL)
    start_time = time.time()
    
    try:
        # Explicit Tenacity orchestration inside the route to prove absolute resilience
        # Retries up to 3 times, exponential wait (1s min, 8s max), for HTTP errors or request exceptions
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
        
        # 5. Circuit Breaking / Stale Serve
        try:
            stale_val = await redis.get(stale_key)
            if stale_val:
                data = json.loads(stale_val)
                return NormalizedResponse(
                    normalized=data.get("records", data),
                    adapter=data.get("adapter", adapter_cls.__name__),
                    latency_ms=0.0,
                    _cached=True,
                    _legacy_down_serving_stale=True
                )
        except Exception as cache_err:
            logger.error(f"Failed to fetch stale cache from Redis: {cache_err}")
            
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=f"Downstream legacy service is unavailable after repeated attempts, and no stale cache is present. Error: {str(exc)}"
        )

    latency_ms = (time.time() - start_time) * 1000

    # 4. Cache & Respond
    try:
        # Cache standard payload with designated TTL
        await redis.setex(cache_key, settings.CACHE_TTL_SECONDS, json.dumps(result))
        # Keep a persistent backup for stale serving
        await redis.set(stale_key, json.dumps(result))
    except Exception as cache_err:
        logger.warning(f"Failed to write to Redis cache: {cache_err}")

    return NormalizedResponse(
        normalized=result.get("records", result),
        adapter=result.get("adapter", adapter_cls.__name__),
        latency_ms=latency_ms,
        _cached=False,
        _legacy_down_serving_stale=False
    )
