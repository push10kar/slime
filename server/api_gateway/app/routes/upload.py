from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.routes.auth import get_current_user
from app.core.database import get_db
from app.core.redis_client import get_redis
from app.middleware.transformers.gemini_parser import GeminiLegacyParser
from app.middleware.transformers.llm_schemas import LLMTransformationResult
from app.schemas.models import TokenData

router = APIRouter()
gemini_parser = GeminiLegacyParser()

@router.post("", response_model=LLMTransformationResult, summary="Intelligent File Upload via Gemini")
async def upload_legacy_file(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        content_bytes = await file.read()
        raw_content = content_bytes.decode("utf-8")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file. Please ensure it's a valid text file. Error: {e}"
        )
        
    # 1. Gemini AI Parsing
    try:
        result = await gemini_parser.parse_legacy_file(raw_content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gemini intelligent transformation failed: {e}"
        )
        
    # 2. Log modernization transaction directly to PostgreSQL Audit History Ledger
    try:
        await db.execute(text("""
            CREATE TABLE IF NOT EXISTS modernization_audit_ledger (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255),
                filename VARCHAR(255),
                detected_format VARCHAR(50),
                confidence_score FLOAT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        await db.execute(text("""
            INSERT INTO modernization_audit_ledger (username, filename, detected_format, confidence_score)
            VALUES (:username, :filename, :format, :score)
        """), {
            "username": current_user.username,
            "filename": file.filename,
            "format": result.detected_format,
            "score": result.confidence_score
        })
        await db.commit()
    except Exception as e:
        await db.rollback()
        import logging
        logging.error(f"Failed to log transaction to PostgreSQL ledger: {e}")
        
    # 3. Cache clean output schema inside Redis
    try:
        redis = get_redis()
        cache_key = f"gemini_schema_cache:{file.filename}"
        await redis.setex(cache_key, 3600, result.model_dump_json())
    except Exception as e:
        import logging
        logging.warning(f"Failed to cache schema in Redis: {e}")
        
    return result
