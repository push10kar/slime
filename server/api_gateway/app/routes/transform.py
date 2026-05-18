from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Any, Dict
from app.routes.auth import get_current_user
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.ai_mapper.field_mapper import AIFieldMapper

router = APIRouter()
ai_mapper = AIFieldMapper()


class TransformRequest(BaseModel):
    raw_data: Dict[str, Any]
    use_ai: bool = False


@router.post("/normalize", summary="Normalize a raw legacy record")
async def normalize(
    body: TransformRequest,
    _: str = Depends(get_current_user),
):
    normalized = normalize_record(body.raw_data)

    if body.use_ai:
        mapped = await ai_mapper.map_fields(body.raw_data)
        return {"normalized": normalized, "ai_mapped": mapped}

    return {"normalized": normalized}
