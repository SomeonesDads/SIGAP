"""Chat and streaming interaction endpoints for SIGAP multi-agent system."""

import json
from collections.abc import AsyncGenerator
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from backend.services.investigation_service import InvestigationService
except ImportError:
    from services.investigation_service import InvestigationService

router = APIRouter(prefix="/chat", tags=["Chat"])
service = InvestigationService()


class ChatMessageRequest(BaseModel):
    """Chat message request sent to the root Wildfire Response Orchestrator."""

    message: str = Field(..., description="User query or command in Indonesian or English")
    investigation_id: str | None = Field(
        default=None,
        description="Associated investigation ID if continuing an existing analysis context",
    )


class ChatMessageResponse(BaseModel):
    """Response returned by the multi-agent system."""

    response: str = Field(..., description="Synthesized response from the root orchestrator")
    investigation_id: str = Field(..., description="ID of the investigation associated with this session")


@router.post("/", response_model=ChatMessageResponse)
async def send_chat_message(payload: ChatMessageRequest) -> ChatMessageResponse:
    """Send natural language instruction to the Google ADK root orchestrator agent.

    Google ADK Integration Flow:
    1. The incoming message is routed to the Google ADK Multi-Agent Orchestrator.
    2. Orchestrator uses Gemini 3.5 Flash to parse intent, formulate multi-agent plan,
       and invoke specialized sub-agents:
       - Perception & Fusion Agent: Fuses NASA FIRMS thermal data and BMKG weather
       - Verification Agent: Assesses whether drone/imagery confirmation is needed
       - Risk Scoring Agent: Scores fire risk relative to all active hotspots and peatland depth
       - Routing & Dispatch Agent: Optimizes team-to-fire assignments using road networks
       - Coordination Agent: Directs field communications and triggers escalations
       - Feedback & Learning Agent: Updates risk weights based on post-action outcomes
    3. The agent system executes remote sensing tools, FIRMS queries, and spatial models,
       returning a natural language summary and structured context.
    """
    inv_id = payload.investigation_id or "inv-demo-pulang-pisau-001"

    # Stub response representing agent reasoning
    stub_reply = (
        f"Laporan diterima. Agen SIGAP telah menganalisis instruksi: '{payload.message}'. "
        f"Terdeteksi indikasi anomali termal di wilayah target. "
        f"Tim Perception Agent mengonfirmasi 18 titik api aktif (VIIRS) pada lahan gambut. "
        f"Rekomendasi tindakan prioritas telah disusun untuk koordinasi Manggala Agni."
    )

    return ChatMessageResponse(
        response=stub_reply,
        investigation_id=inv_id,
    )


async def sse_event_generator(investigation_id: str) -> AsyncGenerator[str, None]:
    """Generate Server-Sent Events (SSE) representing agent reasoning stream.

    Google ADK Streaming Integration:
    Connects to the Google ADK Runner event stream (e.g., runner.run_stream), capturing:
    - Thought steps and reasoning logs from Gemini 3.5 Flash
    - Sub-agent delegations and tool execution outputs
    - Progressive calculation milestones (cloud masking, U-Net mask, dNBR severity)
    """
    async for event in service.run(investigation_id):
        data_str = json.dumps(event)
        yield f"data: {data_str}\n\n"


@router.get("/{investigation_id}/stream")
async def stream_investigation_progress(investigation_id: str) -> StreamingResponse:
    """Stream real-time agent execution events via Server-Sent Events (SSE)."""
    record = service.get(investigation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )

    return StreamingResponse(
        sse_event_generator(investigation_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
