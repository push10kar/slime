import csv
import io
from typing import Any, Dict, List
from .base import BaseAdapter
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.retry_engine.retry import fetch_with_retry

class CSVAdapter(BaseAdapter):
    async def parse(self, raw_data: str) -> List[Dict[str, Any]]:
        """Parses CSV strings, sanitizes casing, cleanses N/A fields, and normalizes records."""
        if not raw_data.strip():
            return []
            
        reader = csv.DictReader(io.StringIO(raw_data))
        records = []
        for row in reader:
            sanitized_row = {}
            for k, v in row.items():
                if k is None:
                    continue
                # Sanitize header key casing
                key = k.strip().lower()
                
                # Check for corrupted placeholder strings
                val = v.strip() if isinstance(v, str) else v
                if val in ("N/A", "n/a", "NULL", "null", "NONE", "none", ""):
                    val = None
                    
                sanitized_row[key] = val
                
            normalized = normalize_record(sanitized_row)
            records.append(normalized)
        return records

    async def fetch(self, endpoint: str = "customers") -> Dict[str, Any]:
        """Fetches CSV data with automatic retries, parses, and normalizes it."""
        url = f"{self.base_url}/legacy/csv/{endpoint}"
        response = await fetch_with_retry(url)
        records = await self.parse(response.text)
        return self._normalize(records)
