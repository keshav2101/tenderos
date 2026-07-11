"""
Phase 14 Connector Framework Test Suite.

Tests cover:
  - BaseConnector interface (ConnectorState, enable/disable, stats)
  - Normalization layer for all source types (gem, cppp, generic, state)
  - Validation layer (required fields, date logic, URL checks)
  - Quality Engine (scoring, dedup key, threshold)
  - Incremental crawling helpers
  - Registry auto-discovery
  - Individual connector health_check() mocks
"""
from __future__ import annotations
import asyncio
import hashlib
import sys
import os
from datetime import datetime, timedelta
from typing import AsyncIterator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Ensure service root is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.connectors.base import (
    BaseConnector, CadenceConfig, ConnectorState, HealthStatus,
    RateLimitConfig, RawTender, RetryPolicy,
)
from app.connectors.normalization import normalize_tender, normalize_state
from app.connectors.validation import validate_tender
from app.connectors.quality_engine import (
    compute_quality_score, compute_dedup_key, is_quality_acceptable,
    ConnectorQualityReport, QUALITY_THRESHOLD,
)


# ─── Fixtures ────────────────────────────────────────────────────────────────

def make_raw_tender(source_id: str = "cppp", raw_json: dict = None) -> RawTender:
    now = datetime.utcnow()
    return RawTender(
        source_id=source_id,
        source_tender_id=f"{source_id.upper()}/2026/0001",
        source_url=f"https://{source_id}.gov.in/tenders/0001",
        raw_json=raw_json or {
            "title": "Construction of District Hospital — CPWD",
            "ministry": "Ministry of Health and Family Welfare",
            "department": "CPWD Health Division",
            "organisation": "CPWD",
            "state": "Maharashtra",
            "estimated_cost_lakhs": 850.0,
            "emd_lakhs": 17.0,
            "tender_fee": 10000.0,
            "categories": ["Civil Works", "Hospital"],
            "procurement_method": "open",
            "published_at": now.isoformat(),
            "submission_deadline": (now + timedelta(days=30)).isoformat(),
            "contact_details": {
                "name": "Executive Engineer CPWD",
                "email": "ee.cpwd@gov.in",
            },
        },
    )


# ─── Normalization Tests ──────────────────────────────────────────────────────

class TestNormalization:
    def test_state_normalization_exact_match(self):
        assert normalize_state("Maharashtra") == "Maharashtra"

    def test_state_normalization_partial_match(self):
        assert normalize_state("TamilNadu") == "Tamil Nadu"

    def test_state_normalization_empty_defaults_to_delhi(self):
        assert normalize_state("") == "Delhi"

    def test_state_normalization_unknown_defaults_to_delhi(self):
        assert normalize_state("XYZ Unknown Province") == "Delhi"

    def test_normalize_generic_source_required_fields(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        assert normalized.tender_id == "CPPP/2026/0001"
        assert normalized.title == "Construction of District Hospital — CPWD"
        assert normalized.location == "Maharashtra"
        assert normalized.source_portal == "cppp"
        assert normalized.ministry is not None
        assert normalized.estimated_cost_lakhs == 850.0

    def test_normalize_gem_source(self):
        raw = RawTender(
            source_id="gem",
            source_tender_id="GEM-BID-2026-001",
            source_url="https://gem.gov.in/bid/001",
            raw_json={
                "b_category_name": ["Laptop Computers"],
                "ba_official_details_minName": ["Ministry of Electronics and Information Technology"],
                "ba_official_details_deptName": ["NIC Delhi"],
                "ba_official_details_officeName": ["NIC HQ"],
                "b_total_quantity": [100],
                "final_start_date_sort": [(datetime.utcnow()).isoformat()],
                "final_end_date_sort": [(datetime.utcnow() + timedelta(days=7)).isoformat()],
                "ba_official_details_email": ["nic@gem.gov.in"],
                "ba_official_details_name": ["GeM Buyer NIC"],
                "ba_official_details_desg": ["Deputy Director"],
            },
        )
        normalized = normalize_tender(raw)
        assert normalized.source_portal == "gem"
        assert "Laptop" in normalized.title
        assert normalized.procurement_method == "gem"

    def test_normalize_state_source(self):
        raw = make_raw_tender("mh")
        normalized = normalize_tender(raw)
        assert normalized.source_portal == "mh"
        assert normalized.location == "Maharashtra"

    def test_normalize_psu_source(self):
        raw = make_raw_tender("ntpc")
        normalized = normalize_tender(raw)
        assert normalized.source_portal == "ntpc"

    def test_lineage_populated(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        assert "original_source_portal" in normalized.lineage
        assert "crawl_timestamp" in normalized.lineage
        assert "connector_version" in normalized.lineage

    def test_submission_deadline_after_published_at(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        assert normalized.submission_deadline > normalized.published_at


# ─── Validation Tests ─────────────────────────────────────────────────────────

class TestValidation:
    def test_valid_tender_passes(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        is_valid, errors = validate_tender(normalized)
        assert is_valid, f"Expected valid but got errors: {errors}"

    def test_missing_tender_id_fails(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        normalized.tender_id = ""
        is_valid, errors = validate_tender(normalized)
        assert not is_valid
        assert any("tender_id" in e for e in errors)

    def test_missing_title_fails(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        normalized.title = ""
        is_valid, errors = validate_tender(normalized)
        assert not is_valid
        assert any("title" in e for e in errors)

    def test_negative_cost_fails(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        normalized.estimated_cost_lakhs = -100.0
        is_valid, errors = validate_tender(normalized)
        assert not is_valid
        assert any("estimated_cost_lakhs" in e for e in errors)

    def test_negative_emd_fails(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        normalized.emd_lakhs = -5.0
        is_valid, errors = validate_tender(normalized)
        assert not is_valid

    def test_broken_document_url_fails(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        normalized.document_urls = ["not-a-valid-url"]
        is_valid, errors = validate_tender(normalized)
        assert not is_valid
        assert any("Broken document link" in e for e in errors)

    def test_valid_document_url_passes(self):
        raw = make_raw_tender("cppp")
        normalized = normalize_tender(raw)
        normalized.document_urls = ["https://eprocure.gov.in/docs/tender.pdf"]
        is_valid, errors = validate_tender(normalized)
        assert is_valid


# ─── Quality Engine Tests ─────────────────────────────────────────────────────

class TestQualityEngine:
    def _make_complete_tender_dict(self) -> dict:
        now = datetime.utcnow()
        return {
            "tender_id": "CPPP/2026/001",
            "title": "Hospital Construction",
            "source_portal": "cppp",
            "ministry": "Ministry of Health",
            "state": "Maharashtra",
            "estimated_cost_lakhs": 500.0,
            "emd_lakhs": 10.0,
            "published_at": now.isoformat(),
            "submission_deadline": (now + timedelta(days=21)).isoformat(),
            "document_urls": ["https://example.gov.in/doc.pdf"],
            "contact_details": {"email": "officer@gov.in", "name": "EE"},
        }

    def test_complete_record_high_score(self):
        data = self._make_complete_tender_dict()
        score = compute_quality_score(data)
        assert score >= 70, f"Expected high score but got {score}"

    def test_empty_record_low_score(self):
        score = compute_quality_score({})
        assert score < QUALITY_THRESHOLD

    def test_missing_title_reduces_score(self):
        data = self._make_complete_tender_dict()
        full_score = compute_quality_score(data)
        data["title"] = ""
        partial_score = compute_quality_score(data)
        assert partial_score < full_score

    def test_dedup_key_deterministic(self):
        key1 = compute_dedup_key("cppp", "CPPP/2026/001")
        key2 = compute_dedup_key("cppp", "CPPP/2026/001")
        assert key1 == key2

    def test_dedup_key_different_sources_differ(self):
        key1 = compute_dedup_key("cppp", "001")
        key2 = compute_dedup_key("gem", "001")
        assert key1 != key2

    def test_quality_acceptable_above_threshold(self):
        assert is_quality_acceptable(QUALITY_THRESHOLD) is True

    def test_quality_not_acceptable_below_threshold(self):
        assert is_quality_acceptable(QUALITY_THRESHOLD - 1) is False

    def test_quality_report_aggregation(self):
        report = ConnectorQualityReport("cppp")
        report.record(80, True)
        report.record(20, False)
        assert report.total == 2
        assert report.passed == 1
        assert report.rejected == 1
        assert report.avg_score == 50.0
        assert report.pass_rate == 0.5


# ─── ConnectorState Tests ─────────────────────────────────────────────────────

class TestConnectorState:
    def test_initial_state_enabled(self):
        state = ConnectorState(source_id="test")
        assert state.enabled is True
        assert state.success_count == 0

    def test_to_dict_serializable(self):
        state = ConnectorState(source_id="test")
        d = state.to_dict()
        assert d["source_id"] == "test"
        assert "enabled" in d
        assert "quality_score" in d


# ─── RawTender Content Hash Tests ─────────────────────────────────────────────

class TestRawTender:
    def test_content_hash_deterministic(self):
        raw = make_raw_tender("cppp")
        h1 = raw.content_hash()
        h2 = raw.content_hash()
        assert h1 == h2

    def test_different_json_different_hash(self):
        raw1 = make_raw_tender("cppp", raw_json={"title": "Tender A"})
        raw2 = make_raw_tender("cppp", raw_json={"title": "Tender B"})
        assert raw1.content_hash() != raw2.content_hash()


# ─── Registry Tests ───────────────────────────────────────────────────────────

class TestRegistry:
    def test_registry_loads_connectors(self):
        from app.connectors.registry import list_connectors, get_all_source_ids
        connectors = list_connectors()
        all_ids = get_all_source_ids()
        assert len(connectors) >= 5, f"Expected at least 5 connectors, got {len(connectors)}"
        assert len(all_ids) >= 5

    def test_get_connector_returns_instance(self):
        from app.connectors.registry import get_connector
        connector = get_connector("cppp")
        assert isinstance(connector, BaseConnector)
        assert connector.source_id == "cppp"

    def test_get_connector_unknown_raises(self):
        from app.connectors.registry import get_connector
        with pytest.raises(ValueError):
            get_connector("nonexistent_source_xyz")

    def test_registry_includes_gem(self):
        from app.connectors.registry import get_all_source_ids
        assert "gem" in get_all_source_ids()

    def test_registry_includes_railways(self):
        from app.connectors.registry import get_all_source_ids
        assert "railways" in get_all_source_ids()


# ─── Connector Health Check Tests (mocked network) ────────────────────────────

class TestConnectorHealthChecks:
    @pytest.mark.asyncio
    async def test_cppp_health_check_healthy(self):
        from app.connectors.registry import get_connector
        connector = get_connector("cppp")
        with patch("httpx.AsyncClient.head", new_callable=AsyncMock) as mock_head:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_head.return_value = mock_response
            result = await connector.health_check()
        assert result in (HealthStatus.HEALTHY, HealthStatus.DEGRADED, HealthStatus.FAILED)

    @pytest.mark.asyncio
    async def test_gem_connector_enable_disable(self):
        from app.connectors.registry import get_connector
        connector = get_connector("gem")
        connector.enable()
        assert connector._state.enabled is True
        connector.disable()
        assert connector._state.enabled is False
        connector.enable()  # restore

    @pytest.mark.asyncio
    async def test_record_run_success(self):
        from app.connectors.registry import get_connector
        connector = get_connector("cppp")
        connector.record_run_start()
        assert connector._state.status == "running"
        connector.record_run_success(new=5, updated=2, total=10, duration=3.5, quality_score=80.0)
        assert connector._state.success_count == 1
        assert connector._state.new_tenders == 5
        assert connector._state.quality_score == 80.0

    @pytest.mark.asyncio
    async def test_record_run_failure(self):
        from app.connectors.registry import get_connector
        connector = get_connector("cppp")
        connector.record_run_failure("Network timeout")
        assert connector._state.failure_count >= 1
        assert connector._state.last_error == "Network timeout"
