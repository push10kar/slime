import re
from typing import Any, Dict, List
import httpx
from .base import BaseAdapter
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.retry_engine.retry import fetch_with_retry

# Minimal SOAP envelope template for calling legacy services
SOAP_ENVELOPE = """<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetData xmlns="http://legacy.slime.io/">
      <endpoint>{endpoint}</endpoint>
    </GetData>
  </soap:Body>
</soap:Envelope>"""

class SOAPAdapter(BaseAdapter):
    async def parse(self, raw_data: str) -> List[Dict[str, Any]]:
        """Parses a SOAP XML payload, strips SOAP envelopes/namespaces, and flattens elements."""
        if not raw_data.strip():
            return []
            
        # Extract tags and values using regular expressions to strip namespaces easily
        pairs = re.findall(r"<(\w+:\w+|\w+)>(.*?)</\1>", raw_data, re.DOTALL)
        
        # We also support parsing tags without namespace prefixes
        flat_pairs = []
        for tag, val in pairs:
            clean_tag = tag.split(":")[-1].lower()
            flat_pairs.append((clean_tag, val))
            
        soap_tags = ("envelope", "body", "getdataresponse", "getdata", "fault", "header")
        
        record = {}
        for tag, val in flat_pairs:
            if tag in soap_tags:
                continue
            v = val.strip()
            if v in ("N/A", "n/a", "NULL", "null", "NONE", "none", ""):
                v = None
            record[tag] = v
            
        if record:
            return [normalize_record(record)]
        return []

    async def fetch(self, endpoint: str = "customers") -> Dict[str, Any]:
        """Makes an asynchronous POST request to the legacy SOAP service with retry mechanisms."""
        url = f"{self.base_url}/legacy/soap"
        
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                content=SOAP_ENVELOPE.format(endpoint=endpoint),
                headers={"Content-Type": "text/xml; charset=utf-8"},
            )
            resp.raise_for_status()
            
        records = await self.parse(resp.text)
        return self._normalize(records)
