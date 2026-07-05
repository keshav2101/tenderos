"""Admin service FastAPI application."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict
from uuid import uuid4
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="TenderOS Admin Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


class UpdateRoleRequest(BaseModel):
    role: str


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "admin-service"}


@app.get("/connectors")
async def list_connectors():
    return [
        {
            "id": "conn-001",
            "source_id": "gem",
            "display_name": "Government e-Marketplace (GeM)",
            "last_sync": datetime.utcnow().isoformat(),
            "health_status": "healthy",
            "cadence": "*/15 * * * *",
        },
        {
            "id": "conn-002",
            "source_id": "cppp",
            "display_name": "Central Public Procurement Portal (CPPP)",
            "last_sync": datetime.utcnow().isoformat(),
            "health_status": "healthy",
            "cadence": "0 * * * *",
        },
        {
            "id": "conn-003",
            "source_id": "mock",
            "display_name": "Mock Data Generator",
            "last_sync": datetime.utcnow().isoformat(),
            "health_status": "healthy",
            "cadence": "*/30 * * * *",
        },
    ]


@app.post("/connectors/{source_id}/sync")
async def trigger_sync(source_id: str):
    return {
        "status": "success",
        "job_id": str(uuid4()),
        "message": f"Sync triggered successfully for connector '{source_id}'",
    }


@app.get("/sync-jobs")
async def list_sync_jobs(page: int = 1, page_size: int = 20):
    return {
        "page": page,
        "page_size": page_size,
        "jobs": [
            {
                "job_id": str(uuid4()),
                "connector_id": "gem",
                "started_at": datetime.utcnow().isoformat(),
                "finished_at": datetime.utcnow().isoformat(),
                "tenders_found": 12,
                "status": "COMPLETED",
            },
            {
                "job_id": str(uuid4()),
                "connector_id": "cppp",
                "started_at": datetime.utcnow().isoformat(),
                "finished_at": datetime.utcnow().isoformat(),
                "tenders_found": 8,
                "status": "COMPLETED",
            },
        ]
    }


@app.get("/users")
async def list_users(page: int = 1, page_size: int = 20):
    return {
        "page": page,
        "page_size": page_size,
        "users": [
            {"id": "usr-001", "email": "admin@tenderos.in", "name": "System Admin", "role": "admin", "plan": "enterprise"},
            {"id": "usr-002", "email": "user@democorp.com", "name": "John Doe", "role": "viewer", "plan": "sme"},
        ]
    }


@app.put("/users/{user_id}/role")
async def update_user_role(user_id: str, req: UpdateRoleRequest):
    return {"status": "success", "message": f"User {user_id} role updated to {req.role}"}


@app.get("/stats")
async def get_stats():
    return {
        "total_users": 1420,
        "paying_users": 340,
        "api_keys_active": 180,
        "total_requests_24h": 85940,
        "error_rate_pct": 0.04,
    }


@app.get("/logs")
async def get_logs(page: int = 1, page_size: int = 50):
    return {
        "page": page,
        "page_size": page_size,
        "logs": [
            {"timestamp": datetime.utcnow().isoformat(), "user_id": "usr-001", "action": "connector_sync_trigger", "resource": "gem"},
            {"timestamp": datetime.utcnow().isoformat(), "user_id": "usr-002", "action": "tender_qualification", "resource": "t-001"},
        ]
    }
