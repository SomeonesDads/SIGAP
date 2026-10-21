"""Hotspot and clustering models for SIGAP."""

from pydantic import BaseModel, Field


class Hotspot(BaseModel):
    """Thermal anomaly point detected by satellite sensors (VIIRS / MODIS)."""

    latitude: float = Field(..., description="Latitude coordinate in WGS84")
    longitude: float = Field(..., description="Longitude coordinate in WGS84")
    acq_date: str = Field(..., description="Acquisition date (YYYY-MM-DD)")
    acq_time: str = Field(..., description="Acquisition time (HHMM UTC)")
    confidence: str = Field(..., description="Detection confidence (e.g. 'l', 'n', 'h' or percentage)")
    frp: float | None = Field(default=None, description="Fire Radiative Power in Megawatts (MW)")
    satellite: str = Field(..., description="Satellite sensor source (e.g. 'SNPP', 'NOAA-20', 'Terra', 'Aqua')")
    brightness: float | None = Field(default=None, description="Brightness temperature in Kelvin")


class HotspotCluster(BaseModel):
    """Spatially clustered group of thermal anomalies."""

    cluster_id: int = Field(..., description="Cluster identifier")
    centroid_lat: float = Field(..., description="Latitude of cluster centroid")
    centroid_lon: float = Field(..., description="Longitude of cluster centroid")
    hotspot_count: int = Field(..., description="Number of hotspots in this cluster")
    total_frp: float | None = Field(default=None, description="Aggregated Fire Radiative Power (MW)")
    date_range: str = Field(..., description="Date range spanned by the cluster (e.g. '2026-10-14 to 2026-10-21')")
    hotspots: list[Hotspot] = Field(default_factory=list, description="List of individual hotspots in cluster")


class HotspotQuery(BaseModel):
    """Filter parameters for querying thermal anomaly hotspots."""

    region: str = Field(..., description="Target region or province name (e.g. 'Riau', 'Kalimantan Tengah')")
    date_start: str = Field(..., description="Start acquisition date (YYYY-MM-DD)")
    date_end: str = Field(..., description="End acquisition date (YYYY-MM-DD)")
    source: str = Field(default="VIIRS_SNPP_NRT", description="Thermal sensor product name")
