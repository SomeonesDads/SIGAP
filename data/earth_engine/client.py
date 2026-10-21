"""Google Earth Engine (GEE) Client for Satellite Imagery and Burn Index Analysis.

Provides interfaces to search, filter, and extract multi-spectral Landsat and Sentinel-2
imagery, generate pre/post-fire composites, compute Normalized Burn Ratio (NBR),
and evaluate cloud cover statistics over areas of interest (AOI).

References:
    - Google Earth Engine Python API: https://developers.google.com/earth-engine/guides/python_install
    - Landsat Collection 2 Level-2 Surface Reflectance:
      LANDSAT/LC09/C02/T1_L2, LANDSAT/LC08/C02/T1_L2
    - Sentinel-2 MSI Level-2A Surface Reflectance: COPERNICUS/S2_SR_HARMONIZED
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Tuple, Union

logger = logging.getLogger("SIGAP.Data.EarthEngine")


class EarthEngineClient:
    """Client for Google Earth Engine remote sensing operations.

    Handles authentication, imagery querying, pre/post-fire temporal pair assembly,
    and spectral index computation (NBR).

    Attributes:
        project_id: Google Cloud Project ID associated with Earth Engine.
        initialized: Boolean flag indicating if ee.Initialize() succeeded.
    """

    def __init__(self, project_id: Optional[str] = None) -> None:
        """Initialize the Earth Engine client.

        Args:
            project_id: Optional GCP project ID registered for Earth Engine.
        """
        self.project_id = project_id
        self.initialized = False

    def initialize(self) -> None:
        """Authenticate and initialize the Google Earth Engine Python API.

        Raises:
            ImportError: If the 'ee' package is not installed.
            RuntimeError: If Earth Engine initialization fails.
        """
        try:
            import ee
        except ImportError:
            logger.error("earthengine-api is not installed. Please run 'pip install earthengine-api'.")
            raise ImportError("Google Earth Engine API ('ee') is required for EarthEngineClient.")

        try:
            if self.project_id:
                ee.Initialize(project=self.project_id)
            else:
                ee.Initialize()
            self.initialized = True
            logger.info("Google Earth Engine initialized successfully (project=%s).", self.project_id)
        except Exception as exc:
            self.initialized = False
            logger.error("Failed to initialize Earth Engine: %s", exc)
            raise RuntimeError(f"Failed to initialize Earth Engine: {exc}") from exc

    def get_imagery(
        self,
        aoi: Dict[str, Any],
        date_start: str,
        date_end: str,
        collection: str = "LANDSAT/LC09/C02/T1_L2",
        max_cloud: float = 20.0,
    ) -> Dict[str, Any]:
        """Search and retrieve satellite image metadata matching criteria.

        Args:
            aoi: Area of Interest GeoJSON dict or bounding box coordinates.
            date_start: Acquisition start date (YYYY-MM-DD).
            date_end: Acquisition end date (YYYY-MM-DD).
            collection: GEE ImageCollection ID (e.g. Landsat 8/9 or Sentinel-2).
            max_cloud: Maximum acceptable scene cloud cover percentage.

        Returns:
            Dictionary containing image metadata:
                - image_id: Unique asset ID in Earth Engine
                - date: Acquisition timestamp
                - cloud_cover: Cloud cover percentage over scene
                - collection: Source collection ID
                - bounds: Bounding coordinates
        """
        if not self.initialized:
            logger.warning("Earth Engine not initialized. Returning mock imagery metadata for stub execution.")
            return {
                "image_id": f"{collection}/MOCK_{date_start.replace('-', '')}",
                "date": date_start,
                "cloud_cover": 5.2,
                "collection": collection,
                "bounds": aoi,
                "status": "mock",
            }

        import ee

        # Build EE geometry
        if "coordinates" in aoi:
            geom = ee.Geometry(aoi)
        elif "west" in aoi:
            geom = ee.Geometry.BBox(aoi["west"], aoi["south"], aoi["east"], aoi["north"])
        else:
            geom = ee.Geometry.Polygon(aoi)

        # Query collection
        col = (
            ee.ImageCollection(collection)
            .filterBounds(geom)
            .filterDate(date_start, date_end)
            .filter(ee.Filter.lt("CLOUD_COVER", max_cloud))
            .sort("CLOUD_COVER")
        )

        count = col.size().getInfo()
        if count == 0:
            logger.warning("No imagery found in %s between %s and %s with cloud < %.1f%%", collection, date_start, date_end, max_cloud)
            return {}

        best_image = col.first()
        props = best_image.getInfo()
        meta = {
            "image_id": props.get("id"),
            "date": datetime.fromtimestamp(props.get("properties", {}).get("system:time_start", 0) / 1000).strftime("%Y-%m-%d"),
            "cloud_cover": props.get("properties", {}).get("CLOUD_COVER", 0.0),
            "collection": collection,
            "bounds": aoi,
            "status": "retrieved",
        }
        return meta

    def get_before_after_pair(
        self,
        aoi: Dict[str, Any],
        event_date: str,
        days_before: int = 30,
        days_after: int = 30,
        collection: str = "LANDSAT/LC09/C02/T1_L2",
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """Retrieve the best matching pre-fire and post-fire imagery pair for an event date.

        Args:
            aoi: Area of Interest definition.
            event_date: Suspected fire event date (YYYY-MM-DD).
            days_before: Search window duration prior to event.
            days_after: Search window duration following event.
            collection: Satellite image collection ID.

        Returns:
            Tuple of (pre_fire_image_metadata, post_fire_image_metadata).
        """
        event_dt = datetime.strptime(event_date, "%Y-%m-%d")
        pre_start = (event_dt - timedelta(days=days_before)).strftime("%Y-%m-%d")
        pre_end = (event_dt - timedelta(days=1)).strftime("%Y-%m-%d")

        post_start = (event_dt + timedelta(days=1)).strftime("%Y-%m-%d")
        post_end = (event_dt + timedelta(days=days_after)).strftime("%Y-%m-%d")

        logger.info("Searching pre-fire image between %s and %s", pre_start, pre_end)
        pre_meta = self.get_imagery(aoi, pre_start, pre_end, collection=collection)

        logger.info("Searching post-fire image between %s and %s", post_start, post_end)
        post_meta = self.get_imagery(aoi, post_start, post_end, collection=collection)

        return pre_meta, post_meta

    def compute_nbr(self, image: Any) -> Any:
        """Compute Normalized Burn Ratio (NBR) on an Earth Engine Image.

        Formula: NBR = (NIR - SWIR2) / (NIR + SWIR2)

        Band mapping:
            - Landsat 8/9: NIR = B5, SWIR2 = B7
            - Sentinel-2: NIR = B8, SWIR2 = B12

        Args:
            image: ee.Image instance.

        Returns:
            ee.Image with single float band named 'NBR'.
        """
        if not self.initialized:
            logger.warning("Earth Engine not initialized. Returning image unmodified.")
            return image

        import ee

        band_names = image.bandNames().getInfo()
        if "B5" in band_names and "B7" in band_names:
            # Landsat 8/9
            nbr = image.normalizedDifference(["B5", "B7"]).rename("NBR")
        elif "B8" in band_names and "B12" in band_names:
            # Sentinel-2
            nbr = image.normalizedDifference(["B8", "B12"]).rename("NBR")
        else:
            logger.warning("Could not identify NIR/SWIR2 bands from %s. Using default B5/B7.", band_names)
            nbr = image.normalizedDifference(["B5", "B7"]).rename("NBR")

        return nbr

    def assess_cloud_cover(self, image: Any, aoi: Dict[str, Any]) -> float:
        """Assess the cloud cover percentage within the specific AOI geometry.

        Args:
            image: ee.Image instance.
            aoi: Area of Interest geometry.

        Returns:
            Cloud cover percentage (0.0 to 100.0) over the AOI.
        """
        if not self.initialized:
            logger.warning("Earth Engine not initialized. Returning mock cloud cover.")
            return 8.5

        import ee

        # Landsat QA_PIXEL cloud bit mask check
        # Bit 3: Cloud, Bit 4: Cloud Shadow
        try:
            qa = image.select("QA_PIXEL")
            cloud_bit = 1 << 3
            shadow_bit = 1 << 4
            cloud_mask = qa.bitwiseAnd(cloud_bit).neq(0).Or(qa.bitwiseAnd(shadow_bit).neq(0))

            if "coordinates" in aoi:
                geom = ee.Geometry(aoi)
            elif "west" in aoi:
                geom = ee.Geometry.BBox(aoi["west"], aoi["south"], aoi["east"], aoi["north"])
            else:
                geom = ee.Geometry.Polygon(aoi)

            mean_dict = cloud_mask.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=geom,
                scale=30,
                maxPixels=1e9,
            ).getInfo()

            cloud_fraction = mean_dict.get("QA_PIXEL", 0.0) or 0.0
            return float(cloud_fraction * 100.0)
        except Exception as e:
            logger.warning("Failed to compute localized cloud cover: %s", e)
            return 0.0
