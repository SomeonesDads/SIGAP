"""Hotspot Spatial-Temporal Clustering using DBSCAN with Haversine Metric.

Groups discrete satellite thermal anomaly points (MODIS/VIIRS) into spatial clusters
representing active fire fronts or complex wildfire zones, filtering out isolated
noise detections.

Methods:
    - cluster_hotspots: Uses scikit-learn DBSCAN with great-circle haversine distance.
    - compute_cluster_stats: Derives centroid, spatial bounding box, temporal duration,
      and radiative power statistics for each cluster.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Union

import numpy as np

logger = logging.getLogger("SIGAP.Data.Clustering")

EARTH_RADIUS_KM = 6371.0088


def cluster_hotspots(
    hotspots: List[Dict[str, Any]],
    eps_km: float = 1.0,
    min_samples: int = 3,
) -> List[Dict[str, Any]]:
    """Cluster raw satellite hotspots using DBSCAN with spherical haversine distance.

    Args:
        hotspots: List of hotspot dictionaries containing at least 'latitude' and 'longitude'.
        eps_km: Maximum distance in kilometers between two points to be considered in the same neighborhood.
        min_samples: Minimum number of hotspots required to form a dense cluster.

    Returns:
        List of cluster dictionaries, each containing:
            - cluster_id (int): Non-negative cluster identifier.
            - count (int): Total number of hotspots in this cluster.
            - hotspots (list[dict]): Original hotspot records assigned to this cluster.
            - stats (dict): Summary statistics (centroid, extent, duration, FRP).
    """
    if not hotspots:
        logger.info("No hotspots provided for clustering.")
        return []

    # Try importing sklearn DBSCAN
    try:
        from sklearn.cluster import DBSCAN
    except ImportError:
        logger.warning("scikit-learn is not installed. Falling back to single-cluster stub.")
        stats = compute_cluster_stats(hotspots)
        return [{"cluster_id": 0, "count": len(hotspots), "hotspots": hotspots, "stats": stats}]

    # Extract coordinates
    coords = []
    valid_hotspots = []
    for h in hotspots:
        if "latitude" in h and "longitude" in h:
            coords.append([float(h["latitude"]), float(h["longitude"])])
            valid_hotspots.append(h)

    if len(valid_hotspots) < min_samples:
        logger.info("Fewer than min_samples (%d) valid hotspots; no clusters formed.", min_samples)
        return []

    coords_arr = np.array(coords)
    # DBSCAN haversine metric requires inputs in radians (lat, lon)
    coords_rad = np.radians(coords_arr)
    eps_rad = eps_km / EARTH_RADIUS_KM

    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric="haversine", algorithm="ball_tree")
    labels = db.fit_predict(coords_rad)

    # Group hotspots by cluster label (label == -1 indicates noise)
    clusters_dict: Dict[int, List[Dict[str, Any]]] = {}
    noise_count = 0

    for idx, label in enumerate(labels):
        if label == -1:
            noise_count += 1
            continue
        if label not in clusters_dict:
            clusters_dict[label] = []
        clusters_dict[label].append(valid_hotspots[idx])

    logger.info(
        "DBSCAN clustered %d hotspots into %d clusters (%d points classified as noise).",
        len(valid_hotspots),
        len(clusters_dict),
        noise_count,
    )

    result_clusters: List[Dict[str, Any]] = []
    for cluster_id, cluster_pts in clusters_dict.items():
        stats = compute_cluster_stats(cluster_pts)
        result_clusters.append({
            "cluster_id": int(cluster_id),
            "count": len(cluster_pts),
            "hotspots": cluster_pts,
            "stats": stats,
        })

    # Sort clusters descending by hotspot count
    result_clusters.sort(key=lambda c: c["count"], reverse=True)
    return result_clusters


def compute_cluster_stats(cluster: Union[Dict[str, Any], List[Dict[str, Any]]]) -> Dict[str, Any]:
    """Calculate centroid, spatial extent, temporal span, and radiative power for a cluster.

    Args:
        cluster: Either a cluster dict with 'hotspots' list, or a raw list of hotspot dicts.

    Returns:
        Dictionary with:
            - centroid: {'latitude': float, 'longitude': float}
            - count: int
            - extent: {'min_lat': float, 'max_lat': float, 'min_lon': float, 'max_lon': float}
            - temporal_span: {'first_seen': str, 'last_seen': str, 'duration_hours': float}
            - frp: {'total_mw': float, 'mean_mw': float, 'max_mw': float}
    """
    if isinstance(cluster, dict) and "hotspots" in cluster:
        hotspots = cluster["hotspots"]
    elif isinstance(cluster, list):
        hotspots = cluster
    else:
        raise ValueError("Invalid cluster format passed to compute_cluster_stats")

    if not hotspots:
        return {}

    lats = [float(h["latitude"]) for h in hotspots if "latitude" in h]
    lons = [float(h["longitude"]) for h in hotspots if "longitude" in h]
    frps = [float(h["frp"]) for h in hotspots if "frp" in h and h["frp"] is not None]

    centroid = {
        "latitude": round(float(np.mean(lats)), 5) if lats else 0.0,
        "longitude": round(float(np.mean(lons)), 5) if lons else 0.0,
    }

    extent = {
        "min_lat": round(float(min(lats)), 5) if lats else 0.0,
        "max_lat": round(float(max(lats)), 5) if lats else 0.0,
        "min_lon": round(float(min(lons)), 5) if lons else 0.0,
        "max_lon": round(float(max(lons)), 5) if lons else 0.0,
    }

    # Temporal span parsing
    timestamps: List[datetime] = []
    for h in hotspots:
        date_str = h.get("acq_date")
        time_str = str(h.get("acq_time", "0000")).zfill(4)
        if date_str:
            try:
                dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H%M")
                timestamps.append(dt)
            except ValueError:
                pass

    if timestamps:
        timestamps.sort()
        first_seen = timestamps[0]
        last_seen = timestamps[-1]
        duration_hrs = round((last_seen - first_seen).total_seconds() / 3600.0, 1)
        temporal_span = {
            "first_seen": first_seen.strftime("%Y-%m-%d %H:%M"),
            "last_seen": last_seen.strftime("%Y-%m-%d %H:%M"),
            "duration_hours": duration_hrs,
        }
    else:
        temporal_span = {
            "first_seen": None,
            "last_seen": None,
            "duration_hours": 0.0,
        }

    frp_stats = {
        "total_mw": round(float(sum(frps)), 2) if frps else 0.0,
        "mean_mw": round(float(np.mean(frps)), 2) if frps else 0.0,
        "max_mw": round(float(max(frps)), 2) if frps else 0.0,
    }

    return {
        "centroid": centroid,
        "count": len(hotspots),
        "extent": extent,
        "temporal_span": temporal_span,
        "frp": frp_stats,
    }
