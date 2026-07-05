"""OCR service FastAPI application."""
from __future__ import annotations
from typing import Optional, List, Dict
import io

import structlog
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.pdf_processor import PDFProcessor

logger = structlog.get_logger()
app = FastAPI(title="TenderOS OCR Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

processor = PDFProcessor()


@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ocr-service"}


@app.post("/ocr/process")
async def process_pdf(file: UploadFile = File(...)):
    logger.info("Processing PDF via OCR service", filename=file.filename)
    try:
        pdf_bytes = await file.read()
        result = processor.extract(pdf_bytes)
        return result
    except Exception as e:
        logger.error("Failed to process PDF", filename=file.filename, error=str(e))
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {str(e)}")
