import xml.etree.ElementTree as ET
from .base import BaseAdapter
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.retry_engine.retry import fetch_with_retry


class XMLAdapter(BaseAdapter):
    async def fetch(self, endpoint: str = "customers"):
        url = f"{self.base_url}/legacy/xml/{endpoint}"
        response = await fetch_with_retry(url)
        root = ET.fromstring(response.text)
        records = []
        for child in root:
            row = {el.tag: el.text for el in child}
            records.append(normalize_record(row))
        return self._normalize(records)
