import re
from .base import BaseAdapter
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.retry_engine.retry import fetch_with_retry


# Minimal SOAP envelope template
SOAP_ENVELOPE = """<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <GetData xmlns="http://legacy.slime.io/">
      <endpoint>{endpoint}</endpoint>
    </GetData>
  </soap:Body>
</soap:Envelope>"""


class SOAPAdapter(BaseAdapter):
    async def fetch(self, endpoint: str = "customers"):
        url = f"{self.base_url}/legacy/soap"
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url,
                content=SOAP_ENVELOPE.format(endpoint=endpoint),
                headers={"Content-Type": "text/xml; charset=utf-8"},
            )
        # Naive extraction of text values between tags
        pairs = re.findall(r"<(\w+)>(.*?)</\1>", resp.text, re.DOTALL)
        record = normalize_record({k: v for k, v in pairs if k not in ("Envelope", "Body", "GetDataResponse")})
        return self._normalize([record])
