"""Pure helpers for the tender search indexing contract."""
from __future__ import annotations

from typing import Any, Dict


def build_tender_document(tender: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize an incoming tender payload for search backends."""
    return {
        "id": str(tender["id"]),
        "title": tender.get("title") or "",
        "source": tender.get("source") or "",
        "source_tender_id": tender.get("source_tender_id") or "",
        "ministry": tender.get("ministry"),
        "department": tender.get("department"),
        "organisation": tender.get("organisation"),
        "state": tender.get("state"),
        "estimated_cost_lakhs": tender.get("estimated_cost_lakhs"),
        "emd_lakhs": tender.get("emd_lakhs"),
        "categories": tender.get("categories") or [],
        "submission_deadline": tender.get("submission_deadline"),
        "status": tender.get("status") or "active",
        "msme_eligible": bool(tender.get("msme_eligible", False)),
        "startup_eligible": bool(tender.get("startup_eligible", False)),
        "ai_summary": tender.get("ai_summary") or "",
    }


def build_embedding_text(tender: Dict[str, Any]) -> str:
    """Build the text representation embedded for semantic tender search."""
    parts = [
        tender.get("title") or "",
        tender.get("ai_summary") or "",
        tender.get("ministry") or "",
        tender.get("department") or "",
        tender.get("organisation") or "",
        tender.get("state") or "",
        " ".join(tender.get("categories") or []),
    ]
    return "\n".join(part for part in parts if part).strip()
