"""Copilot service FastAPI application."""
from __future__ import annotations
from typing import Optional, List, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import structlog

from app.config import settings
from app.rag_pipeline import CopilotRAGPipeline

logger = structlog.get_logger()

app = FastAPI(title="TenderOS Copilot Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

rag = CopilotRAGPipeline()


async def _fetch_tender_context(tender_id: str) -> Dict[str, str]:
    """
    Fetch tender title and ministry from tender-service.
    Returns fallback values on failure so copilot degrades gracefully.
    """
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"{settings.TENDER_SERVICE_URL}/tenders/{tender_id}/summary"
            )
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "title": data.get("title", "Unknown Tender"),
                    "ministry": data.get("ministry", "Government of India"),
                }
    except Exception as e:
        logger.warning("Could not fetch tender context", tender_id=tender_id, error=str(e))
    return {"title": "Unknown Tender", "ministry": "Government of India"}


class ChatRequest(BaseModel):
    tender_id: str
    message: str
    conversation_id: Optional[str] = None
    user_id: str


class IndexRequest(BaseModel):
    tender_id: str
    document_text: str
    doc_type: Optional[str] = "notice"
    page_data: Optional[List[Dict]] = None


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "copilot-service"}


@app.post("/chat/{tender_id}")
async def chat(tender_id: str, req: ChatRequest):
    import os
    from datetime import datetime
    # Fetch real tender context (title + ministry) from tender-service
    context = await _fetch_tender_context(tender_id)
    tender_title = context["title"]
    tender_ministry = context["ministry"]

    result = await rag.answer(
        tender_id=tender_id,
        tender_title=tender_title,
        ministry=tender_ministry,
        question=req.message,
    )
    result["conversation_id"] = req.conversation_id or "conv-default"
    result["tender_title"] = tender_title
    result["ministry"] = tender_ministry

    # Write structural audit log
    logger.info(
        "Copilot RAG Query Audit",
        tender_id=tender_id,
        tender_title=tender_title,
        question=req.message,
        answer=result.get("answer"),
        chunks_used=result.get("chunks_used"),
        sources=result.get("sources"),
        confidence=result.get("confidence") or 0.0,
        conversation_id=result["conversation_id"]
    )

    # Write file audit log
    try:
        os.makedirs("logs", exist_ok=True)
        with open("logs/copilot_audit.log", "a") as f:
            f.write(f"[{datetime.utcnow().isoformat()}] TENDER_ID: {tender_id} | Q: {req.message} | A: {result.get('answer')[:100]}... | CONFIDENCE: {result.get('confidence')} | SOURCES: {result.get('sources')}\n")
    except Exception as audit_err:
        logger.warning("Failed to write to copilot_audit.log", error=str(audit_err))

    return result



@app.post("/index")
async def index_document(req: IndexRequest):
    await rag.index_tender_documents(
        tender_id=req.tender_id,
        document_text=req.document_text,
        doc_type=req.doc_type or "notice",
        page_data=req.page_data,
    )
    return {"status": "success", "message": "Document indexed successfully"}

