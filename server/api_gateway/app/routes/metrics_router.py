from fastapi import APIRouter, Depends
from app.routes.auth import get_current_user
from prometheus_client import REGISTRY, generate_latest, CONTENT_TYPE_LATEST
from fastapi.responses import PlainTextResponse

router = APIRouter()


@router.get("/summary", summary="Return basic Prometheus metrics summary")
async def metrics_summary(_: str = Depends(get_current_user)):
    return {"message": "Visit /metrics for full Prometheus-format metrics."}


@router.get("/raw", response_class=PlainTextResponse, include_in_schema=False)
async def raw_metrics():
    return PlainTextResponse(
        generate_latest(REGISTRY).decode("utf-8"),
        media_type=CONTENT_TYPE_LATEST,
    )
