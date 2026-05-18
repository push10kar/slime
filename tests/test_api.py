"""Integration tests for the API gateway health and auth endpoints."""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../server/api_gateway"))

import pytest
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch


@pytest.fixture
async def client():
    # Patch DB and Redis init so they don't require running services
    with patch("app.core.database.init_db", new=AsyncMock()), \
         patch("app.core.redis_client.init_redis", new=AsyncMock()), \
         patch("app.core.redis_client.close_redis", new=AsyncMock()):
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            yield ac


@pytest.mark.asyncio
async def test_health(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_auth_missing_credentials(client):
    resp = await client.post("/auth/token", data={"username": "wrong", "password": "bad"})
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_auth_success(client):
    resp = await client.post("/auth/token", data={"username": "admin", "password": "admin"})
    assert resp.status_code == 200
    assert "access_token" in resp.json()
