from fastapi import APIRouter, Depends
from app.routes.auth import get_current_user
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.ai_mapper.field_mapper import AIFieldMapper
from app.schemas.models import NormalizationRequest, NormalizedResponse
import time

router = APIRouter()
ai_mapper = AIFieldMapper()

@router.post("/normalize", response_model=NormalizedResponse, summary="Normalize a raw legacy record")
async def normalize(
    body: NormalizationRequest,
    _: str = Depends(get_current_user),
):
    start_time = time.time()
    
    normalized = normalize_record(body.raw_data)
    ai_mapped = None
    
    if body.use_ai:
        ai_mapped = await ai_mapper.map_fields(body.raw_data)

    latency_ms = (time.time() - start_time) * 1000

    return NormalizedResponse(
        normalized=normalized,
        ai_mapped=ai_mapped,
        adapter="SandboxTransformer",
        latency_ms=latency_ms,
        _cached=False,
        _legacy_down_serving_stale=False
    )
