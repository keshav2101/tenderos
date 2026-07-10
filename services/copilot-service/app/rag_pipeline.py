"""
Tender Copilot RAG Pipeline
Answers user questions about specific tenders by:
1. Retrieving relevant document chunks from Qdrant
2. Assembling context with source citations
3. Generating answers with page/clause references using a cloud LLM
"""
from __future__ import annotations
import json
from typing import Dict, List, Optional, Tuple
from uuid import UUID

import structlog
from qdrant_client import AsyncQdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

from app.config import settings
from app.llm_client import LLMClient

CHUNK_COLLECTION = "tender_chunks"

logger = structlog.get_logger()

COPILOT_SYSTEM_PROMPT = """You are TenderOS Copilot, an expert AI assistant for Indian government procurement tenders.

You answer questions about a specific tender based ONLY on the provided document excerpts.
You must:
1. Answer directly and concisely
2. Cite the source section/page for every factual claim: [Page X] or [Section Y.Z] or [Clause Z]
3. If the information is not in the provided excerpts, say "This information was not found in the provided tender documents."
4. Use Indian procurement terminology correctly (EMD, NIT, BOQ, L1, MSME, etc.)
5. Never make up information not present in the excerpts
6. For amounts, always specify the unit (₹, Lakhs, Crores)

Format: Provide a clear, structured answer. Use bullet points for lists. Always cite sources."""

COPILOT_USER_PROMPT = """Tender: {tender_title}
Ministry: {ministry}

Document excerpts (with page references):
---
{context}
---

User question: {question}

Answer (with citations):"""


class CopilotRAGPipeline:
    """
    RAG pipeline for per-tender Q&A.
    Chunks are stored in Qdrant's 'tender_chunks' collection.
    """

    def __init__(self):
        self._qdrant: Optional[AsyncQdrantClient] = None
        self._embedding_model: Optional[Any] = None
        self._llm = LLMClient()

    async def _get_qdrant(self) -> AsyncQdrantClient:
        if self._qdrant is None:
            self._qdrant = AsyncQdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=settings.QDRANT_API_KEY,
            )
        return self._qdrant

    def _get_embedder(self) -> Any:
        if self._embedding_model is None:
            from sentence_transformers import SentenceTransformer
            self._embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        return self._embedding_model

    def _embed(self, text: str) -> List[float]:
        embedder = self._get_embedder()
        return embedder.encode(text, normalize_embeddings=True).tolist()

    async def _ensure_chunk_collection(self, vector_size: int) -> None:
        from qdrant_client.models import Distance, VectorParams

        qdrant = await self._get_qdrant()
        collections = await qdrant.get_collections()
        if any(c.name == CHUNK_COLLECTION for c in collections.collections):
            return
        await qdrant.create_collection(
            collection_name=CHUNK_COLLECTION,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )

    async def retrieve_chunks(
        self, tender_id: str, query: str, top_k: int = 5
    ) -> List[Dict]:
        # Fallback to PostgreSQL if Qdrant is disabled
        if settings.QDRANT_HOST == "disabled":
            logger.info("Qdrant is disabled; retrieving chunks from PostgreSQL fallback", tender_id=tender_id)
            import asyncpg
            from uuid import UUID
            try:
                conn = await asyncpg.connect(
                    host=settings.POSTGRES_HOST,
                    port=settings.POSTGRES_PORT,
                    database=settings.POSTGRES_DB,
                    user=settings.POSTGRES_USER,
                    password=settings.POSTGRES_PASSWORD
                )
                
                # Retrieve chunks with keyword matching (ILIKE) on query, or matching tender_id
                # Filter by keyword if provided, otherwise return first top_k chunks
                if query and len(query.strip()) > 1:
                    rows = await conn.fetch(
                        """
                        SELECT content, page, document_name FROM tender_document_chunks
                        WHERE tender_id = $1 AND content ILIKE $2
                        ORDER BY page ASC, chunk_index ASC
                        LIMIT $3
                        """,
                        UUID(tender_id), f"%{query}%", top_k
                    )
                else:
                    rows = []
                    
                # If no matching keywords found, return first few chunks as general context
                if not rows:
                    rows = await conn.fetch(
                        """
                        SELECT content, page, document_name FROM tender_document_chunks
                        WHERE tender_id = $1
                        ORDER BY page ASC, chunk_index ASC
                        LIMIT $2
                        """,
                        UUID(tender_id), top_k
                    )
                await conn.close()
                
                chunks = []
                for row in rows:
                    chunks.append({
                        "text": row["content"],
                        "page": str(row["page"]),
                        "section": "",
                        "doc_type": "notice",
                        "document_name": row["document_name"] or "notice.pdf",
                        "score": 1.0  # mock fallback score
                    })
                return chunks
            except Exception as pg_err:
                logger.error("PostgreSQL chunk retrieval failed", error=str(pg_err))
                return []

        try:
            query_embedding = self._embed(query)
            qdrant = await self._get_qdrant()

            results = await qdrant.search(
                collection_name=CHUNK_COLLECTION,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[FieldCondition(key="tender_id", match=MatchValue(value=tender_id))]
                ),
                limit=top_k,
                with_payload=True,
                score_threshold=0.3,  # Minimum relevance threshold
            )

            chunks = []
            for hit in results:
                payload = hit.payload or {}
                chunks.append({
                    "text": payload.get("text") or payload.get("content", ""),
                    "page": payload.get("page", "?"),
                    "section": payload.get("section", ""),
                    "doc_type": payload.get("doc_type", ""),
                    "document_name": payload.get("document_name", "tender_spec.pdf"),
                    "score": hit.score,
                })
            return chunks
        except Exception as e:
            logger.error("Qdrant retrieval failed, falling back to empty results", error=str(e))
            return []



    def _build_context(self, chunks: List[Dict]) -> str:
        """Format retrieved chunks into context string with citations."""
        parts = []
        for i, chunk in enumerate(chunks, 1):
            doc_ref = f"[Doc: {chunk.get('document_name', 'tender_spec.pdf')}]"
            page_ref = f"[Page {chunk['page']}]" if chunk['page'] != "?" else ""
            section_ref = f"[{chunk['section']}]" if chunk['section'] else ""
            ref = f"{doc_ref}{page_ref}{section_ref}".strip()
            parts.append(f"Excerpt {i} {ref}:\n{chunk['text']}")
        return "\n\n---\n\n".join(parts)

    async def answer(
        self,
        tender_id: str,
        tender_title: str,
        ministry: str,
        question: str,
        conversation_history: Optional[List[Dict]] = None,
    ) -> Dict:
        """
        Answer a user question about a tender using RAG.
        Returns the answer text, source citations, and retrieved chunks.
        """
        # Retrieve relevant chunks
        chunks = await self.retrieve_chunks(tender_id, question, top_k=settings.RAG_TOP_K)

        if not chunks:
            return {
                "answer": (
                    "I could not find relevant information in the tender documents to answer this question. "
                    "The tender documents may not have been processed yet, or this information may not be present."
                ),
                "sources": [],
                "chunks_used": 0,
            }

        context = self._build_context(chunks)

        # Build messages for LLM
        messages = [{"role": "system", "content": COPILOT_SYSTEM_PROMPT}]

        # Add conversation history (last 5 turns)
        if conversation_history:
            for turn in conversation_history[-5:]:
                messages.append({"role": turn["role"], "content": turn["content"]})

        messages.append({
            "role": "user",
            "content": COPILOT_USER_PROMPT.format(
                tender_title=tender_title,
                ministry=ministry,
                context=context,
                question=question,
            ),
        })

        answer_text = await self._llm.chat(messages)

        # Extract citations from chunks
        sources = [
            {
                "page": chunk["page"],
                "section": chunk["section"],
                "doc_type": chunk["doc_type"],
                "relevance_score": round(chunk["score"], 3),
            }
            for chunk in chunks
        ]

        return {
            "answer": answer_text,
            "sources": sources,
            "chunks_used": len(chunks),
        }

    async def index_tender_documents(
        self, tender_id: str, document_text: str, doc_type: str = "notice", page_data: List[Dict] = None
    ):
        """
        Index a tender document into Qdrant for RAG retrieval.
        Splits document into overlapping chunks with page references.
        """
        from app.chunker import chunk_document
        qdrant = await self._get_qdrant()

        chunks = chunk_document(
            text=document_text,
            tender_id=tender_id,
            doc_type=doc_type,
            page_data=page_data,
            chunk_size=settings.RAG_CHUNK_SIZE,
            overlap=settings.RAG_CHUNK_OVERLAP,
        )

        if not chunks:
            return

        # Batch embed and upsert
        from qdrant_client.models import PointStruct
        points = []
        for chunk in chunks:
            embedding = self._embed(chunk["text"])
            if not points:
                await self._ensure_chunk_collection(len(embedding))
            points.append(
                PointStruct(
                    id=chunk["id"],
                    vector=embedding,
                    payload=chunk,
                )
            )

        await qdrant.upsert(collection_name=CHUNK_COLLECTION, points=points)
        logger.info("Indexed tender document chunks", tender_id=tender_id, chunks=len(points))
