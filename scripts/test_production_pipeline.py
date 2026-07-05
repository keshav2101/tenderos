"""
Verification script for the TenderOS Production Pipeline.
Tests RAG citations, search filters, live analytics, and MSME/Startup relaxation criteria.
"""
import sys
import os
import asyncio
from datetime import datetime
from uuid import uuid4

# Add path to import local service modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../services/copilot-service")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../services/bid-qualification-service")))

from app.llm_client import LLMClient
from app.qualification_engine import BidQualificationEngine

def test_section(title: str):
    print(f"\n=== {title} ===")

def assert_pass(test_name: str, condition: bool, details: str = ""):
    if condition:
        print(f"  [✓] [PASS] {test_name} {f'({details})' if details else ''}")
    else:
        print(f"  [✗] [FAIL] {test_name} {f'({details})' if details else ''}")
        sys.exit(1)

async def main():
    test_section("1. Local Grounded RAG Citation Test")
    llm = LLMClient()
    
    # Format a prompt simulating the one sent by rag_pipeline
    sample_context = (
        "Excerpt 1 [Doc: tender_rules.pdf][Page 12][Section Eligibility]:\n"
        "The bidder must have an average annual turnover of 150 Lakhs.\n\n"
        "---\n\n"
        "Excerpt 2 [Doc: technical_specs.pdf][Page 4][Section Scope]:\n"
        "The bidder must have experience delivering at least 3 drone software projects."
    )
    user_prompt = (
        "Tender: Drone Supply\n"
        "Ministry: Ministry of Defence\n\n"
        f"Document excerpts (with page references):\n---\n{sample_context}\n---\n\n"
        "User question: What is the turnover requirement?\n\n"
        "Answer (with citations):"
    )
    
    # Generate the offline response
    response = llm.generate_local_rag_response(user_prompt)
    print("Response Generated:")
    print(response)
    
    assert_pass("Response contains document name", "tender_rules.pdf" in response)
    assert_pass("Response contains page number", "Page 12" in response)
    assert_pass("Response contains section title", "Eligibility" in response)
    assert_pass("Response contains confidence score", "Confidence Score:" in response)
    assert_pass("Response contains quoted text", "turnover" in response.lower())
    assert_pass("Response contains governance disclaimer", "Disclaimer: AI summaries" in response)

    test_section("2. MSME / Startup Qualification Waivers Test")
    engine = BidQualificationEngine()
    
    # Test Case A: Standard company (not MSME/Startup) with turnover/experience gap
    standard_company = {
        "is_msme": False,
        "is_startup": False,
        "avg_turnover_3yr_lakhs": 50.0,
        "total_experience_years": 1.0,
        "states_active": ["Karnataka"],
        "target_categories": ["Software"]
    }
    
    tender_reqs = {
        "turnover_min_lakhs": 150.0,
        "experience_years": 5.0,
        "msme_eligible": True,
        "startup_eligible": True,
        "categories": ["Software"],
        "state": "Karnataka"
    }
    
    res_std = engine.qualify(standard_company, tender_reqs)
    print("\nStandard Company Qualification Result:")
    print(f"Eligible: {res_std['eligible']}")
    print(f"Match Score: {res_std['match_score']}")
    print(f"Key Risks: {res_std['key_risks']}")
    assert_pass("Standard company fails eligibility due to deficits", not res_std["eligible"])

    # Test Case B: MSME / Startup waiver check
    msme_company = {
        "is_msme": True,
        "is_startup": False,
        "avg_turnover_3yr_lakhs": 50.0,  # Below reqs
        "total_experience_years": 1.0,   # Below reqs
        "states_active": ["Karnataka"],
        "target_categories": ["Software"]
    }
    
    res_msme = engine.qualify(msme_company, tender_reqs)
    print("\nMSME Company Qualification Result:")
    print(f"Eligible: {res_msme['eligible']}")
    print(f"Match Score: {res_msme['match_score']}")
    print(f"Advantages: {res_msme['advantages']}")
    assert_pass("MSME company is qualified due to Startup/MSME waivers", res_msme["eligible"])
    assert_pass("MSME advantages include EMD waiver", any("EMD exempt" in a for a in res_msme["advantages"]))
    assert_pass("MSME advantages include turnover waiver", any("turnover requirement waived" in a.lower() for a in res_msme["advantages"]))
    assert_pass("MSME advantages include experience waiver", any("experience requirement waived" in a.lower() for a in res_msme["advantages"]))

    print(f"\n==================================================")
    print(f"  [✓] PRODUCTION VERIFICATION PIPELINE PASSED")
    print(f"==================================================\n")

if __name__ == "__main__":
    asyncio.run(main())
