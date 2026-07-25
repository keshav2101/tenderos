# Data Normalization Guide

## Overview

All tenders from 80+ sources are normalized into the unified `NormalizedTender` schema before database insertion.

---

## NormalizedTender Schema

```python
class NormalizedTender(BaseModel):
    tender_id: str                    # Source-specific tender ID
    title: str                        # Cleaned tender title
    ministry: str                     # Indian ministry (title-cased)
    department: str                   # Executing department
    organisation: str                 # Procuring organisation
    buyer: str                        # Buyer name
    location: str                     # Normalized Indian state name
    district: Optional[str]           # District (if available)
    procurement_type: Optional[str]   # works / goods / services
    bid_type: Optional[str]           # open / limited / forward_auction
    currency: str                     # Always "INR"
    tender_status: str                # active / expired / cancelled
    estimated_cost_lakhs: float       # Value in Indian Lakhs
    emd_lakhs: float                  # Earnest Money Deposit in Lakhs
    tender_fee: float                 # Tender document fee (₹)
    categories: list[str]             # Work/goods category tags
    procurement_method: str           # open/gem/limited/two-stage
    published_at: datetime
    submission_deadline: datetime
    opening_date: Optional[datetime]
    source_portal: str                # Source ID (gem, cppp, mh, ntpc...)
    document_urls: list[str]          # PDF/NIT links
    contact_details: dict             # name, email, phone, designation
    lineage: dict                     # Full audit trail
    corrigenda: list[dict]            # Amendment history
    raw_metadata: dict                # Original parsed payload
```

---

## Source Routing

The normalizer routes based on `source_id`:

```
source_id in {"gem"}              → GeM parser
source_id in {"cppp", "eprocure"} → CPPP/RSS parser
source_id in {"railways", "ireps"}→ Railways parser
source_id == everything else      → Generic parser
```

---

## State Normalization

All state names are normalized against the canonical 36 Indian states/UTs list:
- Partial matching: `"TamilNadu"` → `"Tamil Nadu"`
- Unknown fallback: `"XYZ Province"` → `"Delhi"`

---

## Data Lineage

Every tender includes a `lineage` dict:

```json
{
  "original_source_portal": "cppp",
  "original_url": "https://eprocure.gov.in/...",
  "original_payload_hash": "sha256:...",
  "crawl_timestamp": "2026-07-11T17:00:00",
  "connector_version": "14.0.0",
  "normalization_version": "2.0.0",
  "ocr_version": "1.0.0"
}
```

This enables full audit traceability from the database record back to the original source fetch.
