"""Prediction service FastAPI application."""
from __future__ import annotations
from typing import Optional, List, Dict
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TenderOS Prediction Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "prediction-service"}


@app.get("/predictions")
async def get_predictions(
    ministry: Optional[str] = None,
    category: Optional[str] = None,
    horizon_days: int = 90,
):
    # Returns simulated upcoming tender predictions
    predictions = [
        {
            "ministry": "Ministry of Health and Family Welfare",
            "category": "Medical Equipment",
            "estimated_value_cr": 85.0,
            "expected_release_date": "July 2026",
            "probability": 88,
            "confidence": "HIGH",
            "details": "Annual procurement of MRI/CT scans for district hospitals in Karnataka. Historically released in late July.",
        },
        {
            "ministry": "Ministry of Finance",
            "category": "AI / Data Analytics",
            "estimated_value_cr": 120.0,
            "expected_release_date": "August 2026",
            "probability": 72,
            "confidence": "MEDIUM",
            "details": "Upgrade of Tax Processing engines. Expected to include machine learning fraud pattern analysis tools.",
        },
        {
            "ministry": "Ministry of Electronics and Information Technology",
            "category": "Cybersecurity",
            "estimated_value_cr": 45.0,
            "expected_release_date": "September 2026",
            "probability": 65,
            "confidence": "MEDIUM",
            "details": "National Security Audit contract. Retender due to contract expiration of the current empanelment vendor.",
        },
        {
            "ministry": "Ministry of Urban Development",
            "category": "Smart City / IoT",
            "estimated_value_cr": 210.0,
            "expected_release_date": "October 2026",
            "probability": 91,
            "confidence": "HIGH",
            "details": "Pune Smart City command center Phase 2. Confirmed budget allocations under AMRUT 2.0 scheme.",
        },
    ]

    # Filter based on query parameters
    filtered = predictions
    if ministry:
        filtered = [p for p in filtered if ministry.lower() in p["ministry"].lower()]
    if category:
        filtered = [p for p in filtered if category.lower() in p["category"].lower()]

    return {
        "horizon_days": horizon_days,
        "predictions": filtered
    }


@app.get("/predictions/seasonal")
async def get_seasonal_patterns(ministry: Optional[str] = None):
    return {
        "ministry": ministry or "all",
        "patterns": [
            {"month": "January", "intensity": "MEDIUM", "historical_share_pct": 8.5},
            {"month": "February", "intensity": "HIGH", "historical_share_pct": 12.4},
            {"month": "March", "intensity": "PEAK", "historical_share_pct": 28.1},  # Fiscal end
            {"month": "April", "intensity": "LOW", "historical_share_pct": 3.2},
            {"month": "May", "intensity": "LOW", "historical_share_pct": 4.5},
            {"month": "June", "intensity": "MEDIUM", "historical_share_pct": 6.8},
            {"month": "July", "intensity": "HIGH", "historical_share_pct": 9.2},
            {"month": "August", "intensity": "HIGH", "historical_share_pct": 8.9},
            {"month": "September", "intensity": "HIGH", "historical_share_pct": 9.5},
            {"month": "October", "intensity": "MEDIUM", "historical_share_pct": 7.4},
            {"month": "November", "intensity": "MEDIUM", "historical_share_pct": 6.2},
            {"month": "December", "intensity": "MEDIUM", "historical_share_pct": 7.1},
        ]
    }
