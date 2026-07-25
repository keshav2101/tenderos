"""
Tier 1 Extraction — Rule-based, regex + spaCy NER.
Handles ~70% of all fields at near-zero compute cost.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any

import structlog
from dateutil import parser as dateparser

logger = structlog.get_logger()

# ─── Regex patterns ───────────────────────────────────────────────────────────

# Indian currency patterns (various formats)
AMOUNT_PATTERNS = [
    r"(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:Crore|Cr\.?)",  # Rs. 5.2 Crore
    r"(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:Lakh|Lakhs?|L\.?)",  # Rs. 52 Lakhs
    r"(?:Rs\.?|INR|₹)\s*([0-9,]+(?:\.[0-9]+)?)",  # Rs. 52,00,000
    r"([0-9,]+(?:\.[0-9]+)?)\s*(?:Crore|Cr\.)",
    r"([0-9,]+(?:\.[0-9]+)?)\s*(?:Lakh|Lakhs?|L\.)",
]

EMD_PATTERNS = [
    r"(?:EMD|Earnest Money(?:\s+Deposit)?)[:\s]+(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:Lakh|Lakhs?|Crore|Cr\.?)?",
    r"(?:Bid Security)[:\s]+(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]+)?)",
]

TENDER_ID_PATTERNS = [
    r"\b([A-Z0-9/\-]{6,40}(?:TENDER|TEN|BID|NIT|GEM|CPPP)[A-Z0-9/\-]{0,20})\b",
    r"\bGEM/[A-Z0-9/\-]+\b",
    r"\bNIT[:\s]+([A-Z0-9/\-]+)\b",
    r"\b(\d{4}[-_][A-Z]{2,6}[-_]\d{3,8})\b",
]

DATE_CONTEXTS = {
    "submission_deadline": [
        r"(?:Bid\s+)?(?:Submission|Last\s+Date|Closing|Due\s+Date)[:\s]+([^\n]{5,50})",
        r"(?:Last\s+date\s+of\s+(?:submission|bid))[:\s]+([^\n]{5,50})",
    ],
    "opening_date": [
        r"(?:Opening|Bid\s+Opening|Technical\s+Bid\s+Opening)[:\s]+([^\n]{5,50})",
    ],
    "published": [
        r"(?:Published|Published\s+Date|Tender\s+Date|Publish\s+Date)[:\s]+([^\n]{5,50})",
        r"(?:Start\s+Date|Available\s+From)[:\s]+([^\n]{5,50})",
    ],
}

TURNOVER_PATTERNS = [
    r"(?:Annual\s+)?(?:Average\s+)?Turnover[:\s]+(?:of\s+)?(?:Rs\.?|INR|₹)?\s*([0-9,]+(?:\.[0-9]+)?)\s*(?:Lakh|Lakhs?|Crore|Cr\.?)?",
    r"(?:minimum|min\.?)\s+(?:annual\s+)?turnover[:\s]+([^\n]{5,50})",
]

EXPERIENCE_PATTERNS = [
    r"(?:experience|prior\s+experience|similar\s+works?)[:\s]+(?:of\s+)?(?:minimum\s+|at\s+least\s+)?([0-9]+)\s*(?:year|yr)",
    r"([0-9]+)\s*(?:year|yr)[s\s]+(?:of\s+)?(?:experience|prior\s+experience)",
]

CERTIFICATION_KEYWORDS = [
    "ISO 9001",
    "ISO 27001",
    "ISO 20000",
    "ISO 14001",
    "ISO 45001",
    "CMMI",
    "CERT-In",
    "STQC",
    "BIS",
    "CE Mark",
    "GeM",
    "NSIC",
    "MSME",
    "Udyam",
    "SSI",
    "DPIIT",
    "Startup India",
]

STATE_LIST = [
    "Delhi",
    "Maharashtra",
    "Karnataka",
    "Tamil Nadu",
    "Gujarat",
    "Uttar Pradesh",
    "West Bengal",
    "Rajasthan",
    "Madhya Pradesh",
    "Andhra Pradesh",
    "Telangana",
    "Kerala",
    "Haryana",
    "Punjab",
    "Bihar",
    "Odisha",
    "Assam",
    "Jharkhand",
    "Uttarakhand",
    "Himachal Pradesh",
    "Goa",
    "Chhattisgarh",
    "Tripura",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Arunachal Pradesh",
    "Sikkim",
    "J&K",
    "Jammu and Kashmir",
    "Ladakh",
    "Chandigarh",
]

STATE_COORDS = {
    "Andhra Pradesh": (15.9129, 79.7400),
    "Arunachal Pradesh": (28.2180, 94.7278),
    "Assam": (26.2006, 92.9376),
    "Bihar": (25.0961, 85.3131),
    "Chhattisgarh": (21.2787, 81.8661),
    "Goa": (15.2993, 74.1240),
    "Gujarat": (22.2587, 71.1924),
    "Haryana": (29.0588, 76.0856),
    "Himachal Pradesh": (31.1048, 77.1734),
    "Jharkhand": (23.6102, 85.2799),
    "Karnataka": (15.3173, 75.7139),
    "Kerala": (10.8505, 76.2711),
    "Madhya Pradesh": (22.9734, 78.6569),
    "Maharashtra": (19.7515, 75.7139),
    "Manipur": (24.6637, 93.9063),
    "Meghalaya": (25.4670, 91.3662),
    "Mizoram": (23.1645, 92.9376),
    "Nagaland": (26.1584, 94.5624),
    "Odisha": (20.9517, 85.0985),
    "Punjab": (31.1471, 75.3412),
    "Rajasthan": (27.0238, 74.2179),
    "Sikkim": (27.5330, 88.5122),
    "Tamil Nadu": (11.1271, 78.6569),
    "Telangana": (18.1124, 79.0193),
    "Tripura": (23.9408, 91.9882),
    "Uttar Pradesh": (26.8467, 80.9462),
    "Uttarakhand": (30.0668, 79.0193),
    "West Bengal": (22.9868, 87.8550),
    "Delhi": (28.6139, 77.2090),
}


def _clean_amount(s: str) -> float | None:
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


def extract_amounts(text: str) -> dict[str, float | None]:
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
                context = text[max(0, match.start() - 20) : match.end() + 20]
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
                context = text[max(0, match.start() - 30) : match.end() + 30].lower()
                if "crore" in context or "cr." in context:
                    val *= 100
                amounts.append(val)
            except ValueError:
                pass

    if amounts:
        result["estimated_cost_lakhs"] = max(amounts)

    return result


def extract_dates(text: str) -> dict[str, datetime | None]:
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


def extract_state(text: str) -> str | None:
    """Extract state from text using known state list."""
    for state in STATE_LIST:
        if re.search(r"\b" + re.escape(state) + r"\b", text, re.IGNORECASE):
            return state
    return None


def extract_turnover(text: str) -> float | None:
    """Extract minimum turnover requirement in Lakhs."""
    for pattern in TURNOVER_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            raw = match.group(1)
            # Try to find the number and unit
            num_match = re.search(r"([0-9,]+(?:\.[0-9]+)?)", raw)
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


def extract_experience(text: str) -> int | None:
    """Extract minimum experience requirement in years."""
    for pattern in EXPERIENCE_PATTERNS:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return int(match.group(1))
            except (ValueError, IndexError):
                pass
    return None


def extract_certifications(text: str) -> list[str]:
    """Extract required certifications from text."""
    found = []
    for cert in CERTIFICATION_KEYWORDS:
        if cert.lower() in text.lower():
            found.append(cert)
    return found


def extract_msme_flag(text: str) -> bool:
    """Check if MSME exemption or preference is mentioned."""
    msme_keywords = [
        "msme",
        "micro, small",
        "small enterprise",
        "startup",
        "udyam",
        "emd exempt",
        "emd waived",
        "msme registered",
        "msme exemption",
    ]
    text_lower = text.lower()
    return any(kw in text_lower for kw in msme_keywords)


def extract_consortium_jv_oem(text: str) -> tuple[bool, bool, bool]:
    """Extract consortium_allowed, jv_allowed, and oem_required flags."""
    text_lower = text.lower()

    consortium = False
    if "consortium" in text_lower:
        # Check if allowed
        if any(
            w in text_lower
            for w in [
                "allowed",
                "permitted",
                "eligible",
                "acceptable",
                "jointly and severally",
            ]
        ):
            consortium = True

    jv = False
    if "joint venture" in text_lower or " jv" in text_lower:
        if any(
            w in text_lower for w in ["allowed", "permitted", "eligible", "acceptable"]
        ):
            jv = True

    oem = False
    if "oem" in text_lower or "original equipment manufacturer" in text_lower:
        if any(
            w in text_lower
            for w in [
                "required",
                "authorization",
                "maf ",
                "manufacturers authorization",
                "oem compliance",
            ]
        ):
            oem = True

    return consortium, jv, oem


def extract_warranty_months(text: str) -> int | None:
    """Extract warranty period in months."""
    patterns = [
        r"(\d+)\s*months?\s*warrant(y|ee)",
        r"warrant(y|ee)\s*of\s*(\d+)\s*months",
        r"(\d+)\s*years?\s*warrant(y|ee)",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            try:
                val = int(m.group(1))
                if "year" in p or "years" in m.group(0):
                    val *= 12
                return val
            except ValueError:
                pass
    return None


def extract_duration_days(text: str) -> int | None:
    """Extract contract completion duration in days."""
    patterns = [
        r"(?:completion\s+period|time\s+for\s+completion|period\s+of\s+work|duration)[:\s]+(\d+)\s*(days?|months?|weeks?)",
        r"(\d+)\s*(days?|months?|weeks?)\s*(?:completion|duration)",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            try:
                val = int(m.group(1))
                unit = m.group(2).lower()
                if "month" in unit:
                    val *= 30
                elif "week" in unit:
                    val *= 7
                return val
            except ValueError:
                pass
    return None


def extract_payment_milestones(text: str) -> int:
    """Estimate count of payment milestones."""
    patterns = [
        r"\d+%\s*payment",
        r"payment\s*milestone",
        r"stage\s*payment",
        r"milestone\s*payment",
    ]
    count = 0
    for p in patterns:
        count += len(re.findall(p, text, re.IGNORECASE))
    return min(count, 10)  # cap at 10


def extract_penalty_clause(text: str) -> bool:
    """Check if penalty or liquidated damages clause exists."""
    keywords = [
        "penalty",
        "liquidated damages",
        "delay charges",
        "ld clause",
        "penalties",
    ]
    text_lower = text.lower()
    return any(kw in text_lower for kw in keywords)


def extract_funding_agency(text: str) -> str | None:
    """Extract funding agency name (default to Government of India)."""
    text_lower = text.lower()
    if "world bank" in text_lower or "ibrd" in text_lower or "ida" in text_lower:
        return "World Bank"
    if "asian development bank" in text_lower or " adb" in text_lower:
        return "Asian Development Bank"
    if "jica" in text_lower or "japan international cooperation" in text_lower:
        return "JICA"
    if "kfw" in text_lower:
        return "KfW"
    return "Government of India"


def derive_codes(title: str) -> tuple[str | None, str | None]:
    """Derive CPV and UNSPSC codes based on keywords."""
    title_lower = title.lower()
    if any(
        k in title_lower
        for k in ["software", "erp", "app ", "application", "portal", "cloud", "saas"]
    ):
        return "72200000", "43230000"  # Software, System/Application Software
    if any(
        k in title_lower
        for k in ["computer", "hardware", "server", "laptop", "printer"]
    ):
        return "30200000", "43210000"  # Computer equipment, Computer hardware
    if any(
        k in title_lower for k in ["construction", "building", "civil", "structure"]
    ):
        return "45200000", "72000000"  # Civil construction, Building construction
    if any(k in title_lower for k in ["road", "highway", "bridge", "flyover"]):
        return "45233140", "72141103"  # Road construction, Highway construction
    if any(
        k in title_lower
        for k in ["medical", "health", "hospital", "medicine", "ventilator", "x-ray"]
    ):
        return "33000000", "42000000"  # Medical equipments
    if any(k in title_lower for k in ["consult", "study", "dpr", "advisory"]):
        return "79311100", "80100000"  # Research/consultancy, Management advisory
    if any(k in title_lower for k in ["security", "cctv", "surveillance", "guard"]):
        return "79710000", "46171600"  # Security services, Surveillance
    if any(
        k in title_lower
        for k in ["solar", "wind", "substation", "transformer", "power", "cabling"]
    ):
        return "31000000", "26000000"  # Electrical machinery, Power generation
    return None, None


class Tier1Extractor:
    """
    Rule-based extraction — handles ~70% of fields at zero LLM cost.
    Operates on raw text (from OCR or structured JSON).
    """

    def extract(self, text: str, source_json: dict | None = None) -> dict[str, Any]:
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
            coords = STATE_COORDS.get(state)
            if coords:
                result["latitude"] = coords[0]
                result["longitude"] = coords[1]
                result["_fields_extracted"].extend(["latitude", "longitude"])

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

        # Consortium / JV / OEM allowed
        consortium, jv, oem = extract_consortium_jv_oem(text)
        result["consortium_allowed"] = consortium
        result["jv_allowed"] = jv
        result["oem_required"] = oem
        result["_fields_extracted"].extend(
            ["consortium_allowed", "jv_allowed", "oem_required"]
        )

        # Warranty / completion duration / milestones
        warranty = extract_warranty_months(text)
        if warranty:
            result["warranty_months"] = warranty
            result["_fields_extracted"].append("warranty_months")

        duration = extract_duration_days(text)
        if duration:
            result["contract_duration_days"] = duration
            result["_fields_extracted"].append("contract_duration_days")

        milestones = extract_payment_milestones(text)
        result["payment_milestone_count"] = milestones
        result["_fields_extracted"].append("payment_milestone_count")

        penalty = extract_penalty_clause(text)
        result["penalty_clause"] = penalty
        result["_fields_extracted"].append("penalty_clause")

        # Funding agency
        funding = extract_funding_agency(text)
        result["funding_agency"] = funding
        result["_fields_extracted"].append("funding_agency")

        # Derive title codes
        derived_title = ""
        # Match title patterns
        m_title = re.search(
            r"(?:Subject|Name of work|Title)[:\s]+([^\n]+)", text, re.IGNORECASE
        )
        if m_title:
            derived_title = m_title.group(1).strip()
            cpv, unspsc = derive_codes(derived_title)
            if cpv:
                result["cpv_code"] = cpv
                result["unspsc_code"] = unspsc
                result["_fields_extracted"].extend(["cpv_code", "unspsc_code"])

        # Mark fields needing Tier 2/3
        required_fields = {
            "title",
            "ministry",
            "department",
            "organisation",
            "categories",
            "procurement_method",
            "eligibility_raw_text",
        }
        result["_fields_pending"] = list(
            required_fields - set(result["_fields_extracted"])
        )

        return result

    def _from_structured_json(self, data: dict) -> dict:
        """Directly map structured JSON (GeM API / Mock) to our schema."""
        eligibility = data.get("eligibility", {})
        title = data.get("title", "")
        cpv, unspsc = derive_codes(title)

        state = data.get("state", "Delhi")
        coords = STATE_COORDS.get(state)

        return {
            "title": title,
            "ministry": data.get("ministry"),
            "department": data.get("department"),
            "organisation": data.get("organisation"),
            "state": state,
            "latitude": coords[0] if coords else None,
            "longitude": coords[1] if coords else None,
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
            "contract_duration_days": data.get("work_completion_days"),
            "turnover_min_lakhs": eligibility.get("turnover_min_lakhs"),
            "experience_years": eligibility.get("experience_years"),
            "certifications_required": eligibility.get("certifications_required", []),
            "msme_eligible": eligibility.get("msme_eligible", False),
            "startup_eligible": eligibility.get("startup_eligible", False),
            "consortium_allowed": eligibility.get("consortium_allowed", False),
            "jv_allowed": eligibility.get("jv_allowed", False),
            "oem_required": eligibility.get("oem_required", False),
            "warranty_months": data.get("warranty_months"),
            "payment_milestone_count": data.get("payment_milestone_count", 0),
            "penalty_clause": data.get("penalty_clause", False),
            "funding_agency": data.get("funding_agency", "Government of India"),
            "cpv_code": cpv,
            "unspsc_code": unspsc,
            "contact_name": data.get("contact", {}).get("name"),
            "contact_email": data.get("contact", {}).get("email"),
            "contact_phone": data.get("contact", {}).get("phone"),
            "ai_summary": data.get("ai_summary"),
            "_fields_extracted": [
                "title",
                "ministry",
                "department",
                "organisation",
                "state",
                "estimated_cost_lakhs",
                "emd_lakhs",
                "categories",
                "status",
                "submission_deadline",
                "msme_eligible",
                "latitude",
                "longitude",
                "consortium_allowed",
                "jv_allowed",
                "oem_required",
                "funding_agency",
                "cpv_code",
                "unspsc_code",
            ],
            "_fields_pending": [],
        }
