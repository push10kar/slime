from fastapi import APIRouter, Depends, Query
from app.routes.auth import get_current_user
from app.middleware.adapters.csv_adapter import CSVAdapter
from app.middleware.adapters.xml_adapter import XMLAdapter
from app.middleware.adapters.soap_adapter import SOAPAdapter
from app.middleware.adapters.fixed_width_adapter import FixedWidthAdapter
from app.core.config import settings

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


@router.get("/{adapter_type}/fetch", summary="Fetch & normalize data via adapter")
async def fetch_via_adapter(
    adapter_type: str,
    endpoint: str = Query(default="customers", description="Legacy endpoint to call"),
    _: str = Depends(get_current_user),
):
    adapter_cls = ADAPTER_MAP.get(adapter_type)
    if not adapter_cls:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Adapter '{adapter_type}' not found.")

    adapter = adapter_cls(base_url=settings.LEGACY_BASE_URL)
    result = await adapter.fetch(endpoint)
    return result
