"""AI extraction service FastAPI application."""

from __future__ import annotations

import structlog
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.extractors.tier1_rules import Tier1Extractor
from app.extractors.tier3_llm import Tier3LLMExtractor

logger = structlog.get_logger()
app = FastAPI(title="TenderOS AI Extraction Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

t1_extractor = Tier1Extractor()
t3_extractor = Tier3LLMExtractor()


class ExtractionRequest(BaseModel):
    text: str
    source_json: dict | None = None


import asyncio
import os

import asyncpg

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        db_url = os.getenv(
            "DATABASE_URL",
            "postgresql://tenderos:tenderos_dev_2026@tenderos-postgres:5432/tenderos",
        )
        _pool = await asyncpg.create_pool(db_url, min_size=1, max_size=5)
    return _pool


@app.on_event("startup")
async def startup_event():
    asyncio.create_task(auto_extraction_loop())


async def auto_extraction_loop():
    """Background job processing raw tender records through Tier 1 / Tier 3 intelligence rules."""
    logger.info("AI Auto-Extraction queue background job started")
    await asyncio.sleep(5)
    while True:
        try:
            pool = await get_pool()
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT id, title, description, lineage, category, source
                    FROM tenders
                    WHERE extracted_attributes IS NULL
                    ORDER BY created_at DESC
                    LIMIT 10
                """
                )
                for r in rows:
                    t_id = str(r["id"])
                    raw_text = f"{r['title'] or ''}\n{r['description'] or ''}"
                    source_json = r["lineage"] or {}
                    try:
                        extracted = t1_extractor.extract(raw_text, source_json)
                        # Add metadata
                        extracted["_auto_extracted"] = True
                        extracted["_extracted_at"] = asyncio.get_event_loop().time()

                        import json

                        await conn.execute(
                            """
                            UPDATE tenders
                            SET extracted_attributes = $1::jsonb
                            WHERE id = $2
                        """,
                            json.dumps(extracted),
                            r["id"],
                        )
                        logger.info(
                            "Successfully auto-extracted attributes for tender",
                            tender_id=t_id,
                        )
                    except Exception as err:
                        logger.warning(
                            "Failed auto-extraction for tender",
                            tender_id=t_id,
                            error=str(err),
                        )
        except Exception as e:
            logger.error("Auto-extraction loop error", error=str(e))
        await asyncio.sleep(30)


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-extraction"}


@app.post("/extract")
async def extract_tender(req: ExtractionRequest):
    logger.info("Starting AI extraction pipeline")
    try:
        # Run Tier 1 rule-based / direct mapping extraction
        t1_result = t1_extractor.extract(req.text, req.source_json)

        # If we have pending fields or low confidence, escalate to Tier 3
        if t1_result.get("_fields_pending") and not req.source_json:
            logger.info(
                "Escalating to Tier 3 LLM extraction",
                pending_fields=t1_result["_fields_pending"],
            )
            t3_result = await t3_extractor.extract(req.text)
            # Merge Tier 3 overrides
            for k, v in t3_result.items():
                if v is not None and not k.startswith("_"):
                    t1_result[k] = v
            t1_result["_extraction_tier"] = 3

        return t1_result
    except Exception as e:
        logger.error("Extraction failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Extraction failed: {e!s}")
