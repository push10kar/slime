"""AI-powered field mapper using OpenAI to semantically rename legacy fields with robust fallback mechanisms."""
import json
import re
import asyncio
from typing import Any, Dict
from app.core.config import settings
from app.middleware.transformers.normalizer import normalize_record

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
        """Asynchronously maps dynamic legacy field names to clean camelCase fields using OpenAI GPT-4o-mini, 
        featuring explicit timeout bounds and a resilient local normalizer fallback.
        """
        client = self._get_client()
        
        def local_fallback(data: Dict[str, Any]) -> Dict[str, Any]:
            # Run our deterministic normalizer as a local schema fallback
            return normalize_record(data)

        # If API key is missing, trigger deterministic fallback mapping immediately
        if client is None:
            return local_fallback(raw)

        prompt = (
            "You are a telemetry data normalization assistant.\n"
            "Given a dictionary with legacy/messy/abbreviated field names, return a JSON object "
            "where every key is converted to a clean, modern camelCase name.\n"
            "Preserve all values exactly as they are without modification.\n"
            "Return only valid JSON. Do not include markdown wraps, explanation, or preamble.\n\n"
            f"Input: {json.dumps(raw)}"
        )

        try:
            # Protect downstream operations by applying a strict 6-second timeout limit
            response = await asyncio.wait_for(
                client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a raw JSON emitter. Never wrap response in markdown code blocks."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.0,
                    max_tokens=1000,
                ),
                timeout=6.0
            )
            
            content = response.choices[0].message.content.strip()
            
            # Remove Markdown block tags if outputted by the model
            if content.startswith("```"):
                content = re.sub(r"^```(?:json)?\n|```$", "", content, flags=re.MULTILINE).strip()
                
            return json.loads(content)
            
        except Exception:
            # Fallback to local parsing logic on timeouts, connection failures, or JSON errors
            return local_fallback(raw)
