"""SIGAP Backend — FastAPI application entry point."""

from contextlib import asynccontextmanager
from typing import Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.api.routes import (
        chat,
        hotspot,
        investigation,
        map as map_route,
        report,
    )
    from backend.config import get_settings
except ImportError:
    from api.routes import (
        chat,
        hotspot,
        investigation,
        map as map_route,
        report,
    )
    from config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan handler for FastAPI application startup and shutdown events."""
    settings = get_settings()
    # Startup actions
    print(f"🚀 Starting SIGAP Backend (Gemini Model: {settings.GEMINI_MODEL})...")
    # Stub: Initialize Google Earth Engine (GEE)
    # ee.Initialize(project=settings.EARTH_ENGINE_PROJECT)
    # Stub: Pre-load PyTorch U-Net model weights into memory / GPU
    # load_burned_area_model()

    yield

    # Shutdown actions
    print("🛑 Shutting down SIGAP Backend...")


app = FastAPI(
    title="SIGAP Backend API",
    description="Autonomous Wildfire Investigation & Response Prioritization Platform (Google ADK Multi-Agent)",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers under /api prefix
app.include_router(investigation.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(hotspot.router, prefix="/api")
app.include_router(map_route.router, prefix="/api")
app.include_router(report.router, prefix="/api")


@app.get("/", tags=["General"])
async def root() -> dict[str, Any]:
    """Root endpoint welcoming clients to SIGAP API."""
    return {
        "service": "SIGAP — Agen Karhutla",
        "description": "Autonomous Wildfire Investigation & Response Prioritization Platform",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Monitoring"])
async def health_check() -> dict[str, str]:
    """Liveness probe returning service health status."""
    return {
        "status": "healthy",
        "service": "sigap-backend",
    }


@app.get("/ready", tags=["Monitoring"])
async def readiness_check() -> dict[str, Any]:
    """Readiness probe checking backend configuration and external dependencies."""
    settings = get_settings()
    return {
        "status": "ready",
        "service": "sigap-backend",
        "dependencies": {
            "google_cloud_project": bool(settings.GOOGLE_CLOUD_PROJECT),
            "earth_engine_configured": bool(settings.EARTH_ENGINE_PROJECT),
            "nasa_firms_configured": bool(settings.NASA_FIRMS_API_KEY),
            "redis_url": settings.REDIS_URL,
        },
    }
