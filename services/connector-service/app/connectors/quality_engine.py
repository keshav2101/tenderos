"""
Data Quality Engine — Phase 14.

Provides:
  - Per-tender quality scoring (0-100)
  - Batch duplicate detection
  - Connector-level quality aggregation
  - DLQ routing for low-quality records
"""
from __future__ import annotations
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
import structlog

logger = structlog.get_logger()


def compute_quality_score(tender_data: Dict[str, Any]) -> int:
    """
    Compute a 0-100 quality score for a tender record.

    Scoring criteria:
      - Required fields present (40 pts)
      - Numeric fields valid and non-zero (20 pts)
      - Dates valid and logical (20 pts)
      - Document URLs present (10 pts)
      - Contact details populated (10 pts)
    """
    score = 0

    # Required fields (40 pts — 8 pts each)
    required_fields = ["tender_id", "title", "source_portal", "ministry", "state"]
    for field in required_fields:
        val = tender_data.get(field)
        if val and str(val).strip():
            score += 8

    # Numeric fields (20 pts — 5 pts each)
    numeric_fields = ["estimated_cost_lakhs", "emd_lakhs"]
    for field in numeric_fields:
        val = tender_data.get(field)
        try:
            if val is not None and float(val) > 0:
                score += 10
        except (TypeError, ValueError):
            pass

    # Date validity (20 pts)
    published = tender_data.get("published_at")
    deadline = tender_data.get("submission_deadline")
    if published and deadline:
        try:
            if isinstance(published, str):
                published = datetime.fromisoformat(published)
            if isinstance(deadline, str):
                deadline = datetime.fromisoformat(deadline)
            if deadline > published:
                score += 20
            else:
                score += 5  # Dates present but invalid order
        except Exception:
            score += 5  # Dates present but unparseable

    # Document URLs (10 pts)
    doc_urls = tender_data.get("document_urls", [])
    if doc_urls and len(doc_urls) > 0:
        score += 10

    # Contact details (10 pts)
    contact = tender_data.get("contact_details", {})
    if contact and (contact.get("email") or contact.get("name")):
        score += 10

    return min(score, 100)


def compute_dedup_key(source_id: str, source_tender_id: str) -> str:
    """Generate a canonical dedup key for a tender."""
    key = f"{source_id}::{source_tender_id}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


class ConnectorQualityReport:
    """Aggregated quality metrics for a single connector run."""

    def __init__(self, source_id: str):
        self.source_id = source_id
        self.total = 0
        self.passed = 0
        self.rejected = 0
        self.score_sum = 0
        self.scores: List[int] = []

    def record(self, score: int, passed: bool):
        self.total += 1
        self.score_sum += score
        self.scores.append(score)
        if passed:
            self.passed += 1
        else:
            self.rejected += 1

    @property
    def avg_score(self) -> float:
        return round(self.score_sum / self.total, 2) if self.total > 0 else 0.0

    @property
    def pass_rate(self) -> float:
        return round(self.passed / self.total, 4) if self.total > 0 else 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_id": self.source_id,
            "total": self.total,
            "passed": self.passed,
            "rejected": self.rejected,
            "avg_quality_score": self.avg_score,
            "pass_rate_pct": round(self.pass_rate * 100, 1),
        }


QUALITY_THRESHOLD = 30  # Minimum score to accept a tender


def is_quality_acceptable(score: int) -> bool:
    return score >= QUALITY_THRESHOLD
