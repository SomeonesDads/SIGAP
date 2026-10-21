"""Geospatial analysis package for wildfire monitoring.

Contains dNBR computation, burn severity classification,
DBSCAN hotspot clustering, and multi-factor risk prioritization.
"""

from data.geospatial.dnbr import (
    DEFAULT_SEVERITY_THRESHOLDS,
    classify_severity,
    compute_dnbr,
    compute_nbr,
)
from data.geospatial.clustering import cluster_hotspots, compute_cluster_stats
from data.geospatial.priority import (
    DEFAULT_WEIGHTS,
    PriorityFactors,
    compute_priority_score,
    explain_priority,
    rank_areas,
)

__all__ = [
    "DEFAULT_SEVERITY_THRESHOLDS",
    "compute_nbr",
    "compute_dnbr",
    "classify_severity",
    "cluster_hotspots",
    "compute_cluster_stats",
    "DEFAULT_WEIGHTS",
    "PriorityFactors",
    "compute_priority_score",
    "rank_areas",
    "explain_priority",
]
