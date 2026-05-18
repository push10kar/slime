from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from prometheus_fastapi_instrumentator import Instrumentator

from app.core.config import settings
from app.core.database import init_db
from app.core.redis_client import init_redis, close_redis
from app.routes import health, adapters, transform, auth, metrics_router, upload


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup – graceful if DB/Redis not available (dev without Docker)
    try:
        await init_db()
    except Exception as e:
        print(f"⚠️  DB init skipped (not connected): {e}")
    try:
        await init_redis()
    except Exception as e:
        print(f"⚠️  Redis init skipped (not connected): {e}")
    yield
    # Shutdown
    try:
        await close_redis()
    except Exception:
        pass


app = FastAPI(
    title="Legacy Modernization Gateway",
    description=(
        "AI-powered enterprise legacy modernization gateway that converts "
        "unstable legacy systems into resilient, observable, production-ready REST APIs."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Prometheus Metrics ───────────────────────────────────────────────────────
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

# ─── Routes ──────────────────────────────────────────────────────────────────
app.include_router(health.router, tags=["Health"])
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(adapters.router, prefix="/adapters", tags=["Adapters"])
app.include_router(transform.router, prefix="/transform", tags=["Transform"])
app.include_router(upload.router, prefix="/transform/upload-file", tags=["Intelligent File Transform"])
app.include_router(metrics_router.router, prefix="/api/metrics", tags=["Metrics"])
