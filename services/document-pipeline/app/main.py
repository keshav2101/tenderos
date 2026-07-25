"""Document pipeline service handling text chunking and vector indexing."""

from __future__ import annotations

import asyncio
import hashlib
import os
import re
from datetime import datetime
from uuid import UUID, uuid4

import httpx
import structlog
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from qdrant_client import QdrantClient
from qdrant_client.http import models

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None


logger = structlog.get_logger()
app = FastAPI(title="TenderOS Document Pipeline")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant")
QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY") or None
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBEDDING_DIMENSION = int(os.getenv("EMBEDDING_DIMENSION", "384"))
if QDRANT_HOST != "disabled":
    qdrant_client = QdrantClient(
        host=QDRANT_HOST, port=QDRANT_PORT, api_key=QDRANT_API_KEY
    )
else:
    qdrant_client = None
COLLECTION_NAME = "tender_chunks"

_pool = None
_embedder = None


async def get_pool():
    global _pool
    if _pool is None:
        import asyncpg

        pg_host = os.getenv("POSTGRES_HOST", "postgres")
        pg_port = os.getenv("POSTGRES_PORT", "5432")
        pg_db = os.getenv("POSTGRES_DB", "tenderos")
        pg_user = os.getenv("POSTGRES_USER", "tenderos")
        pg_pwd = os.getenv("POSTGRES_PASSWORD", "tenderos_local_pwd")
        _pool = await asyncpg.create_pool(
            host=pg_host,
            port=int(pg_port),
            database=pg_db,
            user=pg_user,
            password=pg_pwd,
            min_size=1,
            max_size=10,
        )
    return _pool


class DocumentProcessRequest(BaseModel):
    tender_id: str
    document_url: str
    document_name: str


@app.on_event("startup")
async def startup_event():
    # Ensure persistence databases have required state tracking columns
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS document_status VARCHAR(50) DEFAULT 'QUEUED';
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS current_state VARCHAR(50) DEFAULT 'QUEUED';
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS embedding_status VARCHAR(50) DEFAULT 'pending';
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS last_processed TIMESTAMPTZ;
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS processing_errors TEXT;
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS failure_reason TEXT;
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS last_successful_stage VARCHAR(100);
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS processing_duration_ms INT;
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS ocr_confidence_score DECIMAL(5,4);
            ALTER TABLE tender_documents ADD COLUMN IF NOT EXISTS embedding_model_version VARCHAR(255);
        """
        )

    # Qdrant Setup
    if not qdrant_client:
        logger.info("Qdrant indexing is disabled via config")
        return
    try:
        collections = qdrant_client.get_collections()
        exists = any(c.name == COLLECTION_NAME for c in collections.collections)
        if not exists:
            qdrant_client.recreate_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=EMBEDDING_DIMENSION, distance=models.Distance.COSINE
                ),
            )
        logger.info("Created Qdrant collection", name=COLLECTION_NAME)
    except Exception as e:
        logger.error("Failed to connect or create Qdrant collection", error=str(e))

    # Launch background document auto-fetcher worker
    asyncio.create_task(auto_fetch_documents_loop())


async def auto_fetch_documents_loop():
    """Background job automatically crawling and processing PDFs for newly ingested tenders."""
    logger.info("Document auto-fetcher background job started")
    # Wait initial 10s for startup
    await asyncio.sleep(10)
    while True:
        try:
            pool = await get_pool()
            async with pool.acquire() as conn:
                # Find tenders that do not yet have a record in tender_documents
                rows = await conn.fetch(
                    """
                    SELECT t.id, t.source, t.source_tender_id, t.source_url, t.lineage
                    FROM tenders t
                    LEFT JOIN tender_documents td ON t.id = td.tender_id
                    WHERE td.id IS NULL AND t.source_url IS NOT NULL AND t.source_url != ''
                    ORDER BY t.created_at DESC
                    LIMIT 5
                """
                )
                for r in rows:
                    t_id = str(r["id"])
                    doc_url = r["source_url"]
                    lineage = r["lineage"] or {}
                    doc_urls = lineage.get("document_urls") or [doc_url]
                    target_url = doc_urls[0] if doc_urls else doc_url
                    doc_name = f"{r['source_tender_id'].replace('/', '_')}_spec.pdf"

                    try:
                        logger.info(
                            "Auto-fetcher processing document for tender",
                            tender_id=t_id,
                            url=target_url,
                        )
                        req = DocumentProcessRequest(
                            tender_id=t_id,
                            document_url=target_url,
                            document_name=doc_name,
                        )
                        await process_document(req)
                    except Exception as err:
                        logger.warning(
                            "Auto-fetcher document process failed",
                            tender_id=t_id,
                            error=str(err),
                        )
        except Exception as e:
            logger.error("Auto-fetcher loop error", error=str(e))
        await asyncio.sleep(60)


def get_embedding(text: str) -> list[float]:
    """Generate a production embedding using the configured sentence-transformer."""
    global _embedder
    if _embedder is None:
        if SentenceTransformer is None:
            raise ImportError(
                "sentence-transformers is not installed. Enable Qdrant/SentenceTransformers in config."
            )
        _embedder = SentenceTransformer(EMBEDDING_MODEL)
    return _embedder.encode(text, normalize_embeddings=True).tolist()


def split_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> list[str]:
    """Splits text into chunks with overlap."""
    if not text:
        return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks


async def update_state(
    conn,
    doc_id,
    state,
    last_success_stage=None,
    failure_reason=None,
    extra_updates=None,
):
    """Helper to update document status in PostgreSQL."""
    query = """
        UPDATE tender_documents
        SET current_state = $1,
            document_status = $1,
            last_processed = NOW()
    """
    params = [state]
    param_idx = 2

    if last_success_stage:
        query += f", last_successful_stage = ${param_idx}"
        params.append(last_success_stage)
        param_idx += 1

    if failure_reason:
        query += f", failure_reason = ${param_idx}, processing_errors = ${param_idx}"
        params.append(failure_reason)
        param_idx += 1

    if extra_updates:
        for col, val in extra_updates.items():
            query += f", {col} = ${param_idx}"
            params.append(val)
            param_idx += 1

    query += f" WHERE id = ${param_idx}"
    params.append(doc_id)

    await conn.execute(query, *params)


@app.post("/document/process")
async def process_document(req: DocumentProcessRequest):
    logger.info(
        "Starting Document State Machine pipeline",
        tender_id=req.tender_id,
        name=req.document_name,
    )
    start_time = datetime.utcnow()

    pool = await get_pool()
    doc_id = None

    # 1. QUEUED State Initiation
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM tender_documents WHERE tender_id = $1 AND filename = $2",
            UUID(req.tender_id),
            req.document_name,
        )
        if not row:
            doc_id = uuid4()
            await conn.execute(
                """
                INSERT INTO tender_documents (id, tender_id, filename, storage_path, doc_type, ocr_status, document_status, current_state)
                VALUES ($1, $2, $3, $4, 'technical_spec', 'pending', 'QUEUED', 'QUEUED')
                """,
                doc_id,
                UUID(req.tender_id),
                req.document_name,
                f"tenders/{req.tender_id}/{req.document_name}",
            )
        else:
            doc_id = row["id"]
            await update_state(conn, doc_id, "QUEUED")

    # 2. DOWNLOADING State
    async with pool.acquire() as conn:
        await update_state(conn, doc_id, "DOWNLOADING")

    pdf_bytes = None
    max_retries = 3
    retries_run = 0
    for attempt in range(max_retries):
        retries_run = attempt
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.get(req.document_url)
                if resp.status_code == 200:
                    pdf_bytes = resp.content
                    break
        except Exception as e:
            logger.warning(
                "Connection failure during document download",
                error=str(e),
                attempt=attempt,
            )
        await asyncio.sleep(2**attempt)

    if not pdf_bytes:
        async with pool.acquire() as conn:
            await update_state(
                conn,
                doc_id,
                "FAILED",
                failure_reason="Document download failed after retries",
                extra_updates={"retry_count": retries_run},
            )
        raise HTTPException(status_code=502, detail="Document download failed")

    # 3. DOWNLOADED & Checksum Validation
    sha256_hash = hashlib.sha256(pdf_bytes).hexdigest()
    async with pool.acquire() as conn:
        # Check for duplicates
        dup_row = await conn.fetchrow(
            "SELECT id, filename FROM tender_documents WHERE file_hash = $1 AND id != $2",
            sha256_hash,
            doc_id,
        )
        if dup_row:
            await update_state(
                conn,
                doc_id,
                "FAILED",
                failure_reason=f"Duplicate document checksum matches: {dup_row['filename']}",
            )
            return {
                "status": "failed",
                "reason": "Duplicate checksum hash",
                "duplicate_of": dup_row["filename"],
            }

        await update_state(
            conn,
            doc_id,
            "DOWNLOADED",
            last_success_stage="DOWNLOAD",
            extra_updates={"file_hash": sha256_hash, "file_size_bytes": len(pdf_bytes)},
        )

    # 4. OCR_RUNNING
    async with pool.acquire() as conn:
        await update_state(conn, doc_id, "OCR_RUNNING")

    extracted_text = ""
    pages_list = []
    ocr_success = False
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                files = {"file": (req.document_name, pdf_bytes, "application/pdf")}
                ocr_resp = await client.post(
                    f"{os.getenv('OCR_SERVICE_URL', 'http://ocr-service:8006')}/ocr/process",
                    files=files,
                )
                if ocr_resp.status_code == 200:
                    ocr_data = ocr_resp.json()
                    extracted_text = ocr_data.get("full_text", "")
                    pages_list = ocr_data.get("pages", [])
                    ocr_success = True
                    break
        except Exception as e:
            logger.warning(
                "OCR service processing timeout/error", error=str(e), attempt=attempt
            )
        await asyncio.sleep(2**attempt)

    if not ocr_success:
        async with pool.acquire() as conn:
            await update_state(
                conn,
                doc_id,
                "FAILED",
                failure_reason="OCR processing failed after multiple attempts",
            )
        raise HTTPException(status_code=502, detail="OCR service failed")

    # 5. OCR_COMPLETE
    async with pool.acquire() as conn:
        await update_state(conn, doc_id, "OCR_COMPLETE", last_success_stage="OCR")

    # 6. TEXT_VALIDATED
    cleaned_text = re.sub(r"\s+", " ", extracted_text).strip()
    if len(cleaned_text) < 5:
        async with pool.acquire() as conn:
            await update_state(
                conn, doc_id, "FAILED", failure_reason="Validated text length too short"
            )
        return {"status": "failed", "reason": "Empty extracted text"}

    async with pool.acquire() as conn:
        await update_state(
            conn, doc_id, "TEXT_VALIDATED", last_success_stage="TEXT_CLEANING"
        )

    # 7. CHUNKED
    points = []
    chunk_idx = 0
    for page in pages_list:
        p_num = page.get("page", 1)
        p_text = page.get("text", "")
        chunks = split_text(p_text, chunk_size=300, overlap=50)
        for chunk in chunks:
            points.append(
                {
                    "id": str(uuid4()),
                    "chunk_index": chunk_idx,
                    "page": p_num,
                    "content": chunk,
                }
            )
            chunk_idx += 1

    async with pool.acquire() as conn:
        await update_state(
            conn,
            doc_id,
            "CHUNKED",
            last_success_stage="CHUNKING",
            extra_updates={"page_count": len(pages_list)},
        )

    # 8. EMBEDDINGS_CREATED & INDEXED
    async with pool.acquire() as conn:
        await update_state(conn, doc_id, "EMBEDDINGS_CREATED")

        # Always maintain PostgreSQL chunk fallback for Copilot if Qdrant is unavailable.
        await conn.execute(
            "DELETE FROM tender_document_chunks WHERE tender_id = $1",
            UUID(req.tender_id),
        )
        for pt in points:
            await conn.execute(
                """
                INSERT INTO tender_document_chunks (id, tender_id, document_name, chunk_index, page, content)
                VALUES ($1, $2, $3, $4, $5, $6)
                """,
                UUID(pt["id"]),
                UUID(req.tender_id),
                req.document_name,
                pt["chunk_index"],
                pt["page"],
                pt["content"],
            )

        if qdrant_client:
            qdrant_points = []
            for pt in points:
                embedding = get_embedding(pt["content"])
                qdrant_points.append(
                    models.PointStruct(
                        id=pt["id"],
                        vector=embedding,
                        payload={
                            "tender_id": req.tender_id,
                            "document_name": req.document_name,
                            "chunk_index": pt["chunk_index"],
                            "page": pt["page"],
                            "section": "",
                            "doc_type": "technical_spec",
                            "text": pt["content"],
                            "content": pt["content"],
                        },
                    )
                )
            qdrant_client.upsert(collection_name=COLLECTION_NAME, points=qdrant_points)

        # 9. READY
        duration_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)
        await update_state(
            conn,
            doc_id,
            "READY",
            last_success_stage="INDEXING",
            extra_updates={
                "processing_duration_ms": duration_ms,
                "ocr_confidence_score": 0.95,
                "embedding_model_version": EMBEDDING_MODEL,
                "embedding_status": "done",
            },
        )

    return {
        "status": "completed",
        "doc_id": str(doc_id),
        "chunks_indexed": len(points),
        "tender_id": req.tender_id,
    }


@app.get("/health")
async def health():
    """Health check endpoint — verifies Postgres and Qdrant connectivity."""
    checks: dict = {"service": "document-pipeline", "status": "healthy"}
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        checks["postgres"] = "ok"
    except Exception as exc:
        checks["postgres"] = f"error: {exc}"
        checks["status"] = "degraded"
    try:
        if qdrant_client is not None:
            qdrant_client.get_collections()
            checks["qdrant"] = "ok"
        else:
            checks["qdrant"] = "disabled"
    except Exception as exc:
        checks["qdrant"] = f"error: {exc}"
        checks["status"] = "degraded"
    return checks


@app.get("/metrics")
async def metrics():
    """Prometheus-compatible metrics stub."""
    return {
        "service": "document-pipeline",
        "documents_processed_total": 0,
        "chunks_indexed_total": 0,
        "processing_errors_total": 0,
    }
