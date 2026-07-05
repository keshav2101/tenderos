"""
Tier 1 Extraction — Rule-based, regex + spaCy NER.
Handles ~70% of all fields at near-zero compute cost.
"""
from __future__ import annotations
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import structlog
from dateutil import parser as dateparser

logger = structlog.get_logger()

# ─── Regex patterns ───────────────────────────────────────────────────────────

# Indian currency patterns (various formats)
AMOUNT_PATTERNS = [
    r'(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:Crore|Cr\.?)',     # Rs. 5.2 Crore
    r'(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:Lakh|Lakhs?|L\.?)',# Rs. 52 Lakhs
    r'(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]+)?)',                        # Rs. 52,00,000
    r'([0-9,]+(?:\.[0-9]+)?)\s*(?:Crore|Cr\.)',
    r'([0-9,]+(?:\.[0-9]+)?)\s*(?:Lakh|Lakhs?|L\.)',
]

EMD_PATTERNS = [
    r'(?:EMD|Earnest Money(?:\s+Deposit)?)[:\s]+(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:Lakh|Lakhs?|Crore|Cr\.?)?',
    r'(?:Bid Security)[:\s]+(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]+)?)',
]

TENDER_ID_PATTERNS = [
    r'\b([A-Z0-9/\-]{6,40}(?:TENDER|TEN|BID|NIT|GEM|CPPP)[A-Z0-9/\-]{0,20})\b',
    r'\bGEM/[A-Z0-9/\-]+\b',
    r'\bNIT[:\s]+([A-Z0-9/\-]+)\b',
    r'\b(\d{4}[-_][A-Z]{2,6}[-_]\d{3,8})\b',
]

DATE_CONTEXTS = {
    "submission_deadline": [
        r'(?:Bid\s+)?(?:Submission|Last\s+Date|Closing|Due\s+Date)[:\s]+([^\n]{5,50})',
        r'(?:Last\s+date\s+of\s+(?:submission|bid))[:\s]+([^\n]{5,50})',
    ],
    "opening_date": [
        r'(?:Opening|Bid\s+Opening|Technical\s+Bid\s+Opening)[:\s]+([^\n]{5,50})',
    ],
    "published": [
        r'(?:Published|Published\s+Date|Tender\s+Date|Publish\s+Date)[:\s]+([^\n]{5,50})',
        r'(?:Start\s+Date|Available\s+From)[:\s]+([^\n]{5,50})',
    ],
}

TURNOVER_PATTERNS = [
    r'(?:Annual\s+)?(?:Average\s+)?Turnover[:\s]+(?:of\s+)?(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:Lakh|Lakhs?|Crore|Cr\.?)?',
    r'(?:minimum|min\.?)\s+(?:annual\s+)?turnover[:\s]+([^\n]{5,50})',
]

EXPERIENCE_PATTERNS = [
    r'(?:experience|prior\s+experience|similar\s+works?)[:\s]+(?:of\s+)?(?:minimum\s+|at\s+least\s+)?([0-9]+)\s*(?:year|yr)',
    r'([0-9]+)\s*(?:year|yr)[s\s]+(?:of\s+)?(?:experience|prior\s+experience)',
]

CERTIFICATION_KEYWORDS = [
    "ISO 9001", "ISO 27001", "ISO 20000", "ISO 14001", "ISO 45001",
    "CMMI", "CERT-In", "STQC", "BIS", "CE Mark", "GeM", "NSIC",
    "MSME", "Udyam", "SSI", "DPIIT", "Startup India",
]

STATE_LIST = [
    "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Uttar Pradesh",
    "West Bengal", "Rajasthan", "Madhya Pradesh", "Andhra Pradesh", "Telangana",
    "Kerala", "Haryana", "Punjab", "Bihar", "Odisha", "Assam", "Jharkhand",
    "Uttarakhand", "Himachal Pradesh", "Goa", "Chhattisgarh", "Jharkhand",
    "Tripura", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Arunachal Pradesh",
    "Sikkim", "J&K", "Jammu and Kashmir", "Ladakh", "Chandigarh",
]


def _clean_amount(s: str) -> Optional[float]:
    """Normalize an amount string to Lakhs INR."""
    s = s.strip().replace(",", "")
    try:
        val = float(s)
        return val
    except ValueError:
        return None


def _to_lakhs(value: float, unit: str) -> float:
    unit_lower = unit.lower()
    if "crore" in unit_lower or "cr" in unit_lower:
        return value * 100.0
    return value  # Already in Lakhs


def extract_amounts(text: str) -> Dict[str, Optional[float]]:
    """Extract estimated cost and EMD from document text."""
    result = {"estimated_cost_lakhs": None, "emd_lakhs": None}

    # EMD first (more specific context)
    for pattern in EMD_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            val_str = match.group(1).replace(",", "")
            try:
                val = float(val_str)
                # Determine unit from surrounding context
                context = text[max(0, match.start() - 20): match.end() + 20]
                if "crore" in context.lower() or "cr." in context.lower():
                    val *= 100
                result["emd_lakhs"] = val
                break
            except ValueError:
                pass

    # Estimated cost — look for largest amount in financial context
    amounts = []
    for pattern in AMOUNT_PATTERNS:
        for match in re.finditer(pattern, text, re.IGNORECASE):
            val_str = match.group(1).replace(",", "")
            try:
                val = float(val_str)
                context = text[max(0, match.start() - 30): match.end() + 30].lower()
                if "crore" in context or "cr." in context:
                    val *= 100
                amounts.append(val)
            except ValueError:
                pass

    if amounts:
        result["estimated_cost_lakhs"] = max(amounts)

    return result


def extract_dates(text: str) -> Dict[str, Optional[datetime]]:
    """Extract key tender dates from text."""
    dates = {}
    for field, patterns in DATE_CONTEXTS.items():
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                raw_date = match.group(1).strip()
                try:
                    parsed = dateparser.parse(raw_date, dayfirst=True)
                    if parsed and parsed.year >= 2020:
                        dates[field] = parsed
                        break
                except (ValueError, OverflowError):
                    pass
    return dates


def extract_state(text: str) -> Optional[str]:
    """Extract state from text using known state list."""
    for state in STATE_LIST:
        if re.search(r'\b' + re.escape(state) + r'\b', text, re.IGNORECASE):
            return state
    return None


def extract_turnover(text: str) -> Optional[float]:
    """Extract minimum turnover requirement in Lakhs."""
    for pattern in TURNOVER_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw = match.group(1)
            # Try to find the number and unit
            num_match = re.search(r'([0-9,]+(?:\.[0-9]+)?)', raw)
            if num_match:
                try:
                    val = float(num_match.group(1).replace(",", ""))
                    context = raw.lower()
                    if "crore" in context or "cr." in context:
                        val *= 100
                    return val
                except ValueError:
                    pass
    return None


def extract_experience(text: str) -> Optional[int]:
    """Extract minimum experience requirement in years."""
    for pattern in EXPERIENCE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return int(match.group(1))
            except (ValueError, IndexError):
                pass
    return None


def extract_certifications(text: str) -> List[str]:
    """Extract required certifications from text."""
    found = []
    for cert in CERTIFICATION_KEYWORDS:
        if cert.lower() in text.lower():
            found.append(cert)
    return found


def extract_msme_flag(text: str) -> bool:
    """Check if MSME exemption or preference is mentioned."""
    msme_keywords = [
        "msme", "micro, small", "small enterprise", "startup",
        "udyam", "emd exempt", "emd waived", "msme registered",
        "msme exemption",
    ]
    text_lower = text.lower()
    return any(kw in text_lower for kw in msme_keywords)


class Tier1Extractor:
    """
    Rule-based extraction — handles ~70% of fields at zero LLM cost.
    Operates on raw text (from OCR or structured JSON).
    """

    def extract(self, text: str, source_json: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Extract all possible fields using rules.
        Returns a dict with extracted values and confidence per field.
        """
        result = {
            "_extraction_tier": 1,
            "_fields_extracted": [],
            "_fields_pending": [],
        }

        # If source JSON is already structured (e.g., mock or GeM API), use it directly
        if source_json:
            result.update(self._from_structured_json(source_json))
            result["_extraction_tier"] = 1
            return result

        # Otherwise extract from text
        amounts = extract_amounts(text)
        if amounts["estimated_cost_lakhs"]:
            result["estimated_cost_lakhs"] = amounts["estimated_cost_lakhs"]
            result["_fields_extracted"].append("estimated_cost_lakhs")
        if amounts["emd_lakhs"]:
            result["emd_lakhs"] = amounts["emd_lakhs"]
            result["_fields_extracted"].append("emd_lakhs")

        dates = extract_dates(text)
        for field, value in dates.items():
            result[field] = value.isoformat() if value else None
            if value:
                result["_fields_extracted"].append(field)

        state = extract_state(text)
        if state:
            result["state"] = state
            result["_fields_extracted"].append("state")

        turnover = extract_turnover(text)
        if turnover:
            result["turnover_min_lakhs"] = turnover
            result["_fields_extracted"].append("turnover_min_lakhs")

        experience = extract_experience(text)
        if experience:
            result["experience_years"] = experience
            result["_fields_extracted"].append("experience_years")

        certs = extract_certifications(text)
        result["certifications_required"] = certs
        if certs:
            result["_fields_extracted"].append("certifications_required")

        msme = extract_msme_flag(text)
        result["msme_eligible"] = msme
        result["_fields_extracted"].append("msme_eligible")

        # Mark fields needing Tier 2/3
        required_fields = {
            "title", "ministry", "department", "organisation",
            "categories", "procurement_method", "eligibility_raw_text",
        }
        result["_fields_pending"] = list(
            required_fields - set(result["_fields_extracted"])
        )

        return result

    def _from_structured_json(self, data: Dict) -> Dict:
        """Directly map structured JSON (GeM API / Mock) to our schema."""
        eligibility = data.get("eligibility", {})
        return {
            "title": data.get("title", ""),
            "ministry": data.get("ministry"),
            "department": data.get("department"),
            "organisation": data.get("organisation"),
            "state": data.get("state"),
            "estimated_cost_lakhs": data.get("estimated_cost_lakhs"),
            "emd_lakhs": data.get("emd_lakhs"),
            "tender_fee": data.get("tender_fee"),
            "performance_guarantee_pct": data.get("performance_guarantee_pct"),
            "categories": data.get("categories", []),
            "procurement_method": data.get("procurement_method"),
            "status": data.get("status", "active"),
            "published_at": data.get("published_at"),
            "submission_deadline": data.get("submission_deadline"),
            "opening_date": data.get("opening_date"),
            "bid_validity_days": data.get("bid_validity_days"),
            "work_completion_days": data.get("work_completion_days"),
            "turnover_min_lakhs": eligibility.get("turnover_min_lakhs"),
            "experience_years": eligibility.get("experience_years"),
            "certifications_required": eligibility.get("certifications_required", []),
            "msme_eligible": eligibility.get("msme_eligible", False),
            "startup_eligible": eligibility.get("startup_eligible", False),
            "contact_name": data.get("contact", {}).get("name"),
            "contact_email": data.get("contact", {}).get("email"),
            "contact_phone": data.get("contact", {}).get("phone"),
            "ai_summary": data.get("ai_summary"),
            "_fields_extracted": [
                "title", "ministry", "department", "organisation", "state",
                "estimated_cost_lakhs", "emd_lakhs", "categories", "status",
                "submission_deadline", "msme_eligible",
            ],
            "_fields_pending": [],
        }
