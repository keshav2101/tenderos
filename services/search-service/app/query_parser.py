"""
Query parser to extract search terms and filters from natural language search.
"""
from typing import Dict, Any
import re


async def parse_natural_language_query(query: str) -> Dict[str, Any]:
    """
    Parses a natural language query like:
    'AI tenders above 5 crore in Karnataka'
    Returns:
    {
        "query": "AI",
        "filters": {
            "states": ["Karnataka"],
            "cost_min_lakhs": 500.0
        }
    }
    """
    filters: Dict[str, Any] = {}
    clean_query = query

    # Match state names
    states_list = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
        "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
        "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
        "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi"
    ]
    matched_states = []
    for state in states_list:
        if re.search(r'\b' + re.escape(state) + r'\b', clean_query, re.IGNORECASE):
            matched_states.append(state)
            clean_query = re.sub(r'\b(in|at|of)?\s*' + re.escape(state) + r'\b', '', clean_query, flags=re.IGNORECASE)

    if matched_states:
        filters["states"] = matched_states

    # Match cost (Crore / Lakh)
    # e.g., 'above 5 crore', 'below 50 lakh', 'greater than 10 cr'
    cost_min = None
    cost_max = None

    crore_match = re.search(r'(?:above|greater than|more than|\>\s*)\s*(\d+(?:\.\d+)?)\s*(?:crore|cr)', clean_query, re.IGNORECASE)
    if crore_match:
        cost_min = float(crore_match.group(1)) * 100.0  # Convert to Lakhs
        clean_query = re.sub(r'(?:above|greater than|more than|\>\s*)\s*\d+(?:\.\d+)?\s*(?:crore|cr)', '', clean_query, flags=re.IGNORECASE)

    lakh_match = re.search(r'(?:above|greater than|more than|\>\s*)\s*(\d+(?:\.\d+)?)\s*(?:lakh|lk)', clean_query, re.IGNORECASE)
    if lakh_match:
        cost_min = float(lakh_match.group(1))
        clean_query = re.sub(r'(?:above|greater than|more than|\>\s*)\s*\d+(?:\.\d+)?\s*(?:lakh|lk)', '', clean_query, flags=re.IGNORECASE)

    crore_max_match = re.search(r'(?:below|less than|under|\<\s*)\s*(\d+(?:\.\d+)?)\s*(?:crore|cr)', clean_query, re.IGNORECASE)
    if crore_max_match:
        cost_max = float(crore_max_match.group(1)) * 100.0  # Convert to Lakhs
        clean_query = re.sub(r'(?:below|less than|under|\<\s*)\s*\d+(?:\.\d+)?\s*(?:crore|cr)', '', clean_query, flags=re.IGNORECASE)

    if cost_min:
        filters["cost_min_lakhs"] = cost_min
    if cost_max:
        filters["cost_max_lakhs"] = cost_max

    # Match MSME
    if re.search(r'\bmsme\b', clean_query, re.IGNORECASE):
        filters["msme_eligible"] = True
        clean_query = re.sub(r'\bmsme\b', '', clean_query, flags=re.IGNORECASE)

    # Clean query text
    clean_query = re.sub(r'\s+', ' ', clean_query).strip()
    # Remove hanging words like "tenders", "procurement", "tenders in" at the end
    clean_query = re.sub(r'\b(tenders?|procurement)\b', '', clean_query, flags=re.IGNORECASE).strip()

    return {
        "query": clean_query or query,
        "filters": filters
    }
