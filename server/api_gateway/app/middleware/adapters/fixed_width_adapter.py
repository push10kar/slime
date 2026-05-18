from .base import BaseAdapter
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.retry_engine.retry import fetch_with_retry

# Field-width spec: (field_name, start, end) — 1-indexed
FIELD_SPEC = [
    ("customer_id",  0, 10),
    ("first_name",  10, 25),
    ("last_name",   25, 40),
    ("dob",         40, 48),
    ("balance",     48, 60),
    ("status",      60, 61),
]


class FixedWidthAdapter(BaseAdapter):
    async def fetch(self, endpoint: str = "customers"):
        url = f"{self.base_url}/legacy/fixed/{endpoint}"
        response = await fetch_with_retry(url)
        records = []
        for line in response.text.splitlines():
            if not line.strip():
                continue
            row = {name: line[s:e].strip() for name, s, e in FIELD_SPEC}
            records.append(normalize_record(row))
        return self._normalize(records)
