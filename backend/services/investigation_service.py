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

        response = InvestigationResponse(
            id=investigation_id,
            status=InvestigationStatus.PENDING.value,
            query=request.query,
            region=request.region or "Indonesia (Auto-detected)",
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
        """Run investigation pipeline and stream progressive agent thought events.

        TODO: Connect with Google ADK multi-agent runner stream:
        Stream live events from Google ADK:
        - Orchestrator reasoning step
        - Perception Agent query to NASA FIRMS
        - GEE Satellite retrieval status
        - PyTorch U-Net inference execution
        - Risk scoring computation
        - Final recommendation synthesis
        """
        record = self._store.get(investigation_id)
        if not record:
            yield {
                "step": "error",
                "message": f"Investigation {investigation_id} not found",
                "status": "failed",
            }
            return

        steps = [
            (
                "perception",
                "Mengambil data anomali termal NASA FIRMS & BMKG...",
                InvestigationStatus.RUNNING.value,
            ),
            (
                "satellite",
                "Mengunduh citra Sentinel-2 & Landsat 9 via Google Earth Engine...",
                InvestigationStatus.RUNNING.value,
            ),
            (
                "segmentation",
                "Menjalankan inferensi model U-Net (PyTorch) untuk segmentasi scar...",
                InvestigationStatus.RUNNING.value,
            ),
            (
                "risk_scoring",
                "Menghitung indeks risiko gambut dan ancaman pemukiman...",
                InvestigationStatus.RUNNING.value,
            ),
            (
                "routing",
                "Mengoptimasi alokasi unit Manggala Agni & BPBD...",
                InvestigationStatus.RUNNING.value,
            ),
            (
                "completed",
                "Analisis investigasi selesai. Laporan siap diunduh.",
                InvestigationStatus.COMPLETED.value,
            ),
        ]

        for step_name, message, status in steps:
            await asyncio.sleep(0.5)  # Simulate agent pipeline progression
            yield {
                "investigation_id": investigation_id,
                "step": step_name,
                "message": message,
                "status": status,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }

        # Update record in store upon completion
        self._store[investigation_id] = InvestigationResponse(
            id=investigation_id,
            status=InvestigationStatus.COMPLETED.value,
            query=record.query,
            region=record.region,
            created_at=record.created_at,
            updated_at=datetime.now(timezone.utc),
            results={
                "hotspots_detected": 18,
                "burned_area_hectares": 54.2,
                "risk_level": "HIGH",
                "dominant_land_cover": "Lahan Gambut Dangkal",
                "recommended_action": "Segera kirim regu pemadam ke koordinat episentrum cluster #1",
            },
        )
