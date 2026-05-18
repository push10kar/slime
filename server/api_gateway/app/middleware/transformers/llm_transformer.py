"""Intelligent legacy file transformer using the modern google-genai SDK to parse and normalize raw datasets."""
import logging
from google import genai
from google.genai import types
from app.core.config import settings
from app.middleware.transformers.llm_schemas import LLMTransformationResult

logger = logging.getLogger("api_gateway.llm_transformer")

class GeminiTransformer:
    def __init__(self):
        self._client = None

    def _get_client(self) -> genai.Client:
        if self._client is None:
            if not settings.GEMINI_API_KEY:
                raise ValueError("GEMINI_API_KEY is not configured in settings.")
            # Initialize with the explicit key from settings
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    async def transform_legacy_file(self, file_content: str) -> LLMTransformationResult:
        """Asynchronously parses and normalizes unknown legacy files using gemini-2.5-flash with structured outputs."""
        client = self._get_client()

        prompt = (
            "You are an expert Enterprise Integration Architect.\n"
            "Analyze the following raw, unknown legacy file content:\n\n"
            "--- START OF LEGACY FILE ---\n"
            f"{file_content}\n"
            "--- END OF LEGACY FILE ---\n\n"
            "Perform the following tasks:\n"
            "1. Identify the structural format: 'CSV', 'XML', 'SOAP', or 'FIXED_WIDTH'.\n"
            "2. Deduce semantic meanings of obscure legacy headers/fields (e.g., CUST_NM -> customerName, ACT_FLG -> isActive, BAL -> balance, DOB -> dateOfBirth).\n"
            "3. Parse and transform the raw string records into a cleanly normalized, standardized camelCase JSON array matching standard enterprise schemas.\n"
            "4. Ensure numbers are parsed as float/int, and booleans as true/false."
        )

        try:
            # Generate content using gemini-2.5-flash and the pydantic response schema
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=LLMTransformationResult,
                    temperature=0.0,
                ),
            )
            
            # The structured response text can be parsed directly into our Pydantic model
            result = LLMTransformationResult.model_validate_json(response.text)
            return result

        except Exception as e:
            logger.error(f"Gemini LLM transformation failed: {e}")
            raise ValueError(f"Failed to transform legacy file using Gemini API: {str(e)}")
