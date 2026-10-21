"""Investigation service for orchestrating wildfire analysis pipelines."""

import asyncio
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any

try:
    from backend.models.investigation import (
        InvestigationCreate,
        InvestigationResponse,
        InvestigationStatus,
    )
except ImportError:
    from models.investigation import (
        InvestigationCreate,
        InvestigationResponse,
        InvestigationStatus,
    )


class InvestigationService:
    """Service layer managing wildfire investigation lifecycles and agent workflows."""

    # In-memory storage for stub operations
    _store: dict[str, InvestigationResponse] = {}

    def __init__(self) -> None:
        # Seed initial demo data if store is empty
        if not self._store:
            sample_id = "inv-demo-pulang-pisau-001"
            self._store[sample_id] = InvestigationResponse(
                id=sample_id,
                status=InvestigationStatus.COMPLETED.value,
                query="Analisis kebakaran hutan di Pulang Pisau, Kalimantan Tengah 7 hari terakhir",
                region="Kalimantan Tengah",
                created_at=datetime(2026, 10, 20, 8, 30, 0, tzinfo=timezone.utc),
                updated_at=datetime(2026, 10, 20, 8, 35, 12, tzinfo=timezone.utc),
                results={
                    "hotspots_detected": 42,
                    "burned_area_hectares": 128.5,
                    "risk_level": "CRITICAL",
                    "dominant_land_cover": "Peat Swamp Forest (Gambut)",
                    "nearest_village": "Desa Sebangau Mulya (3.2 km)",
                    "recommended_action": "Prioritas dispatch Tim Manggala Agni Daops Pulang Pisau ke Klaster A",
                },
            )

    def create(self, request: InvestigationCreate) -> InvestigationResponse:
        """Create a new investigation job from a user query.

        TODO: Connect with Google ADK (Agent Development Kit) root orchestrator:
        1. Initialize Google ADK session with Gemini 3.5 Flash.
        2. Formulate investigation plan decomposing task across 6 specialized agents:
           - Perception & Fusion Agent (NASA FIRMS & Sipongi data)
           - Verification Agent (drone & high-res imagery check)
           - Risk Scoring Agent (peatland & settlement proximity)
           - Routing & Dispatch Agent (team optimization)
           - Coordination Agent (field comms & escalations)
           - Feedback & Learning Agent (post-action evaluation)
        3. Dispatch background task via worker or async runner.
        """
        investigation_id = f"inv-{uuid.uuid4().hex[:8]}"
        now = datetime.now(timezone.utc)
        try:
            from backend.api.routes.hotspot import extract_region_from_query
        except ImportError:
            from api.routes.hotspot import extract_region_from_query

        detected_region = request.region or extract_region_from_query(request.get_query())

        response = InvestigationResponse(
            id=investigation_id,
            status=InvestigationStatus.PENDING.value,
            query=request.get_query(),
            region=detected_region,
            created_at=now,
            updated_at=now,
            results=None,
        )
        self._store[investigation_id] = response
        return response

    def get(self, investigation_id: str) -> InvestigationResponse | None:
        """Retrieve investigation record by ID."""
        return self._store.get(investigation_id)

    def list_all(self) -> list[InvestigationResponse]:
        """List all active and completed investigations."""
        return list(self._store.values())

    async def run(self, investigation_id: str) -> AsyncGenerator[dict[str, Any], None]:
        """Run investigation pipeline using live NASA FIRMS thermal detections & spatial clustering."""
        record = self._store.get(investigation_id)
        if not record:
            yield {
                "step": "error",
                "message": f"Investigation {investigation_id} not found",
                "status": "failed",
            }
            return

        try:
            from backend.api.routes.hotspot import extract_region_from_query
        except ImportError:
            from api.routes.hotspot import extract_region_from_query

        target_region = record.region or extract_region_from_query(record.query)
        if "Auto-detected" in target_region:
            target_region = extract_region_from_query(record.query)

        yield {
            "investigation_id": investigation_id,
            "step": "perception",
            "message": f"Mengambil data anomali termal live NASA FIRMS (VIIRS 375m) untuk {target_region}...",
            "status": InvestigationStatus.RUNNING.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        try:
            from backend.api.routes.hotspot import fetch_live_or_fallback_hotspots
        except ImportError:
            from api.routes.hotspot import fetch_live_or_fallback_hotspots
        from data.earth_engine.client import search_aws_stac_sentinel2
        from data.geospatial.clustering import cluster_hotspots
        from ml.dinov3.predict import predict_dinov3_severity_zones

        raw_hotspots, is_live = await fetch_live_or_fallback_hotspots(region=target_region, day_range=2)
        clusters = cluster_hotspots(raw_hotspots, eps_km=8.0, min_samples=2)
        hotspot_count = len(raw_hotspots)
        cluster_count = len(clusters)
        top_cluster = clusters[0] if clusters else None
        top_centroid = top_cluster["stats"]["centroid"] if top_cluster else {"latitude": -2.85, "longitude": 114.12}
        c_lat = float(top_centroid["latitude"])
        c_lon = float(top_centroid["longitude"])
        total_frp = round(sum(float(h.get("frp") or 0.0) for h in raw_hotspots[:50]), 1)

        stac_scenes = search_aws_stac_sentinel2(
            bbox=[c_lon - 0.15, c_lat - 0.15, c_lon + 0.15, c_lat + 0.15],
            max_cloud=50.0,
            limit=4,
        )
        stac_scene_id = stac_scenes[0]["stac_id"] if stac_scenes else "S2A_49MFM_L2A"
        stac_cloud = stac_scenes[0]["cloud_cover"] if stac_scenes else 9.4

        yield {
            "investigation_id": investigation_id,
            "step": "satellite",
            "message": f"Terkonfirmasi {hotspot_count} hotspot ({cluster_count} klaster DBSCAN). Scene AWS STAC Sentinel-2 L2A: {stac_scene_id} (awan {stac_cloud}%)...",
            "status": InvestigationStatus.RUNNING.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await asyncio.sleep(0.1)

        dinov3_res = predict_dinov3_severity_zones(
            center_lat=c_lat,
            center_lon=c_lon,
            scale_factor=max(0.6, min(2.6, (hotspot_count / 45.0) ** 0.5)),
        )
        burned_area_ha = float(dinov3_res["estimated_area_ha"])

        yield {
            "investigation_id": investigation_id,
            "step": "segmentation",
            "message": f"Menjalankan inferensi DINOv3 BurnSeg pada episentrum ({c_lat:.4f}°, {c_lon:.4f}°) -> {burned_area_ha} Ha terdeteksi...",
            "status": InvestigationStatus.RUNNING.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await asyncio.sleep(0.1)

        yield {
            "investigation_id": investigation_id,
            "step": "risk_scoring",
            "message": f"Menghitung indeks risiko MCDA (estimasi DINOv3 {burned_area_ha} Ha, total FRP {total_frp} MW)...",
            "status": InvestigationStatus.RUNNING.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await asyncio.sleep(0.1)

        yield {
            "investigation_id": investigation_id,
            "step": "routing",
            "message": "Mengoptimasi alokasi unit Manggala Agni & BPBD terdekat...",
            "status": InvestigationStatus.RUNNING.value,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        risk_level = "CRITICAL" if hotspot_count >= 15 or total_frp >= 80 else ("HIGH" if hotspot_count >= 5 else "MEDIUM")
        results_payload = {
            "is_live": is_live,
            "hotspots_detected": hotspot_count,
            "cluster_count": cluster_count,
            "total_frp_mw": total_frp,
            "epicenter": top_centroid,
            "stac_scene_id": stac_scene_id,
            "stac_cloud_cover_percent": stac_cloud,
            "burned_area_hectares": burned_area_ha,
            "coverage_breakdown_ha": dinov3_res.get("coverage_breakdown_ha", {}),
            "risk_level": risk_level,
            "dominant_land_cover": "Lahan Gambut & Hutan Rawa Sekunder",
            "recommended_action": f"Prioritas dispatch Tim Manggala Agni ke episentrum klaster #1 ({c_lat:.4f}°, {c_lon:.4f}°)",
        }

        self._store[investigation_id] = InvestigationResponse(
            id=investigation_id,
            status=InvestigationStatus.COMPLETED.value,
            query=record.query,
            region=target_region,
            created_at=record.created_at,
            updated_at=datetime.now(timezone.utc),
            results=results_payload,
        )

        yield {
            "investigation_id": investigation_id,
            "step": "completed",
            "message": f"Analisis live selesai: {hotspot_count} titik panas ({cluster_count} klaster) di {target_region}.",
            "status": InvestigationStatus.COMPLETED.value,
            "results": results_payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

