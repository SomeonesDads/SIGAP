"""NASA FIRMS (Fire Information for Resource Management System) API Client.

Retrieves active fire / hotspot data from NASA FIRMS REST API using MODIS
and VIIRS near-real-time (NRT) satellite instruments.

API References:
    - NASA FIRMS API Documentation: https://firms.modaps.eosdis.nasa.gov/api/
    - MapServer & Area API: https://firms.modaps.eosdis.nasa.gov/api/area/
    - Data sources: 'VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'VIIRS_NOAA21_NRT', 'MODIS_NRT'
"""

import csv
import io
import logging
from datetime import date, datetime
from typing import Any, Dict, List, Optional, Union

import httpx

logger = logging.getLogger("SIGAP.Data.FIRMS")


class FIRMSAPIError(Exception):
    """Base exception for FIRMS API client errors."""
    pass


class FIRMSAuthError(FIRMSAPIError):
    """Raised when FIRMS MAP_KEY / API key is invalid or unauthorized."""
    pass


class FIRMSQuotaExceededError(FIRMSAPIError):
    """Raised when FIRMS API rate limit or transaction quota is exceeded."""
    pass


class FIRMSClient:
    """Asynchronous client for interacting with the NASA FIRMS REST API.

    Attributes:
        api_key: NASA FIRMS MAP_KEY / transaction key.
        base_url: Base URL for FIRMS API (default: https://firms.modaps.eosdis.nasa.gov).
        timeout: HTTP request timeout in seconds.
    """

    DEFAULT_BASE_URL = "https://firms.modaps.eosdis.nasa.gov"
    SUPPORTED_SOURCES = {
        "VIIRS_SNPP_NRT",
        "VIIRS_NOAA20_NRT",
        "VIIRS_NOAA21_NRT",
        "MODIS_NRT",
        "LANDSAT_NRT",
    }

    # Standard bounding boxes [west, south, east, north] for Indonesian fire-prone regions
    REGION_BBOXES: Dict[str, List[float]] = {
        "indonesia": [95.0, -11.0, 141.0, 6.0],
        "kalimantan": [108.5, -4.5, 119.0, 4.5],
        "kalimantan tengah": [110.7, -3.5, 115.8, 0.8],
        "kalteng": [110.7, -3.5, 115.8, 0.8],
        "kalimantan timur": [113.8, -2.5, 119.0, 2.6],
        "kaltim": [113.8, -2.5, 119.0, 2.6],
        "kalimantan barat": [108.5, -3.1, 114.2, 2.1],
        "kalbar": [108.5, -3.1, 114.2, 2.1],
        "kalimantan selatan": [114.3, -4.3, 116.6, -1.3],
        "kalsel": [114.3, -4.3, 116.6, -1.3],
        "pulang pisau": [113.5, -3.4, 114.6, -1.8],
        "sebangau": [113.3, -3.2, 114.2, -2.1],
        "kapuas": [113.8, -3.4, 114.9, -0.8],
        "barito utara": [114.4, -1.6, 115.8, 0.1],
        "ketapang": [109.7, -3.1, 111.3, -0.5],
        "riau": [100.0, -1.1, 103.8, 2.5],
        "sumatera selatan": [102.0, -4.9, 106.2, -1.6],
        "sumsel": [102.0, -4.9, 106.2, -1.6],
        "ogan komering ilir": [104.3, -4.2, 106.1, -2.5],
        "oki": [104.3, -4.2, 106.1, -2.5],
        "jambi": [101.1, -2.8, 104.5, -0.7],
    }

    def __init__(
        self,
        api_key: str,
        base_url: str = DEFAULT_BASE_URL,
        timeout: float = 30.0,
    ) -> None:
        """Initialize the FIRMS API client.

        Args:
            api_key: 32-character FIRMS MAP_KEY.
            base_url: Optional API endpoint base URL.
            timeout: Request timeout in seconds.
        """
        if not api_key or not api_key.strip():
            raise ValueError("A valid NASA FIRMS api_key (MAP_KEY) is required.")

        self.api_key = api_key.strip()
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    @classmethod
    def resolve_region(
        cls, region: Union[str, Dict[str, float], List[float]]
    ) -> Union[str, Dict[str, float], List[float]]:
        """Resolve named Indonesian provinces/districts or comma-separated bbox strings."""
        if isinstance(region, str):
            cleaned = region.strip()
            if "," in cleaned:
                try:
                    parts = [float(p.strip()) for p in cleaned.split(",")]
                    if len(parts) == 4:
                        return parts
                except ValueError:
                    pass
            lower = cleaned.lower()
            if lower in cls.REGION_BBOXES:
                return cls.REGION_BBOXES[lower]
            for name, bbox in cls.REGION_BBOXES.items():
                if name in lower:
                    return bbox
        return region

    async def get_hotspots(
        self,
        region: Union[str, Dict[str, float], List[float]],
        date_start: Optional[Union[str, date, datetime]] = None,
        date_end: Optional[Union[str, date, datetime]] = None,
        source: str = "VIIRS_SNPP_NRT",
        day_range: int = 2,
    ) -> List[Dict[str, Any]]:
        """Retrieve active fire hotspots for a given region and time range.

        Args:
            region: Geolocation filter:
                - Dict with keys {'west', 'south', 'east', 'north'} or {'min_lon', 'min_lat', 'max_lon', 'max_lat'}
                - List/Tuple of 4 floats: [west, south, east, north]
                - String country code (e.g., 'IDN' for Indonesia) or Indonesian province/district name
            date_start: Optional start date as 'YYYY-MM-DD' or date/datetime object. If None, queries latest NRT window.
            date_end: Optional end date. If provided, day_range is calculated.
            source: Satellite sensor product. Default 'VIIRS_SNPP_NRT' (375m resolution).
            day_range: Number of days (1 to 10 for standard FIRMS API).

        Returns:
            List of parsed hotspot dictionaries containing lat, lon, frp, confidence, etc.

        Raises:
            FIRMSAuthError: Invalid API key.
            FIRMSQuotaExceededError: Rate limit exceeded.
            FIRMSAPIError: Network or parsing failure.
        """
        if source not in self.SUPPORTED_SOURCES:
            logger.warning(
                "Source '%s' is not in standard list %s, attempting request anyway.",
                source,
                self.SUPPORTED_SOURCES,
            )

        resolved_region = self.resolve_region(region)

        # Format date string (YYYY-MM-DD) if provided
        date_str: Optional[str] = None
        if date_start is not None:
            if isinstance(date_start, (datetime, date)):
                date_str = date_start.strftime("%Y-%m-%d")
            else:
                s = str(date_start).strip()
                if s and s.lower() != "none":
                    date_str = s

        # Calculate day range if both date_start and date_end are given
        if date_end is not None and date_str is not None:
            try:
                if isinstance(date_end, str):
                    d_end = datetime.strptime(date_end.strip(), "%Y-%m-%d").date()
                elif isinstance(date_end, datetime):
                    d_end = date_end.date()
                else:
                    d_end = date_end

                if isinstance(date_start, str):
                    d_start = datetime.strptime(date_str, "%Y-%m-%d").date()
                elif isinstance(date_start, datetime):
                    d_start = date_start.date()
                else:
                    d_start = date_start

                delta = (d_end - d_start).days + 1
                day_range = max(1, min(delta, 10))
            except ValueError:
                pass

        day_range = max(1, min(int(day_range), 10))
        date_suffix = f"/{date_str}" if date_str else ""

        # Build endpoint URL depending on region type
        if isinstance(resolved_region, str):
            country_code = resolved_region.upper() if len(resolved_region) == 3 else "IDN"
            endpoint_base = f"{self.base_url}/api/country/csv/{self.api_key}/{source}/{country_code}/{day_range}"
        elif isinstance(resolved_region, (list, tuple)) and len(resolved_region) == 4:
            coords = f"{resolved_region[0]},{resolved_region[1]},{resolved_region[2]},{resolved_region[3]}"
            endpoint_base = f"{self.base_url}/api/area/csv/{self.api_key}/{source}/{coords}/{day_range}"
        elif isinstance(resolved_region, dict):
            west = resolved_region.get("west", resolved_region.get("min_lon"))
            south = resolved_region.get("south", resolved_region.get("min_lat"))
            east = resolved_region.get("east", resolved_region.get("max_lon"))
            north = resolved_region.get("north", resolved_region.get("max_lat"))
            if None in (west, south, east, north):
                raise ValueError("Bounding box dict must contain west/south/east/north or min_lon/min_lat/max_lon/max_lat")
            coords = f"{west},{south},{east},{north}"
            endpoint_base = f"{self.base_url}/api/area/csv/{self.api_key}/{source}/{coords}/{day_range}"
        else:
            raise ValueError(f"Invalid region format: {region}")

        endpoint = f"{endpoint_base}{date_suffix}"
        logger.info("Fetching FIRMS hotspots from: %s (source=%s, date=%s)", endpoint, source, date_str or "latest-NRT")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(endpoint)
                # If a specific date was requested but returned empty or invalid date, retry latest NRT window
                if date_suffix and (response.status_code == 400 or not self._parse_csv_response(response.text)):
                    logger.info("Retrying FIRMS query against latest NRT window without date suffix.")
                    response = await client.get(endpoint_base)
            except httpx.RequestError as exc:
                raise FIRMSAPIError(f"HTTP request to FIRMS API failed: {exc}") from exc

        if response.status_code == 401 or "Invalid MAP_KEY" in response.text:
            raise FIRMSAuthError("FIRMS MAP_KEY is invalid or not registered.")
        if response.status_code == 429:
            raise FIRMSQuotaExceededError("FIRMS API transaction limit exceeded.")
        if response.status_code != 200:
            raise FIRMSAPIError(f"FIRMS API returned HTTP {response.status_code}: {response.text}")

        # Parse CSV text response
        return self._parse_csv_response(response.text)

    def _parse_csv_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse FIRMS CSV response into a list of typed hotspot dictionaries.

        Args:
            response_text: Raw CSV string from FIRMS API.

        Returns:
            List of parsed hotspot dicts with converted floats and integers.
        """
        text = response_text.strip()
        if not text or "latitude" not in text.lower():
            # Empty response or no headers
            return []

        csv_file = io.StringIO(text)
        reader = csv.DictReader(csv_file)
        hotspots: List[Dict[str, Any]] = []

        for row in reader:
            try:
                # Safe type conversion
                lat = float(row.get("latitude", 0.0))
                lon = float(row.get("longitude", 0.0))
                
                # Temperature / Brightness (bright_ti4 for VIIRS or brightness for MODIS)
                brightness = None
                for b_key in ("bright_ti4", "brightness", "bright_ti5"):
                    if b_key in row and row[b_key]:
                        try:
                            brightness = float(row[b_key])
                            break
                        except ValueError:
                            pass

                # Fire Radiative Power (FRP in Megawatts)
                frp = None
                if "frp" in row and row["frp"]:
                    try:
                        frp = float(row["frp"])
                    except ValueError:
                        frp = 0.0

                # Confidence (nominal, low, high for VIIRS; 0-100% for MODIS)
                confidence = row.get("confidence", "nominal")
                try:
                    confidence_val = float(confidence)
                except ValueError:
                    confidence_val = confidence  # Keep as categorical string

                item: Dict[str, Any] = {
                    "latitude": lat,
                    "longitude": lon,
                    "brightness": brightness,
                    "frp": frp,
                    "confidence": confidence_val,
                    "acq_date": row.get("acq_date", ""),
                    "acq_time": row.get("acq_time", ""),
                    "satellite": row.get("satellite", ""),
                    "instrument": row.get("instrument", ""),
                    "daynight": row.get("daynight", ""),
                }
                hotspots.append(item)
            except Exception as e:
                logger.warning("Error parsing hotspot CSV row %s: %s", row, e)
                continue

        logger.info("Parsed %d hotspots from FIRMS response.", len(hotspots))
        return hotspots
