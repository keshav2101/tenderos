"""
Tier 3 Cloud LLM Extraction — used only when Tier 1 + 2 confidence < 0.8.
Supports Gemini (default), OpenAI, and Anthropic Claude.
All results are cached in Redis for 7 days to minimize repeat cost.
"""
from __future__ import annotations
import hashlib
import json
from typing import Any, Dict, Optional

import redis.asyncio as aioredis
import structlog

from app.config import settings

logger = structlog.get_logger()

EXTRACTION_PROMPT = """You are an expert at extracting structured information from Indian government procurement tenders.

Extract the following fields from the tender document text provided. Return ONLY valid JSON.
If a field is not found or unclear, use null.

Fields to extract:
- title: Full tender title/name
- ministry: Ministry name (e.g. "Ministry of Health and Family Welfare")
- department: Department or organization name
- organisation: Procuring entity name
- state: Indian state name
- district: District name if mentioned
- estimated_cost_lakhs: Estimated cost in Indian Lakhs (number only)
- emd_lakhs: EMD/Earnest Money Deposit in Lakhs (number only)
- tender_fee: Tender document fee in INR (number only)
- performance_guarantee_pct: Performance guarantee as percentage (number only)
- categories: Array of applicable categories from: [AI, IT, Cybersecurity, Healthcare, Medical Equipment, Construction, Defence, Education, Transport, Agriculture, Renewable Energy, Power, Telecommunications, Research, Manufacturing, Electronics, Consultancy, Cloud, Data Analytics, IoT, Smart City, Drone, GIS, Machine Learning, Facility Management, Other]
- procurement_method: One of: open, limited, single, emergency, gem, e-tendering, rate_contract, eoi
- submission_deadline: ISO 8601 datetime
- opening_date: ISO 8601 datetime  
- published_at: ISO 8601 datetime
- bid_validity_days: Integer
- turnover_min_lakhs: Minimum annual turnover required in Lakhs
- experience_years: Minimum experience required in years
- certifications_required: Array of required certifications (e.g. ["ISO 9001", "ISO 27001"])
- msme_eligible: true if MSME is eligible or exempt from EMD, false otherwise
- startup_eligible: true if startups can apply
- contact_name: Contact person name
- contact_email: Contact email
- contact_phone: Contact phone number
- eligibility_raw_text: The full eligibility clause text verbatim (max 500 chars)
- key_points: Array of 3-5 most important points about this tender

Tender document text:
---
{text}
---

Return only valid JSON, no explanation."""


class Tier3LLMExtractor:
    """
    Cloud LLM-based extraction for complex or non-standard tenders.
    Uses Gemini 2.0 Flash by default (cost-efficient, fast).
    All results cached in Redis with 7-day TTL.
    """

    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def _get_redis(self) -> aioredis.Redis:
        if self._redis is None:
            self._redis = await aioredis.from_url(
                settings.redis_url, decode_responses=True
            )
        return self._redis

    def _cache_key(self, text: str) -> str:
        h = hashlib.sha256(text[:2000].encode()).hexdigest()
        return f"extraction:v1:{h}"

    async def extract(self, text: str, provider: Optional[str] = None) -> Dict[str, Any]:
        """Extract using cloud LLM with Redis caching."""
        provider = provider or settings.LLM_PROVIDER
        cache_key = self._cache_key(text)

        # Check cache
        try:
            redis = await self._get_redis()
            cached = await redis.get(cache_key)
            if cached:
                logger.info("LLM extraction: cache hit", key=cache_key[:16])
                data = json.loads(cached)
                data["_from_cache"] = True
                return data
        except Exception as e:
            logger.warning("Redis cache read failed", error=str(e))

        # Call LLM
        prompt = EXTRACTION_PROMPT.format(text=text[:8000])  # Limit to 8k chars

        try:
            if provider == "gemini":
                result = await self._call_gemini(prompt)
            elif provider == "openai":
                result = await self._call_openai(prompt)
            elif provider == "anthropic":
                result = await self._call_anthropic(prompt)
            else:
                raise ValueError(f"Unknown LLM provider: {provider}")

            result["_extraction_tier"] = 3
            result["_llm_provider"] = provider
            result["_from_cache"] = False

            # Cache result for 7 days
            try:
                redis = await self._get_redis()
                await redis.setex(cache_key, 604800, json.dumps(result, default=str))
            except Exception as e:
                logger.warning("Redis cache write failed", error=str(e))

            return result

        except Exception as e:
            logger.error("Tier3 LLM extraction failed", provider=provider, error=str(e))
            return {"_extraction_tier": 3, "_error": str(e)}

    async def _call_gemini(self, prompt: str) -> Dict:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            "gemini-2.0-flash",
            generation_config={"response_mime_type": "application/json"},
        )
        response = model.generate_content(prompt)
        return json.loads(response.text)

    async def _call_openai(self, prompt: str) -> Dict:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        return json.loads(response.choices[0].message.content)

    async def _call_anthropic(self, prompt: str) -> Dict:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = await client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}],
        )
        text = response.content[0].text
        # Extract JSON from response
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return json.loads(text)
