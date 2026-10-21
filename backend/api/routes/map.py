"""Map visualization and spatial data layers for SIGAP."""

from typing import Any
from fastapi import APIRouter

router = APIRouter(prefix="/map", tags=["Map"])


@router.get("/layers")
async def get_map_layers() -> list[dict[str, Any]]:
    """Get list of available GIS and remote sensing map layers."""
    return [
        {
            "id": "osm-standard",
            "name": "OpenStreetMap Standard",
            "type": "basemap",
            "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            "attribution": "© OpenStreetMap contributors",
            "default_visible": True,
        },
        {
            "id": "satellite-google",
            "name": "Satellite Imagery (GEE)",
            "type": "satellite",
            "url": "https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
            "attribution": "© Google Earth Engine",
            "default_visible": False,
        },
        {
            "id": "peatland-indonesia",
            "name": "Peta Sebaran Lahan Gambut (KLHK)",
            "type": "thematic_vector",
            "url": "/api/map/layers/peatland.geojson",
            "attribution": "Kementerian Lingkungan Hidup dan Kehutanan",
            "default_visible": True,
        },
        {
            "id": "dnbr-burn-severity",
            "name": "Burn Severity (dNBR)",
            "type": "raster_overlay",
            "url": "/api/map/layers/dnbr_tile/{z}/{x}/{y}",
            "attribution": "SIGAP Remote Sensing Engine",
            "default_visible": True,
        },
    ]


@router.get("/imagery/{investigation_id}")
async def get_investigation_imagery(investigation_id: str) -> dict[str, Any]:
    """Get metadata and tile URLs for pre- and post-fire satellite imagery."""
    return {
        "investigation_id": investigation_id,
        "satellite": "Sentinel-2 MSI",
        "pre_fire": {
            "date": "2026-09-15",
            "cloud_cover_percentage": 4.2,
            "bands": ["B2", "B3", "B4", "B8", "B11", "B12"],
            "rgb_tile_url": f"/tiles/{investigation_id}/pre/rgb/{{z}}/{{x}}/{{y}}.png",
            "false_color_tile_url": f"/tiles/{investigation_id}/pre/swir/{{z}}/{{x}}/{{y}}.png",
        },
        "post_fire": {
            "date": "2026-10-18",
            "cloud_cover_percentage": 2.1,
            "bands": ["B2", "B3", "B4", "B8", "B11", "B12"],
            "rgb_tile_url": f"/tiles/{investigation_id}/post/rgb/{{z}}/{{x}}/{{y}}.png",
            "false_color_tile_url": f"/tiles/{investigation_id}/post/swir/{{z}}/{{x}}/{{y}}.png",
        },
    }


@router.get("/segmentation/{investigation_id}")
async def get_segmentation_results(investigation_id: str) -> dict[str, Any]:
    """Get burned area segmentation results from the PyTorch U-Net inference model."""
    return {
        "investigation_id": investigation_id,
        "model": "U-Net Peatland Burned Area (ResNet34 backbone)",
        "burned_area_hectares": 128.5,
        "pixel_resolution_meters": 10.0,
        "geojson": {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [114.115, -2.448],
                                [114.135, -2.448],
                                [114.135, -2.468],
                                [114.115, -2.468],
                                [114.115, -2.448],
                            ]
                        ],
                    },
                    "properties": {
                        "burn_severity": "High Severity",
                        "dnbr_mean": 0.58,
                        "land_type": "Gambut Lindung",
                    },
                }
            ],
        },
    }
