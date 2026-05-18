from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health", summary="Health check endpoint")
async def health():
    return {
        "status": "ok",
        "service": "Legacy Modernization Gateway",
        "timestamp": datetime.utcnow().isoformat(),
    }
