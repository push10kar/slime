import xml.etree.ElementTree as ET
from typing import Any, Dict, List
import re
from .base import BaseAdapter
from app.middleware.transformers.normalizer import normalize_record
from app.middleware.retry_engine.retry import fetch_with_retry

class XMLAdapter(BaseAdapter):
    def _strip_namespace(self, xml_str: str) -> str:
        """Strips XML namespaces to simplify processing and avoid tag search errors."""
        # Strip xmlns attributes
        clean = re.sub(r'\sxmlns(?::\w+)?="[^"]+"', '', xml_str)
        # Strip prefix namespace definitions from tag labels (e.g. <soap:Body> -> <Body>)
        clean = re.sub(r'</?(\w+):(\w+)(?=\s|>)', r'<\1\2', clean) # converts prefixes to flat strings
        return clean

    async def parse(self, raw_data: str) -> List[Dict[str, Any]]:
        """Parses XML, cleans namespaces/envelopes, and returns a flat record dictionary structure."""
        if not raw_data.strip():
            return []
            
        clean_xml = self._strip_namespace(raw_data)
        
        # Strip SOAP wrapper tags cleanly if found
        clean_xml = re.sub(r'</?(?:soap|soapenv|Envelope|Body|Header)[^>]*?>', '', clean_xml).strip()
        
        try:
            # Wrap in root element if the cleaned xml has multiple siblings without single root
            if not clean_xml.startswith("<dataset>") and not clean_xml.startswith("<record>") and not clean_xml.startswith("<"):
                clean_xml = f"<dataset>{clean_xml}</dataset>"
            elif not clean_xml.startswith("<dataset>") and clean_xml.count("<record>") > 1:
                clean_xml = f"<dataset>{clean_xml}</dataset>"
            
            root = ET.fromstring(clean_xml)
        except ET.ParseError:
            # High-resilience regex backup: extract all tags and their text directly
            records = []
            xml_records = re.findall(r'<record>(.*?)</record>', clean_xml, re.DOTALL)
            if not xml_records:
                # Parse as flat dictionary if there are no records
                pairs = re.findall(r'<(\w+)>(.*?)</\1>', clean_xml, re.DOTALL)
                row = {}
                for k, v in pairs:
                    tag = k.strip().lower()
                    val = v.strip()
                    if val in ("N/A", "n/a", "NULL", "null", "NONE", "none", ""):
                        val = None
                    row[tag] = val
                if row:
                    return [normalize_record(row)]
                return []
                
            for item in xml_records:
                pairs = re.findall(r'<(\w+)>(.*?)</\1>', item, re.DOTALL)
                row = {}
                for k, v in pairs:
                    tag = k.strip().lower()
                    val = v.strip()
                    if val in ("N/A", "n/a", "NULL", "null", "NONE", "none", ""):
                        val = None
                    row[tag] = val
                records.append(normalize_record(row))
            return records

        records = []
        # If root itself is a record element, parse directly
        if root.tag.lower() == "record":
            row = {}
            for el in root.iter():
                if el == root or not el.tag:
                    continue
                tag = el.tag.split('}')[-1].lower()
                val = el.text.strip() if el.text else None
                if val in ("N/A", "n/a", "NULL", "null", "NONE", "none", ""):
                    val = None
                row[tag] = val
            return [normalize_record(row)]

        # Search for children (e.g. dataset -> record nodes)
        children = list(root)
        for child in children:
            row = {}
            for el in child.iter():
                if el == child or not el.tag:
                    continue
                tag = el.tag.split('}')[-1].lower()
                val = el.text.strip() if el.text else None
                if val in ("N/A", "n/a", "NULL", "null", "NONE", "none", ""):
                    val = None
                row[tag] = val
            if row:
                records.append(normalize_record(row))
                
        return records

    async def fetch(self, endpoint: str = "customers") -> Dict[str, Any]:
        """Fetches XML data from target URL, parses it, and maps it to standardized format."""
        url = f"{self.base_url}/legacy/xml/{endpoint}"
        response = await fetch_with_retry(url)
        records = await self.parse(response.text)
        return self._normalize(records)
