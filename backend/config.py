"""Configuration settings for SIGAP Backend."""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables and .env file."""

    GOOGLE_CLOUD_PROJECT: str = ""
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
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
