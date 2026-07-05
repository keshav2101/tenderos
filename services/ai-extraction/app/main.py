"""AI extraction service FastAPI application."""
from __future__ import annotations
from typing import Optional, List, Dict
import structlog
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.extractors.tier1_rules import Tier1Extractor
from app.extractors.tier3_llm import Tier3LLMExtractor

logger = structlog.get_logger()
app = FastAPI(title="TenderOS AI Extraction Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

t1_extractor = Tier1Extractor()
t3_extractor = Tier3LLMExtractor()


class ExtractionRequest(BaseModel):
    text: str
    source_json: Optional[Dict] = None


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
            logger.info("Escalating to Tier 3 LLM extraction", pending_fields=t1_result["_fields_pending"])
            t3_result = await t3_extractor.extract(req.text)
            # Merge Tier 3 overrides
            for k, v in t3_result.items():
                if v is not None and not k.startswith("_"):
                    t1_result[k] = v
            t1_result["_extraction_tier"] = 3

        return t1_result
    except Exception as e:
        logger.error("Extraction failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")
