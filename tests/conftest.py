"""Shared Pytest fixtures for SIGAP test suite.

Provides mock data, configuration settings, and state fixtures for testing
agent workflows, data connectors, and ML pipelines.
"""

from typing import Any, Dict, List
import pytest


@pytest.fixture
def mock_settings() -> Dict[str, Any]:
    """Mock application settings fixture."""
    return {
        "FIRMS_API_KEY": "test_map_key_0123456789abcdef",
        "FIRMS_BASE_URL": "https://firms.modaps.eosdis.nasa.gov",
        "GEE_PROJECT_ID": "sigap-wildfire-test",
        "DEFAULT_CLUSTER_EPS_KM": 1.5,
        "DEFAULT_MIN_SAMPLES": 3,
        "UNET_WEIGHTS_PATH": "ml/weights/best_model.pth",
        "DEVICE": "cpu",
    }


@pytest.fixture
def sample_hotspot_data() -> List[Dict[str, Any]]:
    """Sample active fire hotspot records representing a Pulang Pisau cluster."""
    return [
        {
            "latitude": -2.8541,
            "longitude": 114.1205,
            "brightness": 345.2,
            "scan": 0.4,
            "track": 0.36,
            "acq_date": "2023-09-20",
            "acq_time": "0530",
            "satellite": "N",
            "instrument": "VIIRS",
            "confidence": "high",
            "version": "2.0NRT",
            "bright_ti5": 298.1,
            "frp": 24.8,
            "daynight": "D",
        },
        {
            "latitude": -2.8583,
            "longitude": 114.1248,
            "brightness": 352.0,
            "scan": 0.4,
            "track": 0.36,
            "acq_date": "2023-09-20",
            "acq_time": "0530",
            "satellite": "N",
            "instrument": "VIIRS",
            "confidence": "high",
            "version": "2.0NRT",
            "bright_ti5": 302.4,
            "frp": 38.2,
            "daynight": "D",
        },
        {
            "latitude": -2.8510,
            "longitude": 114.1190,
            "brightness": 338.7,
            "scan": 0.4,
            "track": 0.36,
            "acq_date": "2023-09-21",
            "acq_time": "0615",
            "satellite": "N",
            "instrument": "VIIRS",
            "confidence": "nominal",
            "version": "2.0NRT",
            "bright_ti5": 295.0,
            "frp": 15.6,
            "daynight": "D",
        },
        {
            "latitude": -2.8595,
            "longitude": 114.1260,
            "brightness": 360.1,
            "scan": 0.4,
            "track": 0.36,
            "acq_date": "2023-09-21",
            "acq_time": "0615",
            "satellite": "N",
            "instrument": "VIIRS",
            "confidence": "high",
            "version": "2.0NRT",
            "bright_ti5": 305.8,
            "frp": 45.1,
            "daynight": "D",
        },
    ]


@pytest.fixture
def sample_investigation() -> Dict[str, Any]:
    """Sample investigation state object."""
    return {
        "investigation_id": "INV-20230920-PLP01",
        "target_region": "Pulang Pisau, Kalimantan Tengah",
        "status": "ANALYZING",
        "priority_level": "CRITICAL",
        "aoi": {
            "type": "Polygon",
            "coordinates": [
                [
                    [114.10, -2.88],
                    [114.15, -2.88],
                    [114.15, -2.83],
                    [114.10, -2.83],
                    [114.10, -2.88],
                ]
            ],
        },
        "created_at": "2023-09-20T08:00:00Z",
        "findings": {
            "hotspot_count": 4,
            "peatland_confirmed": True,
            "nearest_settlement_km": 1.8,
            "estimated_burned_area_ha": 32.4,
            "dnbr_severity": "high_severity",
        },
        "actions_recommended": [
            "Dispatch Manggala Agni patrol to ground-check peat smoldering perimeter",
            "Alert BPBD regarding smoke drift risk to adjacent settlements",
        ],
    }
