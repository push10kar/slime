from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    role: str = "user"

class UserInDB(User):
    hashed_password: str

class NormalizationRequest(BaseModel):
    raw_data: Dict[str, Any]
    use_ai: bool = False

class NormalizedResponse(BaseModel):
    normalized: Any
    ai_mapped: Optional[Dict[str, Any]] = None
    adapter: Optional[str] = None
    latency_ms: float
    cached: bool = Field(default=False, alias="_cached")
    legacy_down_serving_stale: bool = Field(default=False, alias="_legacy_down_serving_stale")

    model_config = {
        "populate_by_name": True,
        "serialize_by_alias": True
    }

class DataSourceCreate(BaseModel):
    name: str
    type: str
    connection_type: str
    endpoint: Optional[str] = None
    mapping_mode: str = "ai"
    manual_mapping: Optional[str] = None

class DataSourceOut(BaseModel):
    id: int
    name: str
    type: str
    connection_type: str
    endpoint: Optional[str] = None
    mapping_mode: str
    manual_mapping: Optional[str] = None
    latency: str
    created_at: datetime

    class Config:
        from_attributes = True

class TransformedRecordOut(BaseModel):
    id: int
    adapter_type: str
    payload_preview: str
    latency_ms: float
    cached: bool
    created_at: datetime

    class Config:
        from_attributes = True
