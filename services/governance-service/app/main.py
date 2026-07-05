"""Governance service tracking AI explainability, models registry, and audits."""
from typing import List, Dict, Any, Optional
from datetime import datetime

import structlog
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Governance Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


# In-memory mock registries representing databases
_models = [
    {
        "id": "model-001",
        "model_name": "gemini-2.0-flash",
        "version": "v2.0",
        "provider": "google",
        "prompt_version": "p-1.4",
        "temperature": 0.0,
        "cost_per_token": 0.0000015,
        "is_active": True,
        "latency_ms": 450,
        "tokens_used": 14200,
        "accuracy_score": 0.94
    },
    {
        "id": "model-002",
        "model_name": "claude-3-5-sonnet",
        "version": "v1.0",
        "provider": "anthropic",
        "prompt_version": "p-2.1",
        "temperature": 0.2,
        "cost_per_token": 0.000015,
        "is_active": True,
        "latency_ms": 1200,
        "tokens_used": 8500,
        "accuracy_score": 0.97
    }
]

_decision_audit_logs = [
    {
        "id": "audit-001",
        "timestamp": datetime.utcnow().isoformat(),
        "tender_id": "tender-abc-123",
        "user_id": "user-user-001",
        "recommendation": "Recommended",
        "evidence": [
            {"source": "Tender Page 18 Clause 4.2"},
            {"source": "Company Profile: Experience"}
        ],
        "confidence": 0.87,
        "model_name": "gemini-2.0-flash",
        "prompt_version": "p-1.4",
        "final_human_decision": "APPROVED"
    }
]


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "governance-service"}


@app.get("/governance/audit")
async def list_audit_trail(tender_id: Optional[str] = None):
    if tender_id:
        return [log for log in _decision_audit_logs if log["tender_id"] == tender_id]
    return _decision_audit_logs


@app.get("/models")
async def list_registered_models():
    return _models


@app.get("/governance/dashboard")
async def get_governance_metrics():
    return {
        "ai_accuracy_rate": 0.965,
        "hallucination_rate_historical": 0.002,
        "citation_accuracy_score": 0.99,
        "user_acceptance_rate": 0.88,
        "llm_cost_mtd_usd": 124.50,
        "avg_latency_ms": 680,
        "active_models_count": len([m for m in _models if m["is_active"]]),
        "total_audited_recommendations": len(_decision_audit_logs)
    }
