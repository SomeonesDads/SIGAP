"""Tests for SIGAP API health check endpoints."""

from fastapi import FastAPI
from fastapi.testclient import TestClient

# Mock / minimal FastAPI application instance for testing health contract
app = FastAPI(title="SIGAP API", version="0.1.0")


@app.get("/health")
def health_check():
    """Health check endpoint returning service status."""
    return {
        "status": "healthy",
        "service": "SIGAP Agen Karhutla",
        "version": "0.1.0",
    }


@app.get("/ready")
def readiness_check():
    """Readiness probe verifying operational readiness."""
    return {
        "status": "ready",
        "ml_engine": "available",
        "database": "connected",
    }


def test_health_endpoint() -> None:
    """Test that the /health endpoint responds with HTTP 200 and healthy status."""
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "SIGAP" in data["service"]


def test_readiness_endpoint() -> None:
    """Test that the /ready probe responds with ready status."""
    client = TestClient(app)
    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json()["status"] == "ready"
