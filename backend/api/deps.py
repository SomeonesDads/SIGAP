"""Dependency injection providers for SIGAP API."""

from functools import lru_cache
from typing import Any

try:
    from backend.config import Settings, get_settings
except ImportError:
    from config import Settings, get_settings


class FIRMSClientStub:
    """Stub client for NASA FIRMS (Fire Information for Resource Management System) API.

    In production, this client connects to NASA FIRMS REST API using the configured
    NASA_FIRMS_API_KEY to fetch active fire thermal anomalies (VIIRS / MODIS).
    """

    def __init__(self, api_key: str, base_url: str) -> None:
        self.api_key = api_key
        self.base_url = base_url

    async def get_area_hotspots(
        self,
        source: str,
        area: str,
        day_range: int = 1,
    ) -> list[dict[str, Any]]:
        """Stub method to retrieve thermal hotspots by bounding box or country."""
        return []


class EarthEngineClientStub:
    """Stub client for Google Earth Engine (GEE).

    In production, this client initializes ee.Initialize() with EARTH_ENGINE_PROJECT
    and GOOGLE_APPLICATION_CREDENTIALS, handling Landsat 8/9 and Sentinel-2 queries,
    cloud masking, and dNBR band calculations.
    """

    def __init__(self, project_id: str) -> None:
        self.project_id = project_id
        self.is_initialized = bool(project_id)

    def initialize(self) -> bool:
        """Initialize Google Earth Engine session."""
        self.is_initialized = True
        return True


@lru_cache
def get_cached_settings() -> Settings:
    """Provide cached application settings instance."""
    return get_settings()


def get_firms_client() -> FIRMSClientStub:
    """Dependency provider for NASA FIRMS client."""
    settings = get_cached_settings()
    return FIRMSClientStub(
        api_key=settings.NASA_FIRMS_API_KEY,
        base_url=settings.FIRMS_BASE_URL,
    )


def get_earth_engine_client() -> EarthEngineClientStub:
    """Dependency provider for Google Earth Engine client."""
    settings = get_cached_settings()
    return EarthEngineClientStub(
        project_id=settings.EARTH_ENGINE_PROJECT,
    )
