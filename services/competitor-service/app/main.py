"""Competitor service FastAPI application."""
from __future__ import annotations
from typing import Optional, List, Dict
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="TenderOS Competitor Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "competitor-service"}


@app.get("/competitors")
async def get_competitors(
    category: Optional[str] = None,
    ministry: Optional[str] = None,
    period: str = "24m",
):
    # Returns competitors and their win rates in the given category/ministry
    return {
        "category": category or "all",
        "ministry": ministry or "all",
        "period": period,
        "competitors": [
            {
                "vendor_name": "ABC Tech Solutions Private Limited",
                "tenders_won": 18,
                "tenders_bid": 32,
                "win_rate_pct": 56.25,
                "avg_bid_value_cr": 14.5,
                "avg_discount_pct": 8.4,
            },
            {
                "vendor_name": "Infra Systems and Services",
                "tenders_won": 12,
                "tenders_bid": 40,
                "win_rate_pct": 30.0,
                "avg_bid_value_cr": 8.2,
                "avg_discount_pct": 12.1,
            },
            {
                "vendor_name": "Vikas Enterprise",
                "tenders_won": 15,
                "tenders_bid": 50,
                "win_rate_pct": 30.0,
                "avg_bid_value_cr": 4.1,
                "avg_discount_pct": 15.6,
            },
            {
                "vendor_name": "National Digital Systems",
                "tenders_won": 7,
                "tenders_bid": 15,
                "win_rate_pct": 46.6,
                "avg_bid_value_cr": 22.4,
                "avg_discount_pct": 5.2,
            },
        ]
    }


@app.get("/competitors/{tender_id}")
async def get_tender_competitors(tender_id: str):
    # Returns competitor analysis for a specific tender (who is likely to bid / win based on past patterns)
    return {
        "tender_id": tender_id,
        "similar_tenders_count": 8,
        "historical_winner": "ABC Tech Solutions Private Limited",
        "historical_winner_win_rate_pct": 63,
        "avg_discount_pct": 10.5,
        "projected_bidders": [
            {"name": "ABC Tech Solutions Private Limited", "probability": 85, "reason": "Won 4/8 similar tenders Issuing from the same dept"},
            {"name": "Infra Systems and Services", "probability": 60, "reason": "Bids regularly on IT/Security tenders in Delhi"},
            {"name": "Vikas Enterprise", "probability": 40, "reason": "SME bidder with MSME EMD exemptions"},
        ],
        "disclaimer": "Based on publicly available procurement records only."
    }


@app.get("/market-share")
async def get_market_share(category: str, period: str = "12m"):
    return {
        "category": category,
        "period": period,
        "market_share": [
            {"vendor": "ABC Tech Solutions Private Limited", "share_pct": 34.2, "value_cr": 145.5},
            {"vendor": "Infra Systems and Services", "share_pct": 21.0, "value_cr": 89.2},
            {"vendor": "National Digital Systems", "share_pct": 18.5, "value_cr": 78.6},
            {"vendor": "Vikas Enterprise", "share_pct": 12.1, "value_cr": 51.4},
            {"vendor": "Others", "share_pct": 14.2, "value_cr": 60.3},
        ]
    }
