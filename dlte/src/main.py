import os
from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel
from typing import List

from .engine import CopybookEngine
from .stream import StreamProcessor
from .cache import OffsetIndexer

app = FastAPI(title="Dynamic Legacy Transformation Engine")

# Define execution paths
CONFIG_PATH = "config/copybook_v1.yaml"
STORAGE_PATH = "storage/legacy_db.dat"
DLQ_PATH = "storage/quarantine.log"

# Initialize application core components
engine = CopybookEngine(CONFIG_PATH)
indexer = OffsetIndexer(STORAGE_PATH)
processor = StreamProcessor(engine, STORAGE_PATH, DLQ_PATH)

@app.on_event("startup")
def warm_up_index_layers():
    """Build byte-seek mappings before allowing traffic to enter."""
    indexer.build_index()

class CustomerSchema(BaseModel):
    id: int
    name: str
    status: str
    balance: float

@app.get("/customers", response_model=List[CustomerSchema])
def get_all_customers():
    """Utilizes chunked pipeline output safely for large datasets."""
    return list(processor.stream_records())

@app.get("/customers/{customer_id}", response_model=CustomerSchema)
def get_customer_by_id(customer_id: int):
    """Direct seek O(1) pointer lookup execution."""
    raw_bytes = indexer.seek_record(customer_id)
    if not raw_bytes:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Entity index mapping not found in legacy storage layout."
        )
    return engine.bytes_to_json(raw_bytes)

@app.post("/customers", status_code=status.HTTP_201_CREATED)
def write_legacy_record(payload: CustomerSchema):
    """Translates modern JSON data back to flat bytes and saves them to storage."""
    try:
        raw_output_bytes = engine.json_to_bytes(payload.dict())
        os.makedirs(os.path.dirname(STORAGE_PATH), exist_ok=True)
        with open(STORAGE_PATH, "ab") as f:
            f.write(raw_output_bytes + b"\n")
        
        # Incremental manual index re-sync
        indexer.build_index()
        return {"status": "Success", "message": "Record packed and appended successfully."}
    except ValueError as ex:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ex))
