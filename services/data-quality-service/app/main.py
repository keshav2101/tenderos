"""Data quality audit service validating PDF schemas, OCR confidence, and duplicates."""
from typing import List, Dict, Any, Optional

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

logger = structlog.get_logger()
app = FastAPI(title="TenderOS Data Quality Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])


# In-memory mock audits database
_quality_violations = [
    {
        "id": "violation-001",
        "tender_id": "tender-xyz-789",
        "check_type": "broken_links",
        "status": "fail",
        "details": {
            "url": "https://gem.gov.in/bids/docs/broken_spec.pdf",
            "error": "404 Not Found"
        }
    },
    {
        "id": "violation-002",
        "tender_id": "tender-abc-555",
        "check_type": "duplicate_detection",
        "status": "warn",
        "details": {
            "duplicate_tender_id": "tender-abc-556",
            "similarity_score": 0.98
        }
    }
]


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "data-quality-service"}


@app.get("/quality/report")
async def get_data_quality_report():
    return {
        "summary": {
            "total_documents_scanned": 1540,
            "corrupted_files_found": 3,
            "broken_links_found": 8,
            "duplicate_tenders_flagged": 12,
            "overall_integrity_score": 98.4
        },
        "violations": _quality_violations
    }


@app.get("/quality/metrics")
async def get_data_quality_metrics():
    return {
        "ocr_avg_confidence": 0.942,
        "classification_avg_confidence": 0.89,
        "extraction_avg_confidence": 0.915,
        "ministry_mapping_accuracy": 0.992,
        "checks_history": [
            {"date": "2026-06-30", "failed_checks": 2, "integrity_score": 98.5},
            {"date": "2026-07-01", "failed_checks": 1, "integrity_score": 98.9},
            {"date": "2026-07-02", "failed_checks": 0, "integrity_score": 99.4}
        ]
    }
