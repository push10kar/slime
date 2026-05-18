from typing import Any, Dict, List
from .base import BaseAdapter
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.retry_engine.retry import fetch_with_retry

# Field-width spec: (field_name, start, end)
FIELD_SPEC = [
    ("customer_id",  0, 10),
    ("first_name",  10, 25),
    ("last_name",   25, 40),
    ("dob",         40, 48),
    ("balance",     48, 60),
    ("status",      60, 61),
]

class FixedWidthAdapter(BaseAdapter):
    async def parse(self, raw_data: str) -> List[Dict[str, Any]]:
        """Parses mainframe fixed-width lines using offset slices and strips whitespace cleanly."""
        records = []
        for line in raw_data.splitlines():
            if not line.strip():
                continue
            # Pad line if it is shorter than the max expected column offset
            line_padded = line.ljust(61)
            row = {}
            for name, start, end in FIELD_SPEC:
                val = line_padded[start:end].strip()
                # Treat empty strings or placeholders as None
                if val in ("N/A", "n/a", "NULL", "null", "NONE", "none", ""):
                    val = None
                row[name] = val
                
            records.append(normalize_record(row))
        return records

    async def fetch(self, endpoint: str = "customers") -> Dict[str, Any]:
        """Fetches fixed-width data asynchronously and returns adapted normalized JSON."""
        url = f"{self.base_url}/legacy/fixed/{endpoint}"
        response = await fetch_with_retry(url)
        records = await self.parse(response.text)
        return self._normalize(records)
