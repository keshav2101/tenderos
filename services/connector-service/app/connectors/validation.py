"""
Data Quality Validation Layer — performs checks on normalized tenders.
Logs violations to DLQ file.
"""
from __future__ import annotations
import os
from typing import List, Tuple
from app.connectors.normalization import NormalizedTender
import structlog

logger = structlog.get_logger()

# Configure validation DLQ file path in the workspace
LOG_DIR = "/Users/keshavgupta/antigravity/Tender AI/logs"
DLQ_FILE_PATH = os.path.join(LOG_DIR, "rejected_tenders.log")

class ValidationError(Exception):
    def __init__(self, errors: List[str]):
        self.errors = errors
        super().__init__(f"Validation errors: {', '.join(errors)}")

def validate_tender(tender: NormalizedTender) -> Tuple[bool, List[str]]:
    """
    Executes business rule validations on a normalized tender.
    Returns (is_valid, list_of_errors).
    """
    errors = []

    # 1. Missing Required Fields
    if not tender.tender_id or len(tender.tender_id.strip()) == 0:
        errors.append("Missing required field: tender_id")
    if not tender.title or len(tender.title.strip()) == 0:
        errors.append("Missing required field: title")
    if not tender.source_portal or len(tender.source_portal.strip()) == 0:
        errors.append("Missing required field: source_portal")

    # 2. Invalid Dates
    if tender.submission_deadline and tender.published_at:
        if tender.submission_deadline <= tender.published_at:
            errors.append(f"Invalid dates: Submission deadline ({tender.submission_deadline}) is before/equals publication date ({tender.published_at})")
            
    # 3. Invalid/Negative Cost values
    if tender.estimated_cost_lakhs is not None and tender.estimated_cost_lakhs < 0:
        errors.append(f"Invalid currency/cost: estimated_cost_lakhs ({tender.estimated_cost_lakhs}) cannot be negative")
    if tender.emd_lakhs is not None and tender.emd_lakhs < 0:
        errors.append(f"Invalid currency/cost: emd_lakhs ({tender.emd_lakhs}) cannot be negative")
    if tender.tender_fee is not None and tender.tender_fee < 0:
        errors.append(f"Invalid currency/cost: tender_fee ({tender.tender_fee}) cannot be negative")

    # 4. Corrupt/Broken Document URLs Check
    if tender.document_urls:
        for url in tender.document_urls:
            if not (url.startswith("http://") or url.startswith("https://")):
                errors.append(f"Broken document link: '{url}' is not a valid HTTP/HTTPS URL")

    # Log to DLQ if errors found
    if errors:
        log_rejected_tender(tender, errors)
        return False, errors

    return True, []

def log_rejected_tender(tender: NormalizedTender, errors: List[str]):
    """Write rejected tender details to DLQ log file."""
    try:
        os.makedirs(LOG_DIR, exist_ok=True)
        import json
        log_entry = {
            "timestamp": tender.lineage.get("crawl_timestamp") or "",
            "tender_id": tender.tender_id,
            "source_portal": tender.source_portal,
            "title": tender.title,
            "validation_errors": errors,
            "raw_payload_hash": tender.lineage.get("original_payload_hash") or ""
        }
        with open(DLQ_FILE_PATH, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
        logger.warning("Tender rejected and logged to DLQ", tender_id=tender.tender_id, errors=errors)
    except Exception as e:
        logger.error("Failed to write rejected tender to DLQ log file", error=str(e))
