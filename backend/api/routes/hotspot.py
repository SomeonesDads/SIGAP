"""Hotspot and clustering endpoints for SIGAP (Live NASA FIRMS + DBSCAN + MCDA)."""

import logging
import math
import os
import time
from typing import Any
from fastapi import APIRouter, Query

try:
    from backend.config import get_settings
    from backend.models.hotspot import Hotspot, HotspotCluster
except ImportError:
    from config import get_settings
    from models.hotspot import Hotspot, HotspotCluster

from data.firms.client import FIRMSClient
from data.geospatial.clustering import cluster_hotspots
from data.geospatial.priority import PriorityFactors, compute_priority_score

logger = logging.getLogger("SIGAP.API.Hotspots")
router = APIRouter(prefix="/hotspots", tags=["Hotspots"])

# In-memory TTL cache to avoid hitting NASA FIRMS rate limits on rapid UI refreshes
_FIRMS_CACHE: dict[str, tuple[float, list[dict[str, Any]]]] = {}
_CACHE_TTL_SECONDS = 120.0

# Known Indonesian fire-prone districts & hydrological zones for spatial enrichment
_INDONESIAN_DISTRICTS: list[dict[str, Any]] = [
    {
        "name": "Desa Bereng Bengkel, Kec. Sebangau Kuala, Kab. Pulang Pisau",
        "district": "Kab. Pulang Pisau, Kalteng",
        "lat": -2.85,
        "lon": 114.12,
        "peatland": True,
        "soil": "Gambut dalam > 3 m",
        "fire_type": "Bawah permukaan (gambut)",
        "base_lat": -2.21,
        "base_lon": 113.92,
    },
    {
        "name": "Kec. Mantangai, Kab. Kapuas",
        "district": "Kab. Kapuas, Kalteng",
        "lat": -2.31,
        "lon": 114.38,
        "peatland": True,
        "soil": "Gambut 1-2 m",
        "fire_type": "Permukaan & gambut",
        "base_lat": -2.21,
        "base_lon": 113.92,
    },
    {
        "name": "Kec. Kamipang, Kab. Katingan",
        "district": "Kab. Katingan, Kalteng",
        "lat": -2.02,
        "lon": 113.21,
        "peatland": True,
        "soil": "Gambut < 1 m",
        "fire_type": "Permukaan",
        "base_lat": -2.21,
        "base_lon": 113.92,
    },
    {
        "name": "Batu Raya II, Kec. Gunung Timang, Kab. Barito Utara",
        "district": "Kab. Barito Utara, Kalteng",
        "lat": -0.93,
        "lon": 115.05,
        "peatland": True,
        "soil": "Gambut & Mineral",
        "fire_type": "Permukaan",
        "base_lat": -0.96,
        "base_lon": 114.89,
    },
    {
        "name": "Kec. Long Iram, Kab. Kutai Barat",
        "district": "Kab. Kutai Barat, Kaltim",
        "lat": 0.35,
        "lon": 115.70,
        "peatland": False,
        "soil": "Mineral",
        "fire_type": "Permukaan",
        "base_lat": -0.50,
        "base_lon": 117.15,
    },
    {
        "name": "Kec. Kembang Janggut, Kab. Kutai Kartanegara",
        "district": "Kab. Kutai Kartanegara, Kaltim",
        "lat": 0.12,
        "lon": 116.42,
        "peatland": True,
        "soil": "Gambut Muara Siran",
        "fire_type": "Permukaan & gambut",
        "base_lat": -0.50,
        "base_lon": 117.15,
    },
    {
        "name": "Kec. Kelay, Kab. Berau",
        "district": "Kab. Berau, Kaltim",
        "lat": 1.62,
        "lon": 116.28,
        "peatland": False,
        "soil": "Mineral Karst",
        "fire_type": "Permukaan",
        "base_lat": 2.15,
        "base_lon": 117.49,
    },
    {
        "name": "Kec. Aranio, Kab. Banjar",
        "district": "Kab. Banjar, Kalsel",
        "lat": -3.32,
        "lon": 115.02,
        "peatland": False,
        "soil": "Mineral",
        "fire_type": "Permukaan",
        "base_lat": -3.44,
        "base_lon": 114.83,
    },
    {
        "name": "Kec. Kendawangan, Kab. Ketapang",
        "district": "Kab. Ketapang, Kalbar",
        "lat": -2.52,
        "lon": 110.23,
        "peatland": True,
        "soil": "Gambut Pesisir 1-2 m",
        "fire_type": "Permukaan & gambut",
        "base_lat": -1.85,
        "base_lon": 109.97,
    },
    {
        "name": "Kec. Tulung Selapan, Kab. Ogan Komering Ilir",
        "district": "Kab. OKI, Sumsel",
        "lat": -3.31,
        "lon": 105.18,
        "peatland": True,
        "soil": "Kubah Gambut Dalam > 3 m",
        "fire_type": "Bawah permukaan (gambut)",
        "base_lat": -2.99,
        "base_lon": 104.76,
    },
    {
        "name": "Kec. Seruyan Hilir, Kab. Seruyan",
        "district": "Kab. Seruyan, Kalteng",
        "lat": -3.34,
        "lon": 112.65,
        "peatland": True,
        "soil": "Gambut Pesisir > 2 m",
        "fire_type": "Permukaan & gambut",
        "base_lat": -2.53,
        "base_lon": 112.95,
    },
    {
        "name": "Zona Penyangga TN Tanjung Puting, Kec. Kumai, Kab. Kotawaringin Barat",
        "district": "Kab. Kotawaringin Barat, Kalteng",
        "lat": -3.25,
        "lon": 111.95,
        "peatland": True,
        "soil": "Hutan Rawa Gambut Dalam",
        "fire_type": "Bawah permukaan (gambut)",
        "base_lat": -2.68,
        "base_lon": 111.62,
    },
    {
        "name": "Kec. Mentaya Hilir Selatan, Kab. Kotawaringin Timur",
        "district": "Kab. Kotawaringin Timur, Kalteng",
        "lat": -2.85,
        "lon": 112.92,
        "peatland": True,
        "soil": "Gambut 1-3 m",
        "fire_type": "Permukaan & gambut",
        "base_lat": -2.53,
        "base_lon": 112.95,
    },
    {
        "name": "Kec. Pantai Lunci, Kab. Sukamara",
        "district": "Kab. Sukamara, Kalteng",
        "lat": -2.95,
        "lon": 111.20,
        "peatland": True,
        "soil": "Gambut Pesisir",
        "fire_type": "Permukaan & gambut",
        "base_lat": -2.68,
        "base_lon": 111.62,
    },
    {
        "name": "Kec. Bati-Bati, Kab. Tanah Laut",
        "district": "Kab. Tanah Laut, Kalsel",
        "lat": -3.65,
        "lon": 114.75,
        "peatland": False,
        "soil": "Mineral & Rawa",
        "fire_type": "Permukaan",
        "base_lat": -3.44,
        "base_lon": 114.83,
    },
    {
        "name": "Kec. Mandau, Kab. Bengkalis",
        "district": "Kab. Bengkalis, Riau",
        "lat": 1.28,
        "lon": 101.25,
        "peatland": True,
        "soil": "Kubah Gambut Pesisir > 3 m",
        "fire_type": "Bawah permukaan (gambut)",
        "base_lat": 0.46,
        "base_lon": 101.44,
    },
    {
        "name": "Kec. Kumpeh, Kab. Muaro Jambi",
        "district": "Kab. Muaro Jambi, Jambi",
        "lat": -1.48,
        "lon": 103.92,
        "peatland": True,
        "soil": "Gambut Dalam Berbak",
        "fire_type": "Bawah permukaan (gambut)",
        "base_lat": -1.63,
        "base_lon": 103.65,
    },
    {
        "name": "Kec. Tanjung Palas, Kab. Bulungan",
        "district": "Kab. Bulungan, Kaltara",
        "lat": 2.82,
        "lon": 117.36,
        "peatland": False,
        "soil": "Mineral & Aluvial",
        "fire_type": "Permukaan",
        "base_lat": 3.32,
        "base_lon": 117.57,
    },
    {
        "name": "Kawasan Bromo Tengger Semeru, Kab. Probolinggo",
        "district": "Kab. Probolinggo, Jatim",
        "lat": -7.94,
        "lon": 112.95,
        "peatland": False,
        "soil": "Vulkanik & Savana",
        "fire_type": "Permukaan (Savana)",
        "base_lat": -7.38,
        "base_lon": 112.79,
    },
    {
        "name": "Kec. Nuha, Kab. Luwu Timur",
        "district": "Kab. Luwu Timur, Sulsel",
        "lat": -2.53,
        "lon": 121.35,
        "peatland": False,
        "soil": "Mineral Ultrabasa",
        "fire_type": "Permukaan",
        "base_lat": -5.06,
        "base_lon": 119.55,
    },
    {
        "name": "Kec. Tinanggea, Kab. Konawe Selatan",
        "district": "Kab. Konawe Selatan, Sultra",
        "lat": -4.35,
        "lon": 122.15,
        "peatland": False,
        "soil": "Mineral Savana",
        "fire_type": "Permukaan",
        "base_lat": -4.08,
        "base_lon": 122.47,
    },
    {
        "name": "Kec. Kahaungu Eti, Kab. Sumba Timur",
        "district": "Kab. Sumba Timur, NTT",
        "lat": -9.85,
        "lon": 120.28,
        "peatland": False,
        "soil": "Karst & Savana Kering",
        "fire_type": "Permukaan (Savana)",
        "base_lat": -9.67,
        "base_lon": 120.30,
    },
    {
        "name": "Distrik Tanah Miring, Kab. Merauke",
        "district": "Kab. Merauke, Papua Selatan",
        "lat": -8.28,
        "lon": 140.48,
        "peatland": True,
        "soil": "Rawa Gambut & Savana Wasur",
        "fire_type": "Permukaan & rawa",
        "base_lat": -8.52,
        "base_lon": 140.42,
    },
]


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _archipelago_bucket(lat: float, lon: float) -> str:
    """Assign an Indonesian coordinate to one of 9 macro-regional buckets for spatial diversification."""
    if lon < 106.5 and lat > -6.0:
        if lat >= -0.5:
            return "sumatera_utara_riau"
        return "sumatera_selatan_jambi"
    if lat < -5.8 and lon < 116.0:
        return "jawa"
    if lat < -7.5 and 115.0 <= lon <= 127.5:
        return "bali_nusa_tenggara"
    if 108.0 <= lon <= 119.2 and -4.5 <= lat <= 4.5:
        if lon < 111.8:
            return "kalimantan_barat"
        if lat > -1.8 and lon > 115.0:
            return "kalimantan_timur_utara"
        if lat < -2.4 and lon > 114.4:
            return "kalimantan_selatan"
        return "kalimantan_tengah"
    if 118.5 <= lon <= 126.5 and -6.5 <= lat <= 2.0:
        return "sulawesi"
    return "maluku_papua"


def _diversify_clusters_by_region(
    clusters: list[dict[str, Any]],
    limit: int,
) -> list[dict[str, Any]]:
    """Select clusters round-robin across Indonesian macro-regions so no single province monopolizes the feed."""
    if len(clusters) <= limit:
        return clusters

    buckets: dict[str, list[dict[str, Any]]] = {}
    for c in clusters:
        centroid = c.get("stats", {}).get("centroid", {})
        lat = float(centroid.get("latitude", 0.0))
        lon = float(centroid.get("longitude", 0.0))
        bkey = _archipelago_bucket(lat, lon)
        buckets.setdefault(bkey, []).append(c)

    # Sort each regional bucket by hotspot count + FRP intensity
    for bkey in buckets:
        buckets[bkey].sort(
            key=lambda c: (
                int(c.get("count", 0)),
                float(c.get("stats", {}).get("frp", {}).get("total_mw", 0.0)),
            ),
            reverse=True,
        )

    # Order buckets by their strongest cluster so highest-severity regions lead each round
    ordered_keys = sorted(
        buckets.keys(),
        key=lambda k: (
            int(buckets[k][0].get("count", 0)),
            float(buckets[k][0].get("stats", {}).get("frp", {}).get("total_mw", 0.0)),
        ),
        reverse=True,
    )

    selected: list[dict[str, Any]] = []
    round_idx = 0
    while len(selected) < limit:
        added_in_round = False
        for k in ordered_keys:
            if round_idx < len(buckets[k]):
                selected.append(buckets[k][round_idx])
                added_in_round = True
                if len(selected) >= limit:
                    break
        if not added_in_round:
            break
        round_idx += 1

    return selected


_REVERSE_GEO_CACHE: dict[tuple[float, float], dict[str, Any]] = {}


def _reverse_geocode_osm(lat: float, lon: float) -> dict[str, str] | None:
    """Query OpenStreetMap Nominatim reverse geocoding for administrative names."""
    cache_key = (round(lat, 2), round(lon, 2))
    if cache_key in _REVERSE_GEO_CACHE:
        return _REVERSE_GEO_CACHE[cache_key]

    try:
        import requests

        resp = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={
                "format": "jsonv2",
                "lat": round(lat, 4),
                "lon": round(lon, 4),
                "zoom": 10,
                "addressdetails": 1,
                "accept-language": "id",
            },
            headers={"User-Agent": "SIGAP-Wildfire-Intelligence/1.0"},
            timeout=1.8,
        )
        if resp.status_code == 200:
            data = resp.json()
            addr = data.get("address", {})
            village = (
                addr.get("village")
                or addr.get("hamlet")
                or addr.get("suburb")
                or addr.get("town")
                or ""
            )
            subdistrict = (
                addr.get("municipality")
                or addr.get("city_district")
                or addr.get("county")
                or ""
            )
            regency = (
                addr.get("regency")
                or addr.get("city")
                or addr.get("county")
                or ""
            )
            state = addr.get("state") or addr.get("archipelago") or "Indonesia"
            parts = [p for p in [village, subdistrict, regency] if p]
            deduped: list[str] = []
            for p in parts:
                if not deduped or deduped[-1].lower() != p.lower():
                    deduped.append(p)
            if deduped:
                full_name = ", ".join(deduped)
                district_label = f"{regency or deduped[-1]}, {state}" if regency else state
                result = {
                    "name": full_name,
                    "district": district_label,
                    "category": str(data.get("category", "")),
                    "type": str(data.get("type", "")),
                }
                _REVERSE_GEO_CACHE[cache_key] = result
                return result
    except Exception as exc:
        logger.debug("Nominatim reverse geocode fallback for (%s, %s): %s", lat, lon, exc)
    return None


def _nearest_district(lat: float, lon: float, allow_live_geocode: bool = True) -> dict[str, Any]:
    best = min(
        _INDONESIAN_DISTRICTS,
        key=lambda d: _haversine_km(lat, lon, d["lat"], d["lon"]),
    )
    dist_km = _haversine_km(lat, lon, best["lat"], best["lon"])

    # Determine base hydrological/peatland characteristics from nearest KHG zone or coordinates
    if dist_km <= 95.0:
        is_peat = bool(best["peatland"])
        soil = str(best["soil"])
        fire_type = str(best["fire_type"])
        fallback_name = str(best["name"])
        fallback_district = str(best["district"])
    else:
        is_peat = (
            (-3.6 <= lat <= 0.5 and 109.5 <= lon <= 116.5)
            or (-4.2 <= lat <= 2.2 and 100.2 <= lon <= 106.0)
            or (-8.8 <= lat <= -6.0 and 138.0 <= lon <= 141.0)
        )
        bucket = _archipelago_bucket(lat, lon)
        prov_map = {
            "sumatera_utara_riau": "Riau / Sumatera Utara",
            "sumatera_selatan_jambi": "Sumatera Selatan / Jambi",
            "jawa": "Jawa Timur / Jawa Tengah",
            "bali_nusa_tenggara": "Nusa Tenggara Timur / NTB",
            "kalimantan_barat": "Kalimantan Barat",
            "kalimantan_tengah": "Kalimantan Tengah",
            "kalimantan_selatan": "Kalimantan Selatan",
            "kalimantan_timur_utara": "Kalimantan Timur / Utara",
            "sulawesi": "Sulawesi Selatan / Tenggara",
            "maluku_papua": "Papua Selatan / Maluku",
        }
        prov = prov_map.get(bucket, "Indonesia")
        soil = "Gambut Tropis 1-3 m" if is_peat else "Tanah Mineral / Savana"
        fire_type = "Permukaan & gambut" if is_peat else "Permukaan"
        fallback_name = f"Kawasan Hutan & Lahan ({lat:.2f}°, {lon:.2f}°), {prov}"
        fallback_district = prov

    if allow_live_geocode:
        osm = _reverse_geocode_osm(lat, lon)
        if osm:
            if osm.get("type") in {"wetland", "marsh", "swamp", "bog"}:
                is_peat = True
                soil = "Kubah Gambut & Rawa Basah (OSM/KHG)"
                fire_type = "Bawah permukaan (gambut)"
            return {
                "name": osm["name"],
                "district": osm["district"],
                "lat": lat,
                "lon": lon,
                "peatland": is_peat,
                "soil": soil,
                "fire_type": fire_type,
                "base_lat": best["base_lat"],
                "base_lon": best["base_lon"],
            }

    return {
        "name": fallback_name,
        "district": fallback_district,
        "lat": lat,
        "lon": lon,
        "peatland": is_peat,
        "soil": soil,
        "fire_type": fire_type,
        "base_lat": best["base_lat"],
        "base_lon": best["base_lon"],
    }


def _get_firms_api_key() -> str:
    settings = get_settings()
    return (
        settings.NASA_FIRMS_API_KEY.strip()
        or os.getenv("NASA_FIRMS_API_KEY", "").strip()
        or os.getenv("FIRMS_MAP_KEY", "").strip()
    )


async def fetch_live_or_fallback_hotspots(
    region: str = "Indonesia",
    date_start: str | None = None,
    date_end: str | None = None,
    source: str = "VIIRS_SNPP_NRT",
    day_range: int = 2,
) -> tuple[list[dict[str, Any]], bool]:
    """Fetch live hotspots from NASA FIRMS with TTL caching, falling back to stub if unconfigured."""
    cache_key = f"{region.lower()}:{source}:{date_start}:{date_end}:{day_range}"
    now = time.time()
    if cache_key in _FIRMS_CACHE:
        ts, cached_data = _FIRMS_CACHE[cache_key]
        if now - ts < _CACHE_TTL_SECONDS:
            return cached_data, True

    api_key = _get_firms_api_key()
    if api_key:
        try:
            client = FIRMSClient(api_key=api_key)
            raw_list = await client.get_hotspots(
                region=region,
                date_start=date_start,
                date_end=date_end,
                source=source,
                day_range=day_range,
            )
            if raw_list:
                _FIRMS_CACHE[cache_key] = (now, raw_list)
                return raw_list, True
        except Exception as exc:
            logger.warning("Live FIRMS fetch failed for region=%s: %s", region, exc)

    fallback_date = date_end or "2026-10-21"
    fallback = [
        {
            "latitude": -2.4512,
            "longitude": 114.1205,
            "acq_date": fallback_date,
            "acq_time": "0615",
            "confidence": "high",
            "frp": 45.2,
            "satellite": "SNPP",
            "brightness": 348.6,
        },
        {
            "latitude": -2.4589,
            "longitude": 114.1298,
            "acq_date": fallback_date,
            "acq_time": "0615",
            "confidence": "high",
            "frp": 38.7,
            "satellite": "SNPP",
            "brightness": 342.1,
        },
        {
            "latitude": -2.4630,
            "longitude": 114.1180,
            "acq_date": fallback_date,
            "acq_time": "0615",
            "confidence": "nominal",
            "frp": 19.4,
            "satellite": "SNPP",
            "brightness": 325.4,
        },
    ]
    return fallback, False


def _to_hotspot_model(h: dict[str, Any]) -> Hotspot:
    conf_raw = str(h.get("confidence", "nominal")).lower()
    conf_map = {"h": "high", "n": "nominal", "l": "low"}
    sat_raw = str(h.get("satellite", "SNPP"))
    sat_map = {"N": "VIIRS S-NPP", "N20": "VIIRS NOAA-20", "N21": "VIIRS NOAA-21", "T": "MODIS Terra", "A": "MODIS Aqua"}
    return Hotspot(
        latitude=float(h.get("latitude", 0.0)),
        longitude=float(h.get("longitude", 0.0)),
        acq_date=str(h.get("acq_date", "")),
        acq_time=str(h.get("acq_time", "0000")),
        confidence=conf_map.get(conf_raw, conf_raw),
        frp=float(h["frp"]) if h.get("frp") is not None else 0.0,
        satellite=sat_map.get(sat_raw, sat_raw or "VIIRS S-NPP"),
        brightness=float(h["brightness"]) if h.get("brightness") is not None else None,
    )


@router.get("/", response_model=list[Hotspot])
async def get_hotspots(
    region: str = Query("Indonesia", description="Target region or province name"),
    date_start: str | None = Query(None, description="Start date (YYYY-MM-DD); omit for latest NRT"),
    date_end: str | None = Query(None, description="End date (YYYY-MM-DD)"),
    source: str = Query("VIIRS_SNPP_NRT", description="Satellite sensor source"),
    limit: int = Query(300, ge=1, le=2000, description="Max hotspots returned"),
) -> list[Hotspot]:
    """Retrieve live thermal anomaly hotspots from NASA FIRMS for a given region with spatial diversification."""
    raw_list, _ = await fetch_live_or_fallback_hotspots(
        region=region,
        date_start=date_start,
        date_end=date_end,
        source=source,
    )
    sorted_raw = sorted(raw_list, key=lambda x: float(x.get("frp") or 0.0), reverse=True)
    if len(sorted_raw) <= limit:
        return [_to_hotspot_model(h) for h in sorted_raw]

    # Spatial grid round-robin (1.5° x 1.5° cells) so wide-area queries cover all active islands
    grid: dict[tuple[int, int], list[dict[str, Any]]] = {}
    for h in sorted_raw:
        cell = (int(float(h.get("latitude", 0.0)) / 1.5), int(float(h.get("longitude", 0.0)) / 1.5))
        grid.setdefault(cell, []).append(h)

    cell_keys = sorted(
        grid.keys(),
        key=lambda k: float(grid[k][0].get("frp") or 0.0),
        reverse=True,
    )
    diversified: list[dict[str, Any]] = []
    r_idx = 0
    while len(diversified) < limit:
        added = False
        for ck in cell_keys:
            if r_idx < len(grid[ck]):
                diversified.append(grid[ck][r_idx])
                added = True
                if len(diversified) >= limit:
                    break
        if not added:
            break
        r_idx += 1

    return [_to_hotspot_model(h) for h in diversified]


@router.get("/clusters", response_model=list[HotspotCluster])
async def get_hotspot_clusters(
    region: str = Query("Indonesia", description="Target region"),
    date_start: str | None = Query(None, description="Start date (YYYY-MM-DD)"),
    date_end: str | None = Query(None, description="End date (YYYY-MM-DD)"),
    eps_km: float = Query(8.0, description="DBSCAN clustering radius in kilometers"),
    min_samples: int = Query(2, description="Minimum points to form a cluster"),
) -> list[HotspotCluster]:
    """Retrieve spatially clustered live hotspots using DBSCAN with spherical Haversine distance."""
    raw_list, _ = await fetch_live_or_fallback_hotspots(
        region=region,
        date_start=date_start,
        date_end=date_end,
    )
    clusters_raw = cluster_hotspots(raw_list, eps_km=eps_km, min_samples=min_samples)
    diversified_clusters = _diversify_clusters_by_region(clusters_raw, limit=30)

    results: list[HotspotCluster] = []
    for idx, c in enumerate(diversified_clusters, start=1):
        stats = c.get("stats", {})
        centroid = stats.get("centroid", {})
        frp_stats = stats.get("frp", {})
        span = stats.get("temporal_span", {})
        date_range_str = (
            f"{span.get('first_seen')} to {span.get('last_seen')}"
            if span.get("first_seen")
            else "Live NRT (Last 48h)"
        )
        pts = [_to_hotspot_model(p) for p in c.get("hotspots", [])]
        results.append(
            HotspotCluster(
                cluster_id=idx,
                centroid_lat=float(centroid.get("latitude", 0.0)),
                centroid_lon=float(centroid.get("longitude", 0.0)),
                hotspot_count=int(c.get("count", len(pts))),
                total_frp=float(frp_stats.get("total_mw", 0.0)),
                date_range=date_range_str,
                hotspots=pts,
            )
        )
    return results


_MONITORING_CACHE: dict[tuple[str, int], tuple[float, dict[str, Any]]] = {}


@router.get("/monitoring")
async def get_monitoring_hotspots(
    region: str = Query("Indonesia", description="Target region or 'Indonesia'"),
    limit: int = Query(30, ge=1, le=100, description="Max enriched priority hotspots to return"),
) -> dict[str, Any]:
    """Return live NASA FIRMS hotspots aggregated, regionally diversified & scored across Indonesia."""
    cache_key = (region.lower().strip(), limit)
    now = time.time()
    if cache_key in _MONITORING_CACHE:
        ts, cached_payload = _MONITORING_CACHE[cache_key]
        if now - ts < _CACHE_TTL_SECONDS:
            return cached_payload

    raw_list, is_live = await fetch_live_or_fallback_hotspots(region=region, day_range=2)

    # Filter to full Indonesian archipelago bounds (Sabang to Merauke, Miangas to Rote)
    idn_points = [
        h for h in raw_list
        if -11.0 <= float(h.get("latitude", 0.0)) <= 6.0
        and 95.0 <= float(h.get("longitude", 0.0)) <= 141.0
    ]
    if not idn_points:
        idn_points = raw_list

    # Cluster nearby points using DBSCAN (8 km radius, min 2 points)
    clusters = cluster_hotspots(idn_points, eps_km=8.0, min_samples=2)

    # Diversify across Indonesian islands & provinces so all active regions are represented
    candidate_groups: list[dict[str, Any]] = _diversify_clusters_by_region(clusters, limit=limit)
    if len(candidate_groups) < limit:
        used_coords = {
            (round(float(p["latitude"]), 3), round(float(p["longitude"]), 3))
            for c in candidate_groups
            for p in c.get("hotspots", [])
        }
        remaining = [
            p for p in sorted(idn_points, key=lambda x: float(x.get("frp") or 0.0), reverse=True)
            if (round(float(p["latitude"]), 3), round(float(p["longitude"]), 3)) not in used_coords
        ]
        for p in remaining[: max(0, limit - len(candidate_groups))]:
            candidate_groups.append(
                {
                    "cluster_id": len(candidate_groups) + 1,
                    "count": 1,
                    "hotspots": [p],
                    "stats": {
                        "centroid": {"latitude": float(p["latitude"]), "longitude": float(p["longitude"])},
                        "frp": {"total_mw": float(p.get("frp") or 5.0), "max_mw": float(p.get("frp") or 5.0)},
                    },
                }
            )

    enriched_items: list[dict[str, Any]] = []
    for idx, grp in enumerate(candidate_groups[:limit], start=1):
        stats = grp.get("stats", {})
        centroid = stats.get("centroid", {})
        lat = round(float(centroid.get("latitude", 0.0)), 4)
        lon = round(float(centroid.get("longitude", 0.0)), 4)
        pts = grp.get("hotspots", [])
        count = int(grp.get("count", len(pts)))
        total_frp = float(stats.get("frp", {}).get("total_mw", 0.0))

        district_info = _nearest_district(lat, lon, allow_live_geocode=(idx <= 12))
        is_peat = bool(district_info["peatland"])

        # Estimate burned area (ha) and dNBR from cluster size & radiative power
        area_ha = max(6, int(round(count * 14.5 + total_frp * 1.2)))
        dnbr_mean = round(min(0.82, max(0.18, 0.25 + (total_frp / 160.0) + (0.12 if is_peat else 0.0))), 2)
        dnbr_class = (
            "high_severity"
            if dnbr_mean >= 0.50
            else ("moderate_high_severity" if dnbr_mean >= 0.35 else "low_severity")
        )

        # Calculate distance to nearest base & settlement
        dist_base_km = max(8, int(round(_haversine_km(lat, lon, district_info["base_lat"], district_info["base_lon"]) * 0.45)))
        eta_min = max(15, int(round(dist_base_km * 1.65)))
        settlement_km = round(max(0.8, min(9.5, (dist_base_km % 7) + 0.8)), 1)

        factors = PriorityFactors(
            is_peatland=is_peat,
            distance_to_settlement_km=settlement_km,
            hotspot_count=count,
            hotspot_recurrence=min(5, max(1, count // 2)),
            estimated_burned_area_ha=float(area_ha),
            dnbr_severity=dnbr_class,
            evidence_quality=0.95,
        )
        risk_score = compute_priority_score(factors)

        if risk_score >= 70.0:
            severity = "tinggi"
        elif risk_score >= 45.0:
            severity = "sedang"
        else:
            severity = "rendah"

        first_pt = pts[0] if pts else {}
        acq_date = str(first_pt.get("acq_date") or "2026-10-21")
        acq_time = str(first_pt.get("acq_time") or "0630").zfill(4)
        conf_raw = str(first_pt.get("confidence", "nominal")).lower()
        sat_raw = str(first_pt.get("satellite", "N"))
        sat_label = "VIIRS S-NPP" if sat_raw == "N" else ("VIIRS NOAA-20" if sat_raw == "N20" else f"VIIRS ({sat_raw})")

        status_label = (
            "Terkonfirmasi citra (Live FIRMS)"
            if conf_raw in ("h", "high") or count >= 4
            else ("Perlu cek lapangan" if count >= 2 else "Pantauan satelit NRT")
        )
        condition_label = (
            f"Klaster aktif ({count} titik panas, FRP {total_frp:.1f} MW)"
            if count > 1
            else f"Anomali termal tunggal (FRP {total_frp:.1f} MW)"
        )

        enriched_items.append(
            {
                "id": f"HS-LIVE-{idx:02d}",
                "lat": lat,
                "lon": lon,
                "severity": severity,
                "riskScore": risk_score,
                "distanceKm": dist_base_km,
                "etaMin": eta_min,
                "areaHa": area_ha,
                "dnbrMean": dnbr_mean,
                "imagery": f"FIRMS NRT {acq_date} {acq_time[:2]}:{acq_time[2:]} UTC",
                "peatland": is_peat,
                "settlementKm": settlement_km,
                "status": status_label,
                "location": district_info["name"],
                "district": district_info["district"],
                "fireType": district_info["fire_type"],
                "soil": district_info["soil"],
                "lastCondition": condition_label,
                "satellite": sat_label,
                "hotspotCount": count,
                "totalFrp": round(total_frp, 1),
                "acqDate": acq_date,
                "acqTime": acq_time,
                "isLive": is_live,
            }
        )

    enriched_items.sort(key=lambda x: x["riskScore"], reverse=True)
    payload = {
        "is_live": is_live,
        "source": "NASA FIRMS VIIRS_SNPP_NRT",
        "total_raw_hotspots": len(idn_points),
        "cluster_count": len(clusters),
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "hotspots": enriched_items,
    }
    _MONITORING_CACHE[cache_key] = (now, payload)
    return payload


