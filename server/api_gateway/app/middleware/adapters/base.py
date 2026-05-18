"""Base adapter interface – all adapters implement this contract."""
from abc import ABC, abstractmethod
from typing import Any, Dict, List


class BaseAdapter(ABC):
    def __init__(self, base_url: str):
        self.base_url = base_url

    @abstractmethod
    async def fetch(self, endpoint: str) -> Dict[str, Any]:
        """Connect to source, parse, normalize fields, validate, return unified schema."""
        ...

    def _normalize(self, records: List[Dict]) -> Dict[str, Any]:
        return {
            "adapter": self.__class__.__name__,
            "count": len(records),
            "records": records,
        }
