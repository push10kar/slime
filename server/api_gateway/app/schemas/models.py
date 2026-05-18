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
