import csv, io
import httpx
from .base import BaseAdapter
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.retry_engine.retry import fetch_with_retry


class CSVAdapter(BaseAdapter):
    async def fetch(self, endpoint: str = "customers"):
        url = f"{self.base_url}/legacy/csv/{endpoint}"
        response = await fetch_with_retry(url)
        reader = csv.DictReader(io.StringIO(response.text))
        records = [normalize_record(dict(row)) for row in reader]
        return self._normalize(records)
