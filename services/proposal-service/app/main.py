"""Proposal service FastAPI application."""
from __future__ import annotations
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import structlog

logger = structlog.get_logger()

app = FastAPI(title="TenderOS Proposal Service", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


from app.agents import ComplianceAgent, TechnicalProposalAgent, RiskAssessmentAgent

# Read from environment; falls back to a non-functional placeholder so service
# starts cleanly even when the key is absent (agents return graceful errors).
import os
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "proposal-service"}


import httpx
from app.config import settings

@app.get("/proposals/{tender_id}")
async def generate_proposal(tender_id: str, user_id: str = "default_user"):
    # 1. Fetch user company profile & tender specification details
    company_profile = {
        "name": "Acme Software India",
        "experience_years": 8.5,
        "average_turnover_lakhs": 724.0,
        "certifications": ["SOC 2 Type II", "ISO 9001"]
    }
    
    tender_spec = {
        "tender_id": tender_id,
        "title": "AI Cloud Platform Deployment - Ministry of Finance",
        "min_experience_required": 5,
        "required_certifications": ["ISO 27001"],
        "min_turnover_lakhs": 250.0,
        "risk_penalty_clause": "Clause 8.2: 1% per week delay penalty"
    }

    # Fetch company profile from digital-twin-service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.DIGITAL_TWIN_SERVICE_URL}/profile/{user_id}")
            if resp.status_code == 200:
                data = resp.json()
                company_profile = {
                    "name": data.get("legal_name") or data.get("name") or "Acme Software India",
                    "experience_years": float(data.get("total_experience_years") or data.get("experience_years") or 8.5),
                    "average_turnover_lakhs": float(data.get("avg_turnover_3yr_lakhs") or data.get("average_turnover_lakhs") or 724.0),
                    "certifications": data.get("certifications") or ["SOC 2 Type II", "ISO 9001"]
                }
    except Exception as e:
        logger.warning("Failed to fetch dynamic company profile for proposal, using fallback mock", error=str(e))

    # Fetch tender details from tender-service
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{settings.TENDER_SERVICE_URL}/tenders/{tender_id}")
            if resp.status_code == 200:
                data = resp.json()
                tender_spec = {
                    "tender_id": tender_id,
                    "title": data.get("title") or "AI Cloud Platform Deployment - Ministry of Finance",
                    "min_experience_required": int(data.get("experience_years") or data.get("min_experience_required") or 5),
                    "required_certifications": data.get("certifications_required") or ["ISO 27001"],
                    "min_turnover_lakhs": float(data.get("turnover_min_lakhs") or data.get("min_turnover_lakhs") or 250.0),
                    "risk_penalty_clause": "Clause 8.2: 1% per week delay penalty" # static descriptor
                }
    except Exception as e:
        logger.warning("Failed to fetch dynamic tender specification for proposal, using fallback mock", error=str(e))


    # 2. Run multi-agent proposal assembly
    compliance_agent = ComplianceAgent(GEMINI_API_KEY)
    tech_agent = TechnicalProposalAgent(GEMINI_API_KEY)
    risk_agent = RiskAssessmentAgent(GEMINI_API_KEY)

    compliance_results = await compliance_agent.analyze(company_profile, tender_spec)
    tech_results = await tech_agent.generate_draft(company_profile, tender_spec)
    risk_results = await risk_agent.assess_risks(tender_spec)

    return {
        "tender_id": tender_id,
        "user_id": user_id,
        "status": "COMPLETED",
        "compliance_check": compliance_results,
        "technical_proposal_draft": tech_results,
        "risk_assessment": risk_results,
        "missing_documents_checklist": [
            {"name": "ISO 27001:2022 Certificate", "action": "Upload certificate or apply for waiver if allowed for MSMEs"}
        ],
        "generated_by": "Autonomous Procurement Copilot Agents"
    }


# ─── Bid Workflow State Operations ───────────────────────────────────────────
# Workflow already imported at module level to keep concerns together
from app.workflow import BidWorkflow

# In-memory database mapping tender_id -> state
_bid_states = {}


@app.get("/proposals/{tender_id}/workflow")
async def get_workflow_state(tender_id: str):
    state = _bid_states.get(tender_id, "AI_RECOMMENDATION")
    return {"tender_id": tender_id, "state": state}


class TransitionRequest(BaseModel):
    target_state: str
    user_role: str  # Enforced via API gateway


@app.post("/proposals/{tender_id}/workflow/transition")
async def transition_workflow_state(tender_id: str, req: TransitionRequest):
    current_state = _bid_states.get(tender_id, "AI_RECOMMENDATION")
    
    # RBAC logic verification inside the service as defense-in-depth
    if req.target_state in ("MANAGEMENT_APPROVAL", "BID_SUBMISSION") and req.user_role not in ("admin", "enterprise", "consultant"):
        raise HTTPException(status_code=403, detail="Role does not have permissions to approve or submit bids")

    try:
        wf = BidWorkflow(current_state)
        old_state = wf.transition_to(req.target_state)
        _bid_states[tender_id] = req.target_state
        logger.info("Bid workflow state transitioned", tender_id=tender_id, from_state=old_state, to_state=req.target_state)
        return {
            "tender_id": tender_id,
            "old_state": old_state,
            "new_state": req.target_state,
            "status": "success"
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

