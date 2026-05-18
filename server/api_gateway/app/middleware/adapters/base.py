from abc import ABC, abstractmethod
from typing import Any, Dict, List

class BaseAdapter(ABC):
    def __init__(self, base_url: str):
        self.base_url = base_url

    @abstractmethod
    async def parse(self, raw_data: str) -> List[Dict[str, Any]]:
        """Parse raw data string (CSV, XML, SOAP, Fixed-Width) into normalized Python list of dicts."""
        pass

    @abstractmethod
    async def fetch(self, endpoint: str) -> Dict[str, Any]:
        """Connect to source, parse, normalize fields, validate, return unified schema."""
        pass

    def _normalize(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "adapter": self.__class__.__name__,
            "count": len(records),
            "records": records,
        }
