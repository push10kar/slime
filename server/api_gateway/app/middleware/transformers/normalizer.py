"""Field normalizer – converts messy legacy keys and values to modern standard types."""
import re
from datetime import datetime
from typing import Any, Dict

# Known legacy-to-modern field mappings
FIELD_MAP = {
    "cust_nm": "customerName",
    "cust_id": "customerId",
    "customer_id": "customerId",
    "first_name": "firstName",
    "last_name": "lastName",
    "act_flg": "isActive",
    "bal": "balance",
    "dob": "dateOfBirth",
    "dt": "date",
    "amt": "amount",
    "acct_no": "accountNumber",
    "status": "status",
}

def _to_camel(snake_str: str) -> str:
    """Convert snake_case or messy_case to camelCase."""
    # Replace spaces or hyphens with underscores, clean non-alphanumeric
    cleaned = re.sub(r'[^a-zA-Z0-9_]', '', snake_str.replace(" ", "_").replace("-", "_"))
    components = cleaned.lower().split("_")
    components = [c for c in components if c]
    if not components:
        return snake_str
    return components[0] + "".join(x.title() for x in components[1:])

def normalize_key(key: str) -> str:
    """Normalize a legacy field key to clean camelCase standard key."""
    clean = key.strip().lower()
    return FIELD_MAP.get(clean, _to_camel(clean))

def parse_legacy_date(date_str: str) -> str:
    """Tries parsing several legacy date formats and standardizes to ISO-8601 YYYY-MM-DD."""
    if not date_str:
        return date_str
        
    clean_date = date_str.strip()
    
    # Supported legacy patterns in simulator
    date_formats = [
        "%d/%m/%y",   # e.g., 15/03/85
        "%m-%d-%Y",   # e.g., 03-15-1985
        "%Y%m%d",     # e.g., 19850315
        "%d %b %Y",   # e.g., 15 Mar 1985
        "%Y-%m-%d",   # standard ISO YYYY-MM-DD
        "%d/%m/%Y",   # e.g., 15/03/1985
        "%d-%m-%Y",   # e.g., 15-03-1985
    ]
    
    for fmt in date_formats:
        try:
            dt = datetime.strptime(clean_date, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
            
    return date_str

def normalize_value(value_or_key: Any, value: Any = None) -> Any:
    """Normalizes field values: coerces booleans, parses date patterns, and formats floats/ints."""
    # Support backward compatible single-argument call: normalize_value(value)
    if value is None:
        val = value_or_key
        key = ""
    else:
        val = value
        key = str(value_or_key)

    if isinstance(val, str):
        v = val.strip()
        
        # Coerce boolean-like flags
        if v in ("Y", "1", "true", "TRUE", "y", "Yes", "YES"):
            return True
        if v in ("N", "0", "false", "FALSE", "n", "No", "NO"):
            return False
            
        # Standardize date string chaos on date-like field keys
        if key and any(substring in key.lower() for substring in ("dob", "date", "dt", "birth")):
            standardized_date = parse_legacy_date(v)
            if standardized_date != v:
                return standardized_date
                
        # Coerce numeric strings
        try:
            if "." in v:
                return float(v)
            return int(v)
        except ValueError:
            pass
            
        return v
    return val

def normalize_record(record: Dict[str, Any]) -> Dict[str, Any]:
    """Applies normalization on keys and values of a single record dictionary."""
    normalized_rec = {}
    for k, v in record.items():
        norm_key = normalize_key(k)
        normalized_rec[norm_key] = normalize_value(norm_key, v)
    return normalized_rec
