from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    APP_NAME: str = "Legacy Modernization Gateway"
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = "change_me_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://slime:slime_secret@localhost:5432/slime_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 300  # 5 min default cache TTL

    # RabbitMQ
    RABBITMQ_URL: str = "amqp://slime:slime_secret@localhost:5672/"

    # Legacy simulator
    LEGACY_BASE_URL: str = "http://localhost:7000"
    LEGACY_TIMEOUT_SECONDS: int = 10

    # AI Mapping
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
    ]


settings = Settings()
