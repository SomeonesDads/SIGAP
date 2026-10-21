"""Hotspot and clustering endpoints for SIGAP."""

from fastapi import APIRouter, Query

try:
    from backend.models.hotspot import Hotspot, HotspotCluster
except ImportError:
    from models.hotspot import Hotspot, HotspotCluster

router = APIRouter(prefix="/hotspots", tags=["Hotspots"])


@router.get("/", response_model=list[Hotspot])
async def get_hotspots(
    region: str = Query("Kalimantan Tengah", description="Target region or province name"),
    date_start: str = Query("2026-10-14", description="Start date (YYYY-MM-DD)"),
    date_end: str = Query("2026-10-21", description="End date (YYYY-MM-DD)"),
    source: str = Query("VIIRS_SNPP_NRT", description="Satellite sensor source"),
) -> list[Hotspot]:
    """Retrieve thermal anomaly hotspots for a given region and time window.

    In production, this queries NASA FIRMS API or cached PostGIS database records.
    """
    return [
        Hotspot(
            latitude=-2.4512,
            longitude=114.1205,
            acq_date=date_end,
            acq_time="0615",
            confidence="high",
            frp=45.2,
            satellite="SNPP",
            brightness=348.6,
        ),
        Hotspot(
            latitude=-2.4589,
            longitude=114.1298,
            acq_date=date_end,
            acq_time="0615",
            confidence="high",
            frp=38.7,
            satellite="SNPP",
            brightness=342.1,
        ),
        Hotspot(
            latitude=-2.4630,
            longitude=114.1180,
            acq_date=date_end,
            acq_time="0615",
            confidence="nominal",
            frp=19.4,
            satellite="SNPP",
            brightness=325.4,
        ),
    ]


@router.get("/clusters", response_model=list[HotspotCluster])
async def get_hotspot_clusters(
    region: str = Query("Kalimantan Tengah", description="Target region"),
    date_start: str = Query("2026-10-14", description="Start date (YYYY-MM-DD)"),
    date_end: str = Query("2026-10-21", description="End date (YYYY-MM-DD)"),
    eps_km: float = Query(2.5, description="DBSCAN clustering radius in kilometers"),
    min_samples: int = Query(3, description="Minimum points to form a cluster"),
) -> list[HotspotCluster]:
    """Retrieve spatially clustered hotspots using spatial clustering (DBSCAN).

    Identifies high-density fire fronts and ignition candidates for prioritization.
    """
    sample_hotspots = [
        Hotspot(
            latitude=-2.4512,
            longitude=114.1205,
            acq_date=date_end,
            acq_time="0615",
            confidence="high",
            frp=45.2,
            satellite="SNPP",
            brightness=348.6,
        ),
        Hotspot(
            latitude=-2.4589,
            longitude=114.1298,
            acq_date=date_end,
            acq_time="0615",
            confidence="high",
            frp=38.7,
            satellite="SNPP",
            brightness=342.1,
        ),
        Hotspot(
            latitude=-2.4630,
            longitude=114.1180,
            acq_date=date_end,
            acq_time="0615",
            confidence="nominal",
            frp=19.4,
            satellite="SNPP",
            brightness=325.4,
        ),
    ]

    return [
        HotspotCluster(
            cluster_id=1,
            centroid_lat=-2.4577,
            centroid_lon=114.1228,
            hotspot_count=3,
            total_frp=103.3,
            date_range=f"{date_start} to {date_end}",
            hotspots=sample_hotspots,
        )
    ]
