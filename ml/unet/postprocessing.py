"""Geospatial post-processing for burned area segmentation masks.

Converts pixel-level binary predictions into vector polygon geometries (GeoJSON / Shapefile),
calculates accurate surface area in hectares via equal-area projections,
and filters noise / spurious false positive patches.
"""

import logging
from typing import Any, Dict, List, Optional, Union

import numpy as np

logger = logging.getLogger("SIGAP.ML.Postprocessing")


def mask_to_polygons(
    mask: np.ndarray,
    transform: Any,
    crs: Any = "EPSG:4326",
) -> Any:
    """Vectorize a binary raster mask into a GeoDataFrame of burn scar polygons.

    Args:
        mask: 2D binary numpy array (H, W) where 1 indicates burned area and 0 unburned.
        transform: Affine transform mapping pixel coordinates to geographic coordinates.
        crs: Coordinate Reference System (e.g., 'EPSG:4326', 'EPSG:32648').

    Returns:
        geopandas.GeoDataFrame containing vectorized polygon geometries with attributes:
            - geometry: Shapely Polygon or MultiPolygon
            - burn_class: 1
            - area_ha: Surface area in hectares
    """
    try:
        import geopandas as gpd
        from shapely.geometry import shape
        import rasterio.features
    except ImportError:
        logger.warning("geopandas, shapely, or rasterio is missing. Returning stub dict representation.")
        return {
            "type": "FeatureCollection",
            "features": [],
            "crs": str(crs),
            "_stub_note": "Install geopandas, shapely, and rasterio for native GeoDataFrame support.",
        }

    binary_mask = (mask > 0).astype(np.uint8)

    # Extract polygon geometries from pixel clusters
    shapes_gen = rasterio.features.shapes(
        binary_mask,
        mask=(binary_mask == 1),
        transform=transform,
    )

    records: List[Dict[str, Any]] = []
    for geom_dict, val in shapes_gen:
        if val == 1:
            geom = shape(geom_dict)
            if not geom.is_empty and geom.is_valid:
                records.append({"geometry": geom, "burn_class": 1})

    if not records:
        return gpd.GeoDataFrame(columns=["geometry", "burn_class", "area_ha"], crs=crs)

    gdf = gpd.GeoDataFrame(records, crs=crs)

    # Pre-calculate area in hectares for convenience
    gdf["area_ha"] = compute_area_per_polygon(gdf)
    return gdf


def compute_area_per_polygon(gdf: Any) -> List[float]:
    """Calculate area in hectares for individual geometries in a GeoDataFrame."""
    try:
        import geopandas as gpd
    except ImportError:
        return []

    if not isinstance(gdf, gpd.GeoDataFrame) or gdf.empty:
        return []

    # Reproject geographic coordinate systems (degrees) to equal-area projection (meters)
    source_gdf = gdf
    if source_gdf.crs and source_gdf.crs.is_geographic:
        # EPSG:6933 is World Cylindrical Equal Area (WGS 84)
        projected = source_gdf.to_crs("EPSG:6933")
    else:
        projected = source_gdf

    # Area in square meters / 10,000 = hectares
    areas_ha = (projected.geometry.area / 10000.0).tolist()
    return areas_ha


def compute_area(polygons: Any, crs: Optional[Any] = None) -> float:
    """Calculate total burned area in hectares from polygon geometries.

    Reprojects geographic coordinates (lat/lon in degrees) into an equal-area
    projection (World Cylindrical Equal Area, EPSG:6933) before computing square meters,
    then converts to hectares (1 ha = 10,000 m²).

    Args:
        polygons: geopandas.GeoDataFrame or list of geometries.
        crs: CRS of the input geometries if not already attached.

    Returns:
        Total burned area in hectares (float).
    """
    try:
        import geopandas as gpd
    except ImportError:
        logger.warning("geopandas not available. Returning 0.0 ha.")
        return 0.0

    if not isinstance(polygons, gpd.GeoDataFrame):
        if hasattr(polygons, "__len__") and len(polygons) == 0:
            return 0.0
        try:
            polygons = gpd.GeoDataFrame(geometry=polygons, crs=crs or "EPSG:4326")
        except Exception:
            return 0.0

    if polygons.empty:
        return 0.0

    # Ensure projected equal-area CRS for accurate metric measurement
    if polygons.crs and polygons.crs.is_geographic:
        projected = polygons.to_crs("EPSG:6933")
    else:
        projected = polygons

    total_sq_meters = projected.geometry.area.sum()
    total_hectares = float(total_sq_meters / 10000.0)
    return round(total_hectares, 2)


def filter_small_polygons(
    polygons: Any,
    min_area_ha: float = 0.5,
) -> Any:
    """Filter out small burn scar polygons below minimum hectare threshold to eliminate noise.

    Args:
        polygons: geopandas.GeoDataFrame of vectorized burn scars.
        min_area_ha: Minimum polygon area threshold in hectares. Polygons smaller
            than this will be dropped.

    Returns:
        Filtered geopandas.GeoDataFrame containing only significant burn scars.
    """
    try:
        import geopandas as gpd
    except ImportError:
        return polygons

    if not isinstance(polygons, gpd.GeoDataFrame) or polygons.empty:
        return polygons

    if "area_ha" not in polygons.columns:
        polygons["area_ha"] = compute_area_per_polygon(polygons)

    filtered = polygons[polygons["area_ha"] >= min_area_ha].copy()
    logger.info("Filtered %d small patches (< %.2f ha). Remaining: %d", len(polygons) - len(filtered), min_area_ha, len(filtered))
    return filtered
