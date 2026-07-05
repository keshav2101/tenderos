"""
Bid Qualification Engine
Compares company Digital Twin against tender requirements.
Produces: match score, eligibility verdict, gap analysis, winning probability.
"""
from __future__ import annotations
import math
from typing import Dict, List, Optional, Tuple
from uuid import UUID

import structlog

logger = structlog.get_logger()

# Scoring weights
WEIGHTS = {
    "category_match": 0.25,
    "turnover_eligibility": 0.20,
    "experience_eligibility": 0.20,
    "certification_match": 0.15,
    "geographic_presence": 0.10,
    "msme_startup_benefit": 0.10,
}


class BidQualificationEngine:
    """
    Computes bid qualification score and eligibility for a company-tender pair.
    Returns structured output with actionable gaps.
    """

    def qualify(self, company: Dict, tender: Dict) -> Dict:
        """
        Main entry point.
        company: company profile dict
        tender: tender dict (from PostgreSQL or search index)
        """
        checks = {}
        scores = {}
        gaps = {"critical": [], "medium": [], "low": []}
        missing_docs = []
        advantages = []
        key_risks = []

        # ─── Category Match ───────────────────────────────────────────────────
        tender_categories = set(tender.get("categories", []))
        company_categories = set(company.get("target_categories", []))
        category_overlap = tender_categories & company_categories
        category_score = min(1.0, len(category_overlap) / max(len(tender_categories), 1))
        scores["category_match"] = category_score
        if category_score == 0:
            gaps["critical"].append({
                "field": "category",
                "required": ", ".join(tender_categories),
                "company_has": ", ".join(company_categories),
                "gap": "No category overlap between company profile and tender",
            })
        elif category_score < 0.5:
            gaps["medium"].append({
                "field": "category",
                "required": ", ".join(tender_categories),
                "company_has": ", ".join(company_categories),
                "gap": f"Partial match ({int(category_score * 100)}%)",
            })
        else:
            advantages.append(f"Strong category match: {', '.join(category_overlap)}")

        # ─── MSME / Startup Benefits Definitions ────────────────────────────────
        is_msme = company.get("is_msme", False)
        is_startup = company.get("is_startup", False)
        tender_msme_eligible = tender.get("msme_eligible", False)
        tender_startup_eligible = tender.get("startup_eligible", False)

        # ─── Turnover Check ───────────────────────────────────────────────────
        required_turnover = tender.get("turnover_min_lakhs")
        company_turnover = company.get("avg_turnover_3yr_lakhs") or company.get("max_turnover_lakhs")
        turnover_waived = (is_msme and tender_msme_eligible) or (is_startup and tender_startup_eligible)
        
        if required_turnover and required_turnover > 0:
            if turnover_waived:
                turnover_status = "WAIVED"
                turnover_score = 1.0
                advantages.append("Prior turnover requirement waived under MSME/Startup relaxation criteria")
            elif not company_turnover:
                turnover_status = "UNKNOWN"
                turnover_score = 0.3
                missing_docs.append("Turnover Certificates (CA audited, last 3 years)")
                gaps["critical"].append({
                    "field": "turnover",
                    "required": f"₹{required_turnover:.2f} Lakhs",
                    "company_has": "Not provided",
                    "gap": "Turnover data missing — upload CA-certified certificates",
                })
            elif company_turnover >= required_turnover:
                turnover_status = "PASS"
                turnover_score = 1.0
                advantages.append(f"Turnover ₹{company_turnover:.0f}L exceeds requirement ₹{required_turnover:.0f}L")
            else:
                turnover_status = "FAIL"
                gap_pct = (required_turnover - company_turnover) / required_turnover * 100
                turnover_score = max(0.0, company_turnover / required_turnover)
                gaps["critical"].append({
                    "field": "turnover",
                    "required": f"₹{required_turnover:.2f} Lakhs",
                    "company_has": f"₹{company_turnover:.2f} Lakhs",
                    "gap": f"Deficit: ₹{required_turnover - company_turnover:.2f} Lakhs ({gap_pct:.0f}% shortfall)",
                })
        else:
            turnover_status = "NOT_REQUIRED"
            turnover_score = 1.0

        scores["turnover_eligibility"] = turnover_score
        checks["turnover_check"] = turnover_status
        checks["turnover_required_lakhs"] = required_turnover
        checks["turnover_company_lakhs"] = company_turnover

        # ─── Experience Check ─────────────────────────────────────────────────
        required_exp = tender.get("experience_years", 0) or 0
        company_exp = company.get("total_experience_years", 0) or 0
        exp_waived = (is_msme and tender_msme_eligible) or (is_startup and tender_startup_eligible)
        
        if required_exp > 0:
            if exp_waived:
                exp_status = "WAIVED"
                exp_score = 1.0
                advantages.append("Prior experience requirement waived under MSME/Startup relaxation criteria")
            elif company_exp == 0:
                exp_status = "UNKNOWN"
                exp_score = 0.3
                missing_docs.append("Experience Certificates / Work Orders from past clients")
                gaps["critical"].append({
                    "field": "experience",
                    "required": f"{required_exp} years",
                    "company_has": "Not provided",
                    "gap": "Experience data missing — upload project certificates",
                })
            elif company_exp >= required_exp:
                exp_status = "PASS"
                exp_score = 1.0
            else:
                exp_status = "FAIL"
                exp_score = company_exp / required_exp
                gaps["medium"].append({
                    "field": "experience",
                    "required": f"{required_exp} years",
                    "company_has": f"{company_exp:.1f} years",
                    "gap": f"{required_exp - company_exp:.1f} years short",
                })
        else:
            exp_status = "NOT_REQUIRED"
            exp_score = 1.0

        scores["experience_eligibility"] = exp_score
        checks["experience_check"] = exp_status


        # ─── Certification Check ──────────────────────────────────────────────
        required_certs = set(tender.get("certifications_required", []))
        company_certs = set(company.get("certifications", []))
        if required_certs:
            present = required_certs & company_certs
            missing = required_certs - company_certs
            cert_score = len(present) / len(required_certs) if required_certs else 1.0
            cert_status = "PASS" if not missing else ("PARTIAL" if present else "FAIL")
            if missing:
                for cert in missing:
                    missing_docs.append(f"Certification: {cert}")
                    gaps["medium"].append({
                        "field": "certification",
                        "required": cert,
                        "company_has": "Missing",
                        "gap": f"{cert} not found in company profile",
                    })
        else:
            cert_score = 1.0
            cert_status = "NOT_REQUIRED"
            present = set()
            missing = set()

        scores["certification_match"] = cert_score
        checks["certification_check"] = cert_status
        checks["certifications_required"] = list(required_certs)
        checks["certifications_present"] = list(present)
        checks["certifications_missing"] = list(missing)

        # ─── Geographic Presence ──────────────────────────────────────────────
        tender_state = tender.get("state")
        company_states = set(company.get("states_active", []))
        if tender_state and company_states:
            if tender_state in company_states:
                geo_score = 1.0
                advantages.append(f"Active presence in {tender_state}")
            else:
                geo_score = 0.5  # Can still bid, just not local
                gaps["low"].append({
                    "field": "geographic_presence",
                    "required": tender_state,
                    "company_has": ", ".join(list(company_states)[:3]),
                    "gap": f"No current operations in {tender_state}",
                })
        else:
            geo_score = 0.7  # Unknown

        scores["geographic_presence"] = geo_score

        # ─── MSME / Startup Benefits ──────────────────────────────────────────
        is_msme = company.get("is_msme", False)
        is_startup = company.get("is_startup", False)
        tender_msme_eligible = tender.get("msme_eligible", False)
        tender_startup_eligible = tender.get("startup_eligible", False)

        if tender_msme_eligible and is_msme:
            msme_score = 1.0
            advantages.append("EMD exempt as MSME enterprise")
            emd_status = "EXEMPT_MSME"
        elif tender_startup_eligible and is_startup:
            msme_score = 1.0
            advantages.append("Eligible as DPIIT-registered Startup")
            emd_status = "EXEMPT_STARTUP"
        else:
            msme_score = 0.5
            emd_status = "REQUIRED"

        scores["msme_startup_benefit"] = msme_score
        checks["emd_status"] = emd_status
        checks["msme_benefit_applicable"] = tender_msme_eligible and is_msme

        # ─── Compute final scores ─────────────────────────────────────────────
        match_score = int(
            sum(scores[k] * WEIGHTS[k] for k in WEIGHTS) * 100
        )

        # Eligibility: PASS requires turnover + experience to pass
        critical_fails = [g for g in gaps["critical"]]
        eligible = (
            turnover_status in ("PASS", "NOT_REQUIRED", "UNKNOWN", "WAIVED")
            and exp_status in ("PASS", "NOT_REQUIRED", "UNKNOWN", "WAIVED")
            and len(critical_fails) <= 1
        )

        # Eligibility score (stricter than match score)
        eligibility_score = int(
            (scores["turnover_eligibility"] * 0.35)
            + (scores["experience_eligibility"] * 0.35)
            + (scores["certification_match"] * 0.30)
        ) * 100

        # Winning probability — heuristic model
        winning_probability = self._estimate_win_probability(
            match_score, eligible, scores, company, tender
        )

        # Recommendation
        recommendation, reason = self._recommend(
            match_score, eligible, gaps, winning_probability
        )

        # Estimated prep hours
        prep_hours = self._estimate_prep_hours(tender, gaps, missing_docs)

        # Key risks from gaps
        key_risks = []
        for g in gaps["critical"]:
            key_risks.append(f"Critical gap: {g['gap']}")
        for g in gaps["medium"][:2]:
            key_risks.append(f"Gap: {g['gap']}")

        return {
            "match_score": match_score,
            "eligibility_score": min(100, eligibility_score),
            "winning_probability": winning_probability,
            "confidence": self._confidence(company, tender),
            "eligible": eligible,
            "eligibility_check": {
                **checks,
                "turnover_gap_lakhs": (
                    (required_turnover - company_turnover)
                    if required_turnover and company_turnover and required_turnover > company_turnover
                    else None
                ),
            },
            "gap_analysis": {
                "critical_gaps": gaps["critical"],
                "medium_gaps": gaps["medium"],
                "low_gaps": gaps["low"],
                "missing_documents": list(set(missing_docs)),
                "total_gaps": len(gaps["critical"]) + len(gaps["medium"]) + len(gaps["low"]),
            },
            "recommendation": recommendation,
            "recommendation_reason": reason,
            "estimated_prep_hours": prep_hours,
            "key_risks": key_risks[:4],
            "advantages": advantages,
            "score_breakdown": {
                "category_match": {
                    "score": int(scores["category_match"] * 100),
                    "weight": WEIGHTS["category_match"],
                    "weighted_score": round(scores["category_match"] * WEIGHTS["category_match"] * 100, 2)
                },
                "turnover_eligibility": {
                    "score": int(scores["turnover_eligibility"] * 100),
                    "weight": WEIGHTS["turnover_eligibility"],
                    "weighted_score": round(scores["turnover_eligibility"] * WEIGHTS["turnover_eligibility"] * 100, 2)
                },
                "experience_eligibility": {
                    "score": int(scores["experience_eligibility"] * 100),
                    "weight": WEIGHTS["experience_eligibility"],
                    "weighted_score": round(scores["experience_eligibility"] * WEIGHTS["experience_eligibility"] * 100, 2)
                },
                "certification_match": {
                    "score": int(scores["certification_match"] * 100),
                    "weight": WEIGHTS["certification_match"],
                    "weighted_score": round(scores["certification_match"] * WEIGHTS["certification_match"] * 100, 2)
                },
                "geographic_presence": {
                    "score": int(scores["geographic_presence"] * 100),
                    "weight": WEIGHTS["geographic_presence"],
                    "weighted_score": round(scores["geographic_presence"] * WEIGHTS["geographic_presence"] * 100, 2)
                },
                "msme_startup_benefit": {
                    "score": int(scores["msme_startup_benefit"] * 100),
                    "weight": WEIGHTS["msme_startup_benefit"],
                    "weighted_score": round(scores["msme_startup_benefit"] * WEIGHTS["msme_startup_benefit"] * 100, 2)
                }
            }
        }

    def _estimate_win_probability(
        self,
        match_score: int,
        eligible: bool,
        scores: Dict,
        company: Dict,
        tender: Dict,
    ) -> Optional[int]:
        """Heuristic winning probability — calibrated against historical patterns."""
        if not eligible:
            return None
        base = match_score * 0.5
        # Boost for MSME
        if company.get("is_msme") and tender.get("msme_eligible"):
            base += 10
        # Boost for exact category match
        if scores["category_match"] > 0.8:
            base += 10
        # Boost for strong turnover
        if scores["turnover_eligibility"] >= 1.0:
            base += 5
        # Cap between 10 and 90 (never claim certainty)
        return int(min(90, max(10, base)))

    def _recommend(
        self, match_score: int, eligible: bool, gaps: Dict, win_prob: Optional[int]
    ) -> Tuple[str, str]:
        if not eligible or match_score < 30:
            return "SKIP", "Low match or critical eligibility gaps make bidding unviable."
        critical = gaps.get("critical", [])
        if critical:
            return (
                "CONDITIONAL_BID",
                f"Eligible but {len(critical)} critical gap(s) must be addressed first.",
            )
        if match_score >= 70:
            return "BID", f"Strong match ({match_score}%) with no critical gaps. Recommended to bid."
        if match_score >= 50:
            return "BID", f"Moderate match ({match_score}%). Review gaps before proceeding."
        return "REVIEW", "Review eligibility details before deciding."

    def _estimate_prep_hours(self, tender: Dict, gaps: Dict, missing_docs: List) -> int:
        """Estimate document preparation hours."""
        base = 4
        cost = tender.get("estimated_cost_lakhs", 0) or 0
        if cost > 1000:
            base = 20
        elif cost > 100:
            base = 10
        elif cost > 20:
            base = 6
        base += len(missing_docs) * 2
        base += len(gaps.get("critical", [])) * 3
        return base

    def _confidence(self, company: Dict, tender: Dict) -> str:
        score = company.get("profile_score", 0) or 0
        if score >= 70:
            return "HIGH"
        elif score >= 40:
            return "MEDIUM"
        return "LOW"
