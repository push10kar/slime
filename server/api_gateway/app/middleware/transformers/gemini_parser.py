import os
import asyncio
import logging
from google import genai
from google.genai import types
from app.middleware.transformers.llm_schemas import LLMTransformationResult

logger = logging.getLogger("api_gateway.gemini_parser")

class GeminiLegacyParser:
    def __init__(self):
        from app.core.config import settings
        self.api_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY")
        if self.api_key:
            self.client = genai.Client(api_key=self.api_key)
        else:
            self.client = None

    async def parse_legacy_file(self, file_content: str) -> LLMTransformationResult:
        if not self.client:
            raise ValueError("GEMINI_API_KEY is not configured in settings.")

        prompt = f"""
        You are an expert enterprise data modernizer. Analyze the following raw, chaotic legacy file content dump.
        
        Tasks:
        1. Classify the layout format (CSV, XML, SOAP, or Fixed-Width).
        2. Map all cryptic system codes or abbreviations to clean, standard camelCase properties (e.g., 'CUST_ID' -> 'customerId', 'ACT_FLG' -> 'isActive', 'BAL' -> 'balance', 'DT' -> 'date').
        3. Parse every single row/record into a fully clean JSON object. 
        4. Coerce values: transform 'Y'/'N' or '1'/'0' string indicators into actual JSON boolean primitives (true/false). Strip all trailing whitespaces or padding blocks from names. Ensure currency strings are parsed into clean numeric floats.
        
        CRITICAL: Your entire response must be a single raw JSON object EXACTLY matching this structure:
        {{
            "detected_format": "The structural format (e.g., 'CSV')",
            "confidence_score": 0.95,
            "detected_fields_mapping": {{ "original_cryptic_header": "normalizedCamelCase" }},
            "normalized_records": [ {{ "normalizedCamelCase": "typed_value" }} ]
        }}
        
        Raw Legacy Content:
        \"\"\"
        {file_content}
        \"\"\"
        """

        try:
            # Run synchronous Gemini SDK call in a thread to avoid blocking the async event loop
            def _call_gemini():
                return self.client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    ),
                )

            response = await asyncio.to_thread(_call_gemini)
            return LLMTransformationResult.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Gemini LLM transformation failed: {e}")
            raise ValueError(f"Failed to transform legacy file using Gemini API: {str(e)}")

