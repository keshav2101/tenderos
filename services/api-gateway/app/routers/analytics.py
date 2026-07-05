"""Analytics, Predictions, and Competitor Intelligence routes."""
from typing import Optional
from fastapi import APIRouter, Query
from app.proxy import ServiceProxy
from app.config import settings

router = APIRouter()
_market = ServiceProxy(settings.MARKET_INTEL_SERVICE_URL)
_predict = ServiceProxy(settings.PREDICTION_SERVICE_URL)
_competitor = ServiceProxy(settings.COMPETITOR_SERVICE_URL)


# ─── Market Intelligence ─────────────────────────────────────────────────────

@router.get("/trends", summary="Procurement trends over time")
async def get_trends(
    period: str = Query("12m", enum=["3m", "6m", "12m", "24m"]),
    category: Optional[str] = None,
    state: Optional[str] = None,
):
    return await _market.get("/trends", params={"period": period, "category": category, "state": state})


@router.get("/ministries", summary="Top ministries by procurement volume")
async def get_top_ministries(limit: int = Query(10, ge=1, le=50), period: str = "12m"):
    return await _market.get("/ministries", params={"limit": limit, "period": period})


@router.get("/categories", summary="Category-level procurement analytics")
async def get_category_analytics(period: str = "12m"):
    return await _market.get("/categories", params={"period": period})


@router.get("/states", summary="State-wise procurement analytics")
async def get_state_analytics(period: str = "12m"):
    return await _market.get("/states", params={"period": period})


@router.get("/seasonality", summary="Procurement seasonality by category")
async def get_seasonality(category: Optional[str] = None):
    return await _market.get("/seasonality", params={"category": category})


@router.get("/overview", summary="High-level platform analytics dashboard")
async def get_overview():
    return await _market.get("/overview")


# ─── Predictive Procurement ──────────────────────────────────────────────────

@router.get("/predictions", summary="Upcoming tender forecasts by ministry/category")
async def get_predictions(
    ministry: Optional[str] = None,
    category: Optional[str] = None,
    horizon_days: int = Query(90, ge=30, le=365),
):
    return await _predict.get(
        "/predictions",
        params={"ministry": ministry, "category": category, "horizon_days": horizon_days},
    )


@router.get("/predictions/seasonal", summary="Seasonal procurement patterns")
async def get_seasonal_patterns(ministry: Optional[str] = None):
    return await _predict.get("/predictions/seasonal", params={"ministry": ministry})


# ─── Competitor Intelligence ─────────────────────────────────────────────────

@router.get("/competitors", summary="Competitor analysis for a category")
async def get_competitors(
    category: Optional[str] = None,
    ministry: Optional[str] = None,
    period: str = "24m",
):
    return await _competitor.get(
        "/competitors",
        params={"category": category, "ministry": ministry, "period": period},
    )


@router.get("/competitors/{tender_id}", summary="Competitor analysis for a specific tender's category")
async def get_tender_competitors(tender_id: str):
    return await _competitor.get(f"/competitors/{tender_id}")


@router.get("/market-share", summary="Vendor market share by category")
async def get_market_share(category: str, period: str = "12m"):
    return await _competitor.get("/market-share", params={"category": category, "period": period})
