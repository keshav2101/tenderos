"""Bid qualification service FastAPI application."""
from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict
from uuid import UUID

import asyncpg
import structlog
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.config import settings
from app.qualification_engine import BidQualificationEngine

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Bid Qualification Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

engine = BidQualificationEngine()
_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.POSTGRES_HOST, port=settings.POSTGRES_PORT,
            database=settings.POSTGRES_DB, user=settings.POSTGRES_USER,
            password=settings.POSTGRES_PASSWORD, min_size=2, max_size=10,
        )
    return _pool


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "bid-qualification-service"}


async def _get_company_profile(conn, user_id: str) -> dict:
    # Get company profile linked to the user
    company_row = await conn.fetchrow(
        """
        SELECT c.*,
               array_agg(t.year) as turnover_years,
               array_agg(t.value_lakhs) as turnover_values
        FROM companies c
        LEFT JOIN users u ON u.company_id = c.id
        LEFT JOIN company_turnover t ON t.company_id = c.id
        WHERE u.id = $1
        GROUP BY c.id
        """,
        UUID(user_id)
    )

    certs_rows = []
    company_experience_years = 3.0
    company_states_active = ["Delhi", "Maharashtra"]
    company_categories = ["AI", "IT", "Cybersecurity", "Data Analytics"]
    company_turnover = 724.0  # fallback in Lakhs (7.24 Cr)

    if company_row:
        certs_rows = await conn.fetch(
            "SELECT standard FROM company_certifications WHERE company_id = $1 AND verification_status = 'verified'",
            company_row["id"]
        )
        # Fetch experience
        exp_row = await conn.fetchrow(
            "SELECT SUM(EXTRACT(YEAR FROM age(end_date, start_date))) as years FROM company_experience WHERE company_id = $1 AND verification_status = 'verified'",
            company_row["id"]
        )
        if exp_row and exp_row["years"]:
            company_experience_years = float(exp_row["years"])

        # Construct states, categories, and average turnover
        if company_row["states_active"]:
            company_states_active = company_row["states_active"]
        if company_row["target_categories"]:
            company_categories = company_row["target_categories"]
        
        # Calculate average turnover from values
        turnover_vals = [float(v) for v in company_row["turnover_values"] if v is not None]
        if turnover_vals:
            company_turnover = sum(turnover_vals) / len(turnover_vals)

    is_msme = company_row["entity_type"] in ("MSME_Micro", "MSME_Small", "MSME_Medium", "SME") if company_row and company_row.get("entity_type") else True
    is_startup = company_row["entity_type"] == "Startup" if company_row and company_row.get("entity_type") else False

    return {
        "name": company_row["legal_name"] if company_row else "Demo Corporation Private Limited",
        "is_msme": is_msme,
        "is_startup": is_startup,
        "total_experience_years": company_experience_years,
        "certifications": [c["standard"] for c in certs_rows] if certs_rows else ["ISO 9001:2015", "CMMI Level 3"],
        "states_active": company_states_active,
        "target_categories": company_categories,
        "avg_turnover_3yr_lakhs": company_turnover,
        "profile_score": float(company_row["profile_score"]) if company_row else 85.0,
    }



@app.get("/qualify/{tender_id}")
async def qualify_tender(tender_id: str, user_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Get tender
        tender_row = await conn.fetchrow(
            "SELECT id, title, ministry, department, state, categories, estimated_cost_lakhs, emd_lakhs, msme_eligible, startup_eligible, experience_years, turnover_min_lakhs, certifications_required FROM tenders WHERE id = $1",
            UUID(tender_id)
        )
        if not tender_row:
            raise HTTPException(status_code=404, detail="Tender not found")

        company_profile = await _get_company_profile(conn, user_id)
        tender_data = dict(tender_row)

        # Run qualification
        result = engine.qualify(company_profile, tender_data)
        return result


@app.get("/recommendations")
async def recommendations(user_id: str, limit: int = 10, min_score: int = 60):
    pool = await get_pool()
    async with pool.acquire() as conn:
        # Fetch company profile linked to the user
        company_profile = await _get_company_profile(conn, user_id)

        # Fetch active tenders
        tenders = await conn.fetch(
            "SELECT id, title, ministry, department, state, categories, estimated_cost_lakhs, emd_lakhs, msme_eligible, startup_eligible, experience_years, turnover_min_lakhs, certifications_required, submission_deadline FROM tenders WHERE status = 'active' LIMIT 50"
        )


        results = []
        for t in tenders:
            qual = engine.qualify(company_profile, dict(t))
            if qual["match_score"] >= min_score:
                results.append({
                    "id": str(t["id"]),
                    "title": t["title"],
                    "ministry": t["ministry"],
                    "department": t["department"],
                    "state": t["state"],
                    "estimated_cost_lakhs": t["estimated_cost_lakhs"],
                    "submission_deadline": t["submission_deadline"].isoformat() if isinstance(t["submission_deadline"], datetime) else t["submission_deadline"],
                    "categories": t["categories"],
                    "match_score": qual["match_score"],
                    "winning_probability": qual["winning_probability"],
                    "recommendation": qual["recommendation"],
                })

        # Sort by match score descending
        results.sort(key=lambda x: x["match_score"], reverse=True)
        return results[:limit]

