"""Configuration settings for SIGAP Backend."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    GOOGLE_CLOUD_PROJECT: str = "hackathon-primestep-04"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    VERTEX_LOCATION: str = "us-west1"
    VERTEX_DINOV3_ENDPOINT_ID: str = "936548611376807936"
    DINOV3_ENDPOINT_URL: str = (
        "https://us-west1-aiplatform.googleapis.com/v1/"
        "projects/hackathon-primestep-04/locations/us-west1/endpoints/936548611376807936:predict"
    )
    EARTH_ENGINE_PROJECT: str = ""
    NASA_FIRMS_API_KEY: str = ""
    DATABASE_URL: str = ""
    REDIS_URL: str = "redis://localhost:6379/0"
    GEMINI_MODEL: str = "gemini-3.5-flash"
    FIRMS_BASE_URL: str = "https://firms.modaps.eosdis.nasa.gov"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Singleton provider for application settings."""
    return Settings()
