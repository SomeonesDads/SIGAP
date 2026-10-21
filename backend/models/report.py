"""Report models for SIGAP."""

from datetime import datetime
from typing import Any
from pydantic import BaseModel, Field


class ReportMetadata(BaseModel):
    """Metadata describing an investigation report."""

    investigation_id: str = Field(..., description="Associated investigation ID")
    title: str = Field(..., description="Title of the generated report")
    generated_at: datetime = Field(..., description="Timestamp when report was compiled")
    language: str = Field(default="id", description="Language code (e.g. 'id' for Indonesian, 'en' for English)")
    format: str = Field(default="pdf", description="Document format (e.g. 'pdf', 'html', 'json')")


class ReportContent(BaseModel):
    """Comprehensive structured content of an investigation report."""

    executive_summary: str = Field(..., description="High-level synthesis for decision makers (BPBD, KLHK)")
    scope: str = Field(..., description="Geographical and temporal scope of the analysis")
    data_sources: list[str] = Field(default_factory=list, description="Sensors and datasets queried")
    hotspot_findings: dict[str, Any] | None = Field(default=None, description="Hotspot counts, clusters, and FRP trends")
    segmentation_results: dict[str, Any] | None = Field(default=None, description="Burn scar pixel area, centroid, and geometry")
    severity_analysis: dict[str, Any] | None = Field(default=None, description="dNBR severity breakdown")
    priority_recommendations: list[dict[str, Any]] = Field(default_factory=list, description="Ranked dispatch & mitigation actions")
    limitations: list[str] = Field(default_factory=list, description="Known analytical constraints or cloud coverage factors")
    next_steps: list[str] = Field(default_factory=list, description="Immediate operational steps for ground personnel")
