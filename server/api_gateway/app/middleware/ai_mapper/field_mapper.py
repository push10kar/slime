"""AI-powered field mapper using OpenAI to semantically rename legacy fields."""
import json
from typing import Any, Dict
from app.core.config import settings


class AIFieldMapper:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            if not settings.OPENAI_API_KEY:
                return None
            from openai import AsyncOpenAI
            self._client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._client

    async def map_fields(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        client = self._get_client()
        if client is None:
            # Graceful fallback – return raw unchanged when no API key configured
            return {"warning": "OPENAI_API_KEY not set – AI mapping skipped", "raw": raw}

        prompt = (
            "You are a data normalization assistant. "
            "Given a dictionary with legacy field names, return a JSON object "
            "where every key is renamed to a clean, modern camelCase field name. "
            "Preserve the values exactly. Return only valid JSON, no explanation.\n\n"
            f"Input: {json.dumps(raw)}"
        )

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            max_tokens=500,
        )

        content = response.choices[0].message.content.strip()
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"raw_ai_response": content}
