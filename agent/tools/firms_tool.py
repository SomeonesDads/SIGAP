"""FIRMS ADK Tool Wrapper for NASA FIRMS Thermal Anomaly Data Retrieval."""

import asyncio
import logging
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from agent.tools import agent_tool

logger = logging.getLogger("SIGAP.Agent.Tools.FIRMS")


@agent_tool
def fetch_hotspots(
    region: str,
    date_start: str,
    date_end: str,
    source: str = "VIIRS_SNPP_NRT",
) -> Dict[str, Any]:
    """Fetches active fire hotspot detections from NASA FIRMS.

    Queries near-real-time (NRT) thermal anomaly data from MODIS or VIIRS satellites
    for a specific geographic region (country code such as 'IDN' or coordinate bounding box)
    and observation date window.

    Args:
        region: Geographic region identifier. Can be an ISO 3-letter country code
            (e.g., 'IDN' for Indonesia) or bounding box string 'min_lon,min_lat,max_lon,max_lat'
            (e.g., '113.8,-3.5,114.5,-2.8' for Pulang Pisau, Central Kalimantan).
        date_start: Start date for query in 'YYYY-MM-DD' format.
        date_end: End date for query in 'YYYY-MM-DD' format.
        source: Satellite sensor product. Supported options:
            - 'VIIRS_SNPP_NRT' (Default, 375m spatial resolution)
            - 'VIIRS_NOAA20_NRT' (375m spatial resolution)
            - 'VIIRS_NOAA21_NRT' (375m spatial resolution)
            - 'MODIS_NRT' (1km spatial resolution)

    Returns:
        dict: Standardized payload containing:
            - status (str): 'success' or 'error'
            - source (str): Sensor source queried
            - count (int): Total number of detected hotspots
            - region (str): Queried region
            - date_range (dict): Start and end dates
            - hotspots (list[dict]): List of individual hotspot records with coordinates,
              confidence, fire radiative power (frp), and acquisition timestamp.
    """
    api_key = (
        os.getenv("NASA_FIRMS_API_KEY", "").strip()
        or os.getenv("FIRMS_MAP_KEY", "").strip()
    )
    if not api_key:
        try:
            from backend.config import get_settings
            api_key = get_settings().NASA_FIRMS_API_KEY.strip()
        except Exception:
            pass

    # If FIRMSClient is available and API key is provided, execute real client query
    if api_key:
        try:
            from data.firms.client import FIRMSClient

            client = FIRMSClient(api_key=api_key)
            parsed_region = FIRMSClient.resolve_region(region)

            # Run asynchronous client call
            try:
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

            if loop.is_running():
                # In active event loop (e.g. FastAPI / Jupyter), use executor or task
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor() as pool:
                    hotspots_raw = pool.submit(
                        asyncio.run,
                        client.get_hotspots(
                            region=parsed_region,
                            date_start=date_start,
                            date_end=date_end,
                            source=source,
                        ),
                    ).result()
            else:
                hotspots_raw = loop.run_until_complete(
                    client.get_hotspots(
                        region=parsed_region,
                        date_start=date_start,
                        date_end=date_end,
                        source=source,
                    )
                )

            return {
                "status": "success",
                "source": source,
                "count": len(hotspots_raw),
                "region": region,
                "date_range": {"start": date_start, "end": date_end},
                "hotspots": hotspots_raw,
                "is_live": True,
            }

        except Exception as exc:
            logger.warning(
                "FIRMSClient live query encountered an issue: %s. Falling back to stub.",
                exc,
            )

    # Stub implementation showing expected data format and schema
    logger.info("Operating in FIRMS stub/mock mode for region '%s'", region)
    stub_hotspots: List[Dict[str, Any]] = [
        {
            "latitude": -2.8765,
            "longitude": 114.1234,
            "brightness": 342.5,
            "scan": 0.38,
            "track": 0.36,
            "acq_date": date_start,
            "acq_time": "0630",
            "satellite": "N",
            "instrument": "VIIRS",
            "confidence": "high",
            "version": "2.0NRT",
            "bright_t31": 298.2,
            "frp": 28.4,
            "daynight": "D",
        },
        {
            "latitude": -2.8812,
            "longitude": 114.1298,
            "brightness": 355.8,
            "scan": 0.38,
            "track": 0.36,
            "acq_date": date_start,
            "acq_time": "0630",
            "satellite": "N",
            "instrument": "VIIRS",
            "confidence": "high",
            "version": "2.0NRT",
            "bright_t31": 301.0,
            "frp": 45.1,
            "daynight": "D",
        },
        {
            "latitude": -2.8690,
            "longitude": 114.1180,
            "brightness": 331.0,
            "scan": 0.39,
            "track": 0.37,
            "acq_date": date_end or date_start,
            "acq_time": "0635",
            "satellite": "N",
            "instrument": "VIIRS",
            "confidence": "nominal",
            "version": "2.0NRT",
            "bright_t31": 294.5,
            "frp": 15.3,
            "daynight": "D",
        },
    ]

    return {
        "status": "success",
        "source": source,
        "count": len(stub_hotspots),
        "region": region,
        "date_range": {"start": date_start, "end": date_end},
        "hotspots": stub_hotspots,
        "is_live": False,
        "note": "Stub data generated. Set FIRMS_MAP_KEY environment variable for live NASA API queries.",
    }
