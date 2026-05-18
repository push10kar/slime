"""Field normalizer – converts messy legacy keys to clean camelCase equivalents."""
import re
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
    """Convert snake_case to camelCase."""
    components = snake_str.lower().split("_")
    return components[0] + "".join(x.title() for x in components[1:])


def normalize_key(key: str) -> str:
    clean = key.strip().lower()
    return FIELD_MAP.get(clean, _to_camel(clean))


def normalize_value(value: Any) -> Any:
    if isinstance(value, str):
        v = value.strip()
        # Coerce boolean-like flags
        if v in ("Y", "1", "true", "TRUE"):
            return True
        if v in ("N", "0", "false", "FALSE"):
            return False
        # Coerce numeric strings
        try:
            return int(v)
        except ValueError:
            pass
        try:
            return float(v)
        except ValueError:
            pass
        return v
    return value


def normalize_record(record: Dict[str, Any]) -> Dict[str, Any]:
    return {normalize_key(k): normalize_value(v) for k, v in record.items()}
