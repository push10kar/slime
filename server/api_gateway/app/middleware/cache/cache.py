"""Cache helpers – read-through cache using Redis."""
import json
from typing import Any, Callable, Optional
from app.core.redis_client import get_redis
from app.core.config import settings


async def get_cached(key: str) -> Optional[Any]:
    redis = get_redis()
    value = await redis.get(key)
    if value is None:
        return None
    return json.loads(value)


async def set_cached(key: str, value: Any, ttl: int = settings.CACHE_TTL_SECONDS):
    redis = get_redis()
    await redis.setex(key, ttl, json.dumps(value))


async def cached_or_fetch(key: str, fetch_fn: Callable, ttl: int = settings.CACHE_TTL_SECONDS):
    """Return cached value if present, otherwise call fetch_fn, cache result and return it."""
    cached = await get_cached(key)
    if cached is not None:
        return {**cached, "_cached": True}
    result = await fetch_fn()
    await set_cached(key, result, ttl)
    return result
