"""Proposals, Notifications, Auth, and Admin routers."""

from fastapi import APIRouter, Path, Request

from app.config import settings
from app.proxy import ServiceProxy

# ─── Proposals ───────────────────────────────────────────────────────────────
router = APIRouter()
_proposal = ServiceProxy(settings.PROPOSAL_SERVICE_URL, timeout=90.0)


@router.get("/{tender_id}", summary="Generate AI proposal draft for a tender")
async def get_proposal(request: Request, tender_id: str = Path(...)):
    user = getattr(request.state, "user", None) or {}
    user_id = user.get("user_id", "guest_user")
    return await _proposal.get(
        f"/proposals/{tender_id}",
        params={"user_id": user_id},
    )


@router.get("/{tender_id}/workflow", summary="Get bid workflow state")
async def get_workflow_state(request: Request, tender_id: str = Path(...)):
    return await _proposal.get(f"/proposals/{tender_id}/workflow", request=request)


@router.post("/{tender_id}/workflow/transition", summary="Transition bid workflow state")
async def transition_workflow_state(request: Request, tender_id: str = Path(...)):
    body = await request.json()
    user = getattr(request.state, "user", None) or {}
    # Inject user role from gateway state
    body["user_role"] = user.get("role", "viewer")
    return await _proposal.post(
        f"/proposals/{tender_id}/workflow/transition",
        json=body,
        request=request,
    )
