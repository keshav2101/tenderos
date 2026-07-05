from app.indexing_contract import build_embedding_text, build_tender_document


def test_build_tender_document_preserves_filterable_fields():
    tender = build_tender_document(
        {
            "id": "30000000-0000-0000-0000-000000000001",
            "title": "AI surveillance tender",
            "source": "gem",
            "source_tender_id": "GEM/2026/B/123",
            "ministry": "Ministry of Electronics and Information Technology",
            "department": "NIC",
            "organisation": "National Informatics Centre",
            "state": "Delhi",
            "estimated_cost_lakhs": 480.0,
            "emd_lakhs": 9.6,
            "categories": ["AI", "Surveillance"],
            "submission_deadline": "2026-07-27T23:59:00+00:00",
            "status": "active",
            "msme_eligible": True,
            "startup_eligible": False,
            "ai_summary": "Supply and installation of AI cameras.",
        }
    )

    assert tender["id"] == "30000000-0000-0000-0000-000000000001"
    assert tender["source"] == "gem"
    assert tender["categories"] == ["AI", "Surveillance"]
    assert tender["state"] == "Delhi"
    assert tender["estimated_cost_lakhs"] == 480.0
    assert tender["msme_eligible"] is True
    assert tender["startup_eligible"] is False


def test_build_embedding_text_includes_search_relevance_context():
    tender = build_tender_document(
        {
            "id": "30000000-0000-0000-0000-000000000001",
            "title": "AI surveillance tender",
            "source": "gem",
            "source_tender_id": "GEM/2026/B/123",
            "ministry": "Ministry of Electronics and Information Technology",
            "department": "NIC",
            "organisation": "National Informatics Centre",
            "state": "Delhi",
            "categories": ["AI", "Surveillance"],
            "ai_summary": "Supply and installation of AI cameras.",
        }
    )

    embedding_text = build_embedding_text(tender)

    assert "AI surveillance tender" in embedding_text
    assert "Supply and installation" in embedding_text
    assert "National Informatics Centre" in embedding_text
    assert "AI Surveillance" in embedding_text
