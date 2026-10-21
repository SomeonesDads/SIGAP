# SIGAP Data Integration & Geospatial Analytics

This package contains data ingestion clients, satellite retrieval connectors, and spatial analysis modules for the **SIGAP (Agen Karhutla)** platform.

---

## 1. Architecture & Data Sources

```
data/
├── __init__.py
├── README.md                      # This documentation
├── firms/                         # NASA FIRMS API Client
│   ├── __init__.py
│   └── client.py                  # Async client for VIIRS/MODIS thermal hotspots
├── earth_engine/                  # Google Earth Engine Integration
│   ├── __init__.py
│   └── client.py                  # Landsat & Sentinel-2 retrieval, NBR, cloud masking
└── geospatial/                    # Spatial & Decision Analytics
    ├── __init__.py
    ├── dNBR.py                    # Differenced Normalized Burn Ratio (dNBR) & severity
    ├── clustering.py              # DBSCAN spatial-temporal hotspot clustering
    └── priority.py                # Multi-criteria risk scoring & 'Why This Area?' explanations
```

---

## 2. Ingestion Modules

### 2.1 NASA FIRMS Active Fire Client (`data/firms/client.py`)
- Connects asynchronously via `httpx` to the NASA FIRMS REST API.
- Supports sensor products:
  - `VIIRS_SNPP_NRT` (375 m spatial resolution)
  - `VIIRS_NOAA20_NRT` / `VIIRS_NOAA21_NRT`
  - `MODIS_NRT` (1 km resolution)
- Queries by bounding box coordinates (`[west, south, east, north]`) or country ISO codes (e.g., `'IDN'`).
- Parses CSV data into structured Python dictionaries with coordinates, brightness temperature, fire radiative power (FRP), and detection confidence.

### 2.2 Google Earth Engine Client (`data/earth_engine/client.py`)
- Searches Google Earth Engine image archives for multi-spectral observations matching suspected wildfire events:
  - `LANDSAT/LC09/C02/T1_L2` (Landsat 9 Level-2 Surface Reflectance)
  - `LANDSAT/LC08/C02/T1_L2` (Landsat 8 Level-2 Surface Reflectance)
  - `COPERNICUS/S2_SR_HARMONIZED` (Sentinel-2 MSI Level-2A)
- Automatically compiles pre-fire and post-fire imagery pairs across customizable temporal windows.
- Computes pixel-level Normalized Burn Ratio (NBR) and localized cloud cover fraction using the `QA_PIXEL` mask.

---

## 3. Geospatial & Decision Support

### 3.1 Hotspot Clustering (`data/geospatial/clustering.py`)
- Groups discrete thermal points into cohesive fire fronts using **DBSCAN** with a **spherical haversine metric**.
- Eliminates sensor noise and transient flares.
- Computes comprehensive cluster statistics:
  - Centroid geographic coordinate
  - Bounding box spatial extent
  - Temporal duration (first seen to last seen in hours)
  - Cumulative Fire Radiative Power (MW)

### 3.2 dNBR Analysis & Severity Classification (`data/geospatial/dnbr.py`)
- Calculates:
  $$\text{NBR} = \frac{\text{NIR} - \text{SWIR}}{\text{NIR} + \text{SWIR}}$$
  $$\text{dNBR} = (\text{NBR}_{\text{pre}} - \text{NBR}_{\text{post}}) \times 1000$$
- Classifies severity based on USGS FIREMON categories:
  - `Enhanced Regrowth` (\(< -100\))
  - `Unburned` (\(-100\) to \(+100\))
  - `Low Severity` (\(+100\) to \(+270\))
  - `Moderate-Low Severity` (\(+270\) to \(+440\))
  - `Moderate-High Severity` (\(+440\) to \(+660\))
  - `High Severity` (\(\ge +660\))
- Incorporates domain caveats regarding tropical peatlands (smoldering subsurface burns with subtle canopy loss) and moisture artifacts.

### 3.3 Risk-based Prioritization (`data/geospatial/priority.py`)
Ranks candidate wildfire areas using Multi-Criteria Decision Analysis (MCDA):
- **Peatland Vulnerability (25%):** Prioritizes peat swamp forests (high carbon stock, severe smoldering).
- **Settlement Proximity (25%):** Distance to human populations and schools to mitigate toxic haze.
- **Hotspot Count (15%):** Scale of active fire front.
- **Hotspot Recurrence (15%):** Uncontrolled fires active across multiple consecutive days.
- **Estimated Burned Area (10%):** Hectares affected based on U-Net segmentation or dNBR.
- **Spectral Burn Severity (10%):** Magnitude of biomass loss.
- **Evidence Quality Weighting:** Accounts for sensor confidence and obscuring clouds.

Produces transparent, human-readable explanations (**"Why This Area? / Alasan Prioritas"**) for disaster response agencies (BPBD, Manggala Agni).

---

## 4. Quickstart Example

```python
import asyncio
from data.firms.client import FIRMSClient
from data.geospatial.clustering import cluster_hotspots
from data.geospatial.priority import PriorityFactors, rank_areas

async def main():
    # 1. Fetch hotspots
    firms = FIRMSClient(api_key="YOUR_NASA_MAP_KEY")
    hotspots = await firms.get_hotspots(
        region={"west": 113.8, "south": -3.2, "east": 114.5, "north": -2.5},
        date_start="2023-09-15",
        day_range=3
    )

    # 2. Cluster hotspots (1.5 km radius, minimum 3 points)
    clusters = cluster_hotspots(hotspots, eps_km=1.5, min_samples=3)

    # 3. Prioritize clusters
    areas = []
    for c in clusters:
        factors = PriorityFactors(
            is_peatland=True,
            distance_to_settlement_km=2.5,
            hotspot_count=c["count"],
            hotspot_recurrence=2,
            estimated_burned_area_ha=14.5,
            dnbr_severity="high_severity",
            evidence_quality=0.9
        )
        areas.append({"cluster_id": c["cluster_id"], "factors": factors})

    ranked = rank_areas(areas)
    for top in ranked:
        print(f"Cluster {top['cluster_id']}: Score {top['priority_score']} [{top['priority_level']}]")
        print(f"Explanation: {top['explanation']}\n")

if __name__ == "__main__":
    asyncio.run(main())
```
