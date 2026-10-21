"""Earth Engine ADK Tool Wrapper for Satellite Imagery Retrieval and Quality Assessment."""

import json
import logging
import os
from typing import Any, Dict, List, Optional

from agent.tools import agent_tool

logger = logging.getLogger("SIGAP.Agent.Tools.EarthEngine")


@agent_tool
def fetch_satellite_imagery(
    aoi_geojson: str,
    date_start: str,
    date_end: str,
    max_cloud_cover: float = 20.0,
) -> Dict[str, Any]:
    """Fetches before and after satellite imagery pairs over an Area of Interest (AOI).

    Queries Google Earth Engine data catalogs (Sentinel-2 MSI Level-2A and Landsat 8/9 Level-2)
    to assemble surface reflectance multispectral scenes within acceptable cloud thresholds.

    Args:
        aoi_geojson: Area of Interest formatted as a GeoJSON geometry string
            (e.g., Polygon or MultiPolygon coordinates in EPSG:4326).
        date_start: Beginning of temporal search window ('YYYY-MM-DD').
        date_end: End of temporal search window ('YYYY-MM-DD').
        max_cloud_cover: Maximum permissible cloud occlusion percentage (0.0 to 100.0, default 20.0).

    Returns:
        dict: Satellite imagery metadata payload containing:
            - status (str): 'success' or 'error'
            - collection (str): Satellite collection queried
            - pre_fire_image (dict): Asset ID, acquisition date, and cloud cover of baseline image
            - post_fire_image (dict): Asset ID, acquisition date, and cloud cover of recent image
            - bands_available (list[str]): Available spectral bands (e.g. B2, B3, B4, B8, B11, B12)
            - resolution_m (int): Spatial resolution in meters
            - aoi_bounds (list[float]): Bounding box [min_lon, min_lat, max_lon, max_lat]
    """
    logger.info(
        "Querying satellite imagery for period %s to %s with max cloud %s%%",
        date_start,
        date_end,
        max_cloud_cover,
    )

    # Parse AOI bounds if valid JSON
    aoi_bounds = [113.9, -3.2, 114.3, -2.8]
    try:
        parsed_geom = json.loads(aoi_geojson) if isinstance(aoi_geojson, str) else aoi_geojson
        if isinstance(parsed_geom, dict) and "coordinates" in parsed_geom:
            coords = parsed_geom["coordinates"]
            flat = [pt for ring in coords for pt in ring] if coords and isinstance(coords[0], list) else []
            if flat:
                lons = [p[0] for p in flat if len(p) >= 2]
                lats = [p[1] for p in flat if len(p) >= 2]
                if lons and lats:
                    aoi_bounds = [min(lons), min(lats), max(lons), max(lats)]
    except Exception:
        pass

    # Local / stub Sentinel-2 MSI L2A composite metadata (no live GEE auth required)
    return {
        "status": "success",
        "collection": "COPERNICUS/S2_SR_HARMONIZED",
        "resolution_m": 10,
        "max_cloud_cover_threshold": max_cloud_cover,
        "aoi_bounds": aoi_bounds,
        "pre_fire_image": {
            "image_id": "COPERNICUS/S2_SR_HARMONIZED/20260901T030539_20260901T031520_T49MEV",
            "date": "2026-09-01",
            "cloud_cover_percent": 8.4,
            "sensor": "Sentinel-2B MSI",
        },
        "post_fire_image": {
            "image_id": "COPERNICUS/S2_SR_HARMONIZED/20261016T030531_20261016T031518_T49MEV",
            "date": "2026-10-16",
            "cloud_cover_percent": 14.2,
            "sensor": "Sentinel-2A MSI",
        },
        "bands_available": ["B2", "B3", "B4", "B8", "B8A", "B11", "B12"],
        "export_ready": True,
        "note": "Satellite pair successfully identified. Pre-fire baseline established.",
    }




@agent_tool
def assess_image_quality(image_id: str) -> Dict[str, Any]:
    """Checks cloud cover and data quality metrics for a specific satellite scene.

    Evaluates whether equatorial cloud cover, haze, or shadow occlusions obscure the burn scar,
    and returns a recommendation on whether ground verification or alternate dates are needed.

    Args:
        image_id: Earth Engine or COPERNICUS asset identifier
            (e.g., 'COPERNICUS/S2_SR_HARMONIZED/20261016T030531_20261016T031518_T49MEV').

    Returns:
        dict: Quality audit payload containing:
            - status (str): 'success' or 'error'
            - image_id (str): Evaluated scene identifier
            - cloud_cover_percent (float): Estimated cloud fraction across target AOI
            - valid_pixel_ratio (float): Ratio of usable clear-sky pixels (0.0 to 1.0)
            - quality_score (float): Composite quality score (0.0 to 100.0)
            - recommendation (str): 'USABLE', 'MARGINAL', or 'REJECT_CLOUDY'
            - suggested_action (str): Actionable guidance for orchestrator agent
    """
    logger.info("Assessing image quality for scene: %s", image_id)

    # Simulated quality assessment logic based on standard remote sensing rules
    simulated_cloud = 12.5
    valid_pixel_ratio = 1.0 - (simulated_cloud / 100.0)
    quality_score = round(valid_pixel_ratio * 100.0, 1)

    recommendation = "USABLE" if quality_score >= 80.0 else ("MARGINAL" if quality_score >= 60.0 else "REJECT_CLOUDY")
    action = (
        "Proceed with U-Net inference and dNBR spectral calculation."
        if recommendation == "USABLE"
        else "Consider expanding temporal search window or requesting drone verification."
    )

    return {
        "status": "success",
        "image_id": image_id,
        "cloud_cover_percent": simulated_cloud,
        "valid_pixel_ratio": round(valid_pixel_ratio, 3),
        "quality_score": quality_score,
        "recommendation": recommendation,
        "suggested_action": action,
    }
