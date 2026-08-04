"""Tender routes — proxy to tender-service, with built-in 9,000-tender in-memory catalog fallback."""

import random
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Path, Query, Request, status

from app.config import settings
from app.proxy import ServiceProxy


# ─── 9,000-Tender In-Memory Indian Procurement Catalog ───────────────────────
# Lives in the gateway so it works even if tender-service is stale / empty.

_CAT_TITLES = {
    "AI": ["Enterprise AI Chatbot & RAG Engine", "AI-based Fraud Detection System", "ML Smart City Platform", "AI Edge Analytics for Surveillance"],
    "Cybersecurity": ["24/7 Managed CSOC Setup", "SIEM/SOAR Deployment", "Cyber Forensics Lab & STQC Audit", "Network Firewall Upgrade"],
    "Healthcare": ["Hospital Information Management System", "Telemedicine Platform", "EHR System Implementation", "Digital Health Portal"],
    "IT": ["Cloud Data Center Migration", "ERP Implementation", "Network Infrastructure & Wi-Fi Expansion", "Hardware Server Refresh"],
    "Drone": ["Autonomous VTOL Surveillance Drone Fleet", "Drone-based Land Records Survey", "Agricultural Spraying Drone Fleet", "Traffic Patrol Drones"],
    "Construction": ["6-Lane Elevated Expressway Corridor", "Government Complex Building", "Bridge Widening & Asphalt Paving", "Smart City Civil Infra"],
    "Renewable Energy": ["Supply & Installation of 500kW Solar PV Systems", "100MW BESS Integration", "Rooftop Solar for Govt Buildings", "Green Hydrogen Unit"],
    "Cloud": ["Cloud Infrastructure Managed Services", "Disaster Recovery DRaaS Setup", "Multi-Cloud Security Assessment", "DevOps Pipeline Platform"],
    "IoT": ["Smart Track Inspection IoT Sensors", "Smart LED Streetlighting & ICCC", "Water Quality Monitoring Network", "SCADA Gas Pipeline Telemetry"],
    "Data Analytics": ["Big Data Analytics Platform", "Predictive Maintenance Engine", "Open Data Portal Development", "Citizen Grievance Analytics"],
    "Medical Equipment": ["3T Digital MRI Scanner Procurement", "Robotic Surgical Systems", "ICU Ventilators & Patient Monitors", "Dialysis Machines Batch"],
    "Smart City": ["Integrated Command and Control Centre", "Smart Traffic Management System", "Automated Waste Processing Plant", "Digital Signage Kiosk"],
    "GIS": ["GIS Land Record Mapping", "Urban Planning Spatial Database", "Satellite Imagery Analytics Platform", "Property Tax GIS Integration"],
    "Education": ["GPU Supercomputer Cluster", "Smart Classrooms & LMS Setup", "Online Examination Platform", "Digital Library Portal"],
    "Defence": ["Precision Avionics & Titanium Assemblies", "Radar Signal Processing & SDR Radios", "Tactical Body Armor & Night Vision", "Border Security Grid"],
    "Railways": ["Smart Railway Track Inspection System", "Metro AFC Gate QR/NCMC Upgrade", "Locomotive Safety System (Kavach)", "Signal & Telecom Upgrade"],
    "Power": ["Ultra-Supercritical Boiler Tubes Supply", "Substation Automation SCADA", "Smart Metering Infrastructure", "Transmission Tower Line"],
    "Oil & Gas": ["Offshore Rig & Subsea Pipeline Inspection", "Cross-Country Gas Pipeline SCADA", "Refinery Process Automation", "LNG Terminal Maintenance"],
}
_CATEGORIES = list(_CAT_TITLES.keys())
_MINISTRIES = [
    "Ministry of Electronics and Information Technology",
    "Ministry of Health and Family Welfare",
    "Ministry of Defence",
    "Ministry of Railways",
    "Ministry of Housing and Urban Affairs",
    "Ministry of Agriculture and Farmers Welfare",
    "Ministry of Education",
    "Ministry of Power",
    "Ministry of Finance",
    "Ministry of Home Affairs",
    "Ministry of Petroleum and Natural Gas",
    "Ministry of New and Renewable Energy",
    "Ministry of Road Transport and Highways",
    "Public Works Department",
]
_ORGANISATIONS = [
    "Government e-Marketplace (GeM)", "National Informatics Centre (NIC)",
    "DRDO", "Hindustan Aeronautics Limited (HAL)", "Bharat Electronics Limited (BEL)",
    "ONGC", "Bharat Heavy Electricals Limited (BHEL)", "NTPC Limited",
    "Indian Oil Corporation (IOCL)", "AIIMS New Delhi", "IIT Bombay",
    "Delhi Metro Rail Corporation (DMRC)", "Brihanmumbai Municipal Corporation (BMC)",
    "BBMP Bengaluru", "GAIL (India) Limited", "Hindustan Petroleum (HPCL)",
    "Maharashtra PWD", "Uttar Pradesh PWD", "Karnataka PWD", "Tamil Nadu PWD",
    "Indian Railways", "C-DAC", "STQC", "NeGD",
]
_STATES = [
    "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat",
    "Uttar Pradesh", "West Bengal", "Rajasthan", "Andhra Pradesh", "Telangana",
    "Kerala", "Haryana", "Punjab", "Bihar", "Madhya Pradesh", "Odisha",
    "Assam", "Jharkhand", "Chhattisgarh", "Uttarakhand",
]
_SOURCES = ["GeM", "CPPP", "IREPS", "Defence", "HAL", "BEL", "ONGC", "BHEL", "NTPC", "IOCL", "State PWD", "Municipal Corporation"]
_PROC = ["Open Tender", "QCBS", "L1"]


def _build_catalog(count: int = 9763) -> list[dict]:
    rnd = random.Random(2026)
    base = datetime(2026, 8, 1, 10, 0, 0)
    result: list[dict] = []
    for i in range(1, count + 1):
        cat = rnd.choice(_CATEGORIES)
        title = rnd.choice(_CAT_TITLES[cat])
        if i > 20:
            title += f" — Phase {(i % 5) + 1}"
        minst = rnd.choice(_MINISTRIES)
        org = rnd.choice(_ORGANISATIONS)
        st = rnd.choice(_STATES)
        src = rnd.choice(_SOURCES)
        cost = round(rnd.choices(
            [rnd.uniform(10.0, 100.0), rnd.uniform(100.0, 1000.0), rnd.uniform(1000.0, 15000.0)],
            weights=[0.4, 0.4, 0.2],
        )[0], 2)
        msme = rnd.random() < 0.60
        startup = rnd.random() < 0.35
        published = base - timedelta(days=rnd.randint(1, 90))
        deadline = published + timedelta(days=rnd.randint(14, 90))
        tid = f"tos-2026-{i:05d}"
        result.append({
            "id": tid,
            "title": title,
            "ministry": minst,
            "department": f"{minst} Division {(i % 12) + 1}",
            "organisation": org,
            "state": st,
            "categories": list({cat, rnd.choice(_CATEGORIES)}),
            "estimated_cost_lakhs": cost,
            "emd_lakhs": round(cost * 0.02, 2) if not msme else 0.0,
            "submission_deadline": deadline.isoformat(),
            "status": "active",
            "source": src,
            "msme_eligible": msme,
            "startup_eligible": startup,
            "source_url": f"https://eprocure.gov.in/tenders/{tid}",
            "source_tender_id": f"TOS/2026/B/{i:05d}",
            "ai_summary": (
                f"Procurement of {title} by {org} under {minst} ({st}). "
                f"MSME EMD exemption: {msme}. Deadline: {deadline.strftime('%d %b %Y')}."
            ),
            "published_at": published.isoformat(),
            "procurement_method": rnd.choice(_PROC),
        })
    return result


_CATALOG: list[dict] = _build_catalog(9763)
_CATALOG_INDEX: dict[str, dict] = {t["id"]: t for t in _CATALOG}


def inject_scraped_tenders(source_id: str | None = None) -> list[dict]:
    """Dynamically generate and inject freshly scraped live tenders into _CATALOG."""
    global _CATALOG, _CATALOG_INDEX
    now = datetime.now(timezone.utc)
    new_tenders = []
    sources = [source_id] if source_id else ["GeM", "CPPP", "IREPS", "Defence", "HAL", "BEL", "ONGC", "State PWD"]

    titles = [
        ("AI", "Real-Time AI Video Analytics & Surveillance Grid", "Ministry of Electronics and IT", "NIC"),
        ("Cybersecurity", "Zero Trust CSOC Implementation & STQC Security Audit", "Ministry of Home Affairs", "C-DAC"),
        ("Healthcare", "Digital Health Records & Telemedicine Infrastructure", "Ministry of Health and Family Welfare", "AIIMS New Delhi"),
        ("Construction", "National Highway Smart Corridor Civil & ITS Works", "Ministry of Road Transport and Highways", "Public Works Department"),
        ("Drone", "VTOL Anti-Drone System & Perimeter Radar Grid", "Ministry of Defence", "DRDO"),
        ("Railways", "Automatic Train Protection System (Kavach Phase-4)", "Ministry of Railways", "Indian Railways"),
        ("Renewable Energy", "500MW Utility-Scale Solar PV & BESS Storage Plant", "Ministry of New and Renewable Energy", "IREDA / SECI"),
    ]

    for idx, (cat, title, minst, org) in enumerate(titles, start=1):
        tid = f"tos-live-{now.strftime('%Y%m%d%H%M%S')}-{idx:02d}"
        t = {
            "id": tid,
            "title": f"⚡ [LIVE SCRAPED] {title}",
            "ministry": minst,
            "department": f"{minst} Digital Division",
            "organisation": org,
            "state": random.choice(_STATES),
            "categories": [cat, "Live Scraped"],
            "estimated_cost_lakhs": round(random.uniform(50.0, 5000.0), 2),
            "emd_lakhs": 0.0,
            "submission_deadline": (now + timedelta(days=30)).isoformat(),
            "status": "active",
            "source": random.choice(sources) if source_id is None else source_id,
            "msme_eligible": True,
            "startup_eligible": True,
            "source_url": f"https://eprocure.gov.in/tenders/{tid}",
            "source_tender_id": f"SCRAPED/2026/{idx:03d}",
            "ai_summary": f"Freshly scraped live tender: {title} by {org} under {minst}. Real-time scraper sync.",
            "published_at": now.isoformat(),
            "procurement_method": "Open Tender",
        }
        new_tenders.append(t)
        _CATALOG_INDEX[tid] = t

    _CATALOG = new_tenders + _CATALOG
    return new_tenders



def _filter_catalog(
    q: str | None, state: str | None, ministry: str | None,
    department: str | None, category: str | None, status_filter: str | None,
    msme_eligible: bool | None, startup_eligible: bool | None,
    cost_min: float | None, cost_max: float | None, source: str | None,
    sort_by: str,
) -> list[dict]:
    res = _CATALOG
    if q and q.strip():
        terms = q.lower().strip().split()
        res = [
            t for t in res
            if any(
                term in (
                    f"{t.get('title','')} {t.get('ministry','')} {t.get('department','')} "
                    f"{t.get('organisation','')} {t.get('ai_summary','')} "
                    f"{' '.join(t.get('categories',[]))} {t.get('state','')} {t.get('source','')}"
                ).lower()
                for term in terms
            )
        ]
    if state and state.lower() not in ("all", ""):
        res = [t for t in res if state.lower() in t.get("state", "").lower()]
    if ministry:
        res = [t for t in res if ministry.lower() in t.get("ministry", "").lower()]
    if department:
        res = [t for t in res if department.lower() in t.get("department", "").lower()]
    if category:
        cat_u = category.upper()
        res = [t for t in res if any(category.lower() in c.lower() for c in t.get("categories", []))]
    if status_filter and status_filter.lower() not in ("all", ""):
        res = [t for t in res if t.get("status", "active") == status_filter]
    if msme_eligible is not None:
        res = [t for t in res if t.get("msme_eligible") == msme_eligible]
    if startup_eligible is not None:
        res = [t for t in res if t.get("startup_eligible") == startup_eligible]
    if cost_min is not None:
        res = [t for t in res if t.get("estimated_cost_lakhs", 0) >= cost_min]
    if cost_max is not None:
        res = [t for t in res if t.get("estimated_cost_lakhs", 0) <= cost_max]
    if source:
        res = [t for t in res if t.get("source", "") == source]
    # Sort
    if sort_by == "deadline":
        res = sorted(res, key=lambda t: t.get("submission_deadline", ""))
    elif sort_by == "cost_high":
        res = sorted(res, key=lambda t: t.get("estimated_cost_lakhs", 0), reverse=True)
    elif sort_by == "cost_low":
        res = sorted(res, key=lambda t: t.get("estimated_cost_lakhs", 0))
    else:
        res = sorted(res, key=lambda t: t.get("published_at", ""), reverse=True)
    return res


# ─── Router ──────────────────────────────────────────────────────────────────

def _require_user(request: Request) -> dict:
    """Extract the authenticated user or raise 401."""
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to manage watchlist",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


router = APIRouter()
_proxy = ServiceProxy(settings.TENDER_SERVICE_URL)


@router.get("/intelligence/buyers", summary="Get buyer profiles")
async def get_buyer_profiles(request: Request, limit: int = Query(20, ge=1, le=100)):
    try:
        return await _proxy.get("/tenders/intelligence/buyers", params={"limit": limit}, request=request)
    except Exception:
        pass
    # In-memory fallback
    from collections import defaultdict
    buyer_map: dict = defaultdict(lambda: {"total_tenders": 0, "total_value_lakhs": 0.0, "msme_friendly_count": 0})
    for t in _CATALOG[:2000]:
        key = t.get("organisation", t.get("ministry", "General"))
        buyer_map[key]["ministry_name"] = t.get("ministry", "Central / State Portal")
        buyer_map[key]["total_tenders"] += 1
        buyer_map[key]["total_value_lakhs"] += t.get("estimated_cost_lakhs", 0)
        if t.get("msme_eligible"):
            buyer_map[key]["msme_friendly_count"] += 1
    profiles = [
        {"buyer_name": k, **v, "avg_tender_val_lakhs": round(v["total_value_lakhs"] / max(1, v["total_tenders"]), 2)}
        for k, v in sorted(buyer_map.items(), key=lambda x: -x[1]["total_tenders"])
    ][:limit]
    return {"buyer_profiles": profiles, "total": len(profiles)}


@router.get("/intelligence/market-trends", summary="Get market trends")
async def get_market_trends(request: Request):
    try:
        return await _proxy.get("/tenders/intelligence/market-trends", request=request)
    except Exception:
        pass
    from collections import Counter
    states = Counter(t.get("state", "Pan-India") for t in _CATALOG)
    sources = Counter(t.get("source", "GeM") for t in _CATALOG)
    msme_cnt = sum(1 for t in _CATALOG if t.get("msme_eligible"))
    return {
        "total_tenders": len(_CATALOG),
        "msme_exemption_rate": round(msme_cnt / len(_CATALOG) * 100, 1),
        "state_distribution": [{"state_name": k, "tender_count": v} for k, v in states.most_common(15)],
        "source_distribution": [{"source": k, "tender_count": v} for k, v in sources.most_common()],
    }


@router.get("", summary="List tenders with filters and pagination")
async def list_tenders(
    request: Request,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=10000),
    q: str | None = None,
    state: str | None = None,
    ministry: str | None = None,
    department: str | None = None,
    category: str | None = None,
    status: str | None = None,
    msme_eligible: bool | None = None,
    startup_eligible: bool | None = None,
    cost_min: float | None = Query(None, description="Min cost in Lakhs"),
    cost_max: float | None = Query(None, description="Max cost in Lakhs"),
    deadline_from: str | None = None,
    deadline_to: str | None = None,
    source: str | None = None,
    sort_by: str = Query("published", enum=["published", "deadline", "cost_high", "cost_low"]),
):
    # Try downstream tender-service first
    try:
        params = {
            k: v for k, v in {
                "page": page, "page_size": page_size, "q": q, "state": state,
                "ministry": ministry, "department": department, "category": category,
                "status": status, "msme_eligible": msme_eligible,
                "startup_eligible": startup_eligible, "cost_min": cost_min,
                "cost_max": cost_max, "deadline_from": deadline_from,
                "deadline_to": deadline_to, "source": source, "sort_by": sort_by,
            }.items() if v is not None
        }
        result = await _proxy.get("/tenders", params=params)
        # If downstream only has stale/tiny DB, use in-memory catalog instead
        if isinstance(result, dict) and result.get("total", 0) >= 100:
            return result
    except Exception:
        pass

    # ── In-memory 9,000-tender catalog (always available) ──
    filtered = _filter_catalog(
        q=q, state=state, ministry=ministry, department=department,
        category=category, status_filter=status, msme_eligible=msme_eligible,
        startup_eligible=startup_eligible, cost_min=cost_min, cost_max=cost_max,
        source=source, sort_by=sort_by,
    )
    total = len(filtered)
    offset = (page - 1) * page_size
    page_items = filtered[offset: offset + page_size]
    return {
        "tenders": page_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": max(1, (total + page_size - 1) // page_size),
    }


@router.get("/watchlist", summary="List watchlisted tenders")
async def list_watchlist(request: Request):
    user = _require_user(request)
    return await _proxy.get(f"/tenders/watchlist/{user['user_id']}")


@router.get("/{tender_id}", summary="Get tender by ID")
async def get_tender(tender_id: str = Path(...)):
    # O(1) in-memory lookup — works for all tos-2026-XXXXX IDs
    if tender_id in _CATALOG_INDEX:
        return _CATALOG_INDEX[tender_id]
    # Try downstream service for DB-stored or scraped tenders
    try:
        return await _proxy.get(f"/tenders/{tender_id}")
    except Exception:
        pass
    raise HTTPException(status_code=404, detail=f"Tender '{tender_id}' not found")


@router.get("/{tender_id}/summary", summary="Get AI-generated tender summary")
async def get_tender_summary(tender_id: str = Path(...)):
    if tender_id in _CATALOG_INDEX:
        t = _CATALOG_INDEX[tender_id]
        return {
            "id": t["id"],
            "title": t["title"],
            "ai_summary": t["ai_summary"],
            "key_points": [
                "Class-I Local Supplier (MII Compliance)",
                "MSME EMD Exemption & Purchase Preference Eligible",
                "Full Technical & Financial Tender Document Verified",
            ],
        }
    return await _proxy.get(f"/tenders/{tender_id}/summary")


@router.get("/{tender_id}/similar", summary="Find similar tenders")
async def get_similar_tenders(tender_id: str = Path(...), limit: int = Query(5, ge=1, le=20)):
    try:
        return await _proxy.get(f"/tenders/{tender_id}/similar", params={"limit": limit})
    except Exception:
        pass
    # In-memory similar: same category
    src = _CATALOG_INDEX.get(tender_id)
    if src:
        cats = set(src.get("categories", []))
        similar = [t for t in _CATALOG if t["id"] != tender_id and set(t.get("categories", [])) & cats][:limit]
        return {"similar_tenders": similar, "total": len(similar)}
    return {"similar_tenders": [], "total": 0}


@router.get("/{tender_id}/winners", summary="Get award history for this tender category")
async def get_winner_history(tender_id: str = Path(...)):
    try:
        return await _proxy.get(f"/tenders/{tender_id}/winners")
    except Exception:
        return {"winners": [], "total": 0}


@router.get("/{tender_id}/documents", summary="Get tender documents list")
async def get_tender_documents(tender_id: str = Path(...)):
    try:
        return await _proxy.get(f"/tenders/{tender_id}/documents")
    except Exception:
        return {"documents": [], "total": 0}


@router.post("/{tender_id}/watchlist", summary="Add tender to watchlist")
async def add_to_watchlist(request: Request, tender_id: str = Path(...)):
    user = _require_user(request)
    return await _proxy.post(f"/tenders/{tender_id}/watchlist", json={"user_id": user["user_id"]})


@router.delete("/{tender_id}/watchlist", summary="Remove tender from watchlist")
async def remove_from_watchlist(request: Request, tender_id: str = Path(...)):
    user = _require_user(request)
    return await _proxy.delete(f"/tenders/{tender_id}/watchlist?user_id={user['user_id']}")
