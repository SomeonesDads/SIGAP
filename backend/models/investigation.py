"""Investigation models for SIGAP."""

from datetime import datetime
from enum import Enum
from typing import Any, Literal
from pydantic import BaseModel, Field


class InvestigationStatus(str, Enum):
    """Lifecycle statuses for wildfire investigations."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    NEEDS_VERIFICATION = "needs_verification"


class InvestigationCreate(BaseModel):
    """Payload to trigger an autonomous wildfire investigation."""

    query: str | None = Field(default=None, description="Natural language prompt or query for the investigation")
    prompt: str | None = Field(default=None, description="Alias for query sent by client interfaces")
    region: str | None = Field(default=None, description="Target region or administrative boundary")
    date_start: str | None = Field(default=None, description="Start date for analysis window (YYYY-MM-DD)")
    date_end: str | None = Field(default=None, description="End date for analysis window (YYYY-MM-DD)")

    def get_query(self) -> str:
        """Return either query or prompt string."""
        return self.query or self.prompt or "Analisis karhutla"


class InvestigationResponse(BaseModel):
    """Investigation status, metadata, and aggregated agent findings."""

    id: str = Field(..., description="Unique investigation identifier")
    status: str = Field(..., description="Current status of the investigation")
    query: str = Field(..., description="Original user query")
    region: str | None = Field(default=None, description="Target region")
    created_at: datetime = Field(..., description="Timestamp when investigation was initiated")
    updated_at: datetime | None = Field(default=None, description="Timestamp when investigation was last updated")
    results: dict[str, Any] | None = Field(default=None, description="Aggregated findings from the multi-agent pipeline")


class VerificationRequest(BaseModel):
    """Human-in-the-loop verification request for high-risk findings."""

    status: Literal["confirmed", "unconfirmed", "needs_field_check"] = Field(
        ..., description="Verification verdict from field officers or analysts"
    )
    notes: str = Field(default="", description="Field observation notes or supervisor remarks")
    verified_by: str = Field(default="", description="Identifier of the verifier / field officer")
