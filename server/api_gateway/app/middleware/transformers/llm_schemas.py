from pydantic import BaseModel, Field
from typing import List, Dict, Any

class LLMTransformationResult(BaseModel):
    detected_format: str = Field(description="The detected legacy format: 'CSV', 'XML', 'SOAP', or 'FIXED_WIDTH'")
    confidence_score: float = Field(description="Confidence score between 0.0 and 1.0")
    detected_fields_mapping: Dict[str, str] = Field(description="Map of old_cryptic_header -> new_camelCase_header")
    normalized_records: List[Dict[str, Any]] = Field(description="The actual parsed data array, fully coerced into clean camelCase JSON with proper data types (booleans as true/false, numbers as floats/ints)")
