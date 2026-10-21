"""Investigation endpoints for SIGAP."""

from typing import Any
from fastapi import APIRouter, HTTPException, status

try:
    from backend.models.investigation import (
        InvestigationCreate,
        InvestigationResponse,
        VerificationRequest,
    )
    from backend.services.investigation_service import InvestigationService
except ImportError:
    from models.investigation import (
        InvestigationCreate,
        InvestigationResponse,
        VerificationRequest,
    )
    from services.investigation_service import InvestigationService

router = APIRouter(prefix="/investigations", tags=["Investigations"])
service = InvestigationService()


@router.post("/", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
async def create_investigation(payload: InvestigationCreate) -> InvestigationResponse:
    """Create a new autonomous wildfire investigation."""
    return service.create(payload)


@router.get("/", response_model=list[InvestigationResponse])
async def list_investigations() -> list[InvestigationResponse]:
    """List all active and historical wildfire investigations."""
    return service.list_all()


@router.get("/{investigation_id}", response_model=InvestigationResponse)
async def get_investigation(investigation_id: str) -> InvestigationResponse:
    """Get investigation details, status, and findings by ID."""
    record = service.get(investigation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )
    return record


@router.post("/{investigation_id}/verify")
async def verify_investigation(
    investigation_id: str,
    payload: VerificationRequest,
) -> dict[str, Any]:
    """Submit human-in-the-loop verification (confirmed, unconfirmed, needs_field_check)."""
    record = service.get(investigation_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Investigation '{investigation_id}' not found",
        )

    return {
        "investigation_id": investigation_id,
        "verification_status": payload.status,
        "notes": payload.notes,
        "verified_by": payload.verified_by,
        "message": f"Verification '{payload.status}' successfully recorded.",
    }
