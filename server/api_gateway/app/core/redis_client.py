import redis.asyncio as aioredis
from app.core.config import settings

_redis_client: aioredis.Redis | None = None


async def init_redis():
    global _redis_client
    _redis_client = await aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
    )


async def close_redis():
    if _redis_client:
        await _redis_client.aclose()


def get_redis() -> aioredis.Redis:
    if _redis_client is None:
        raise RuntimeError("Redis client not initialized. Call init_redis() first.")
    return _redis_client
