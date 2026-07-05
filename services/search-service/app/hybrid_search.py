"""
Hybrid Search Engine — combines BM25 (OpenSearch) + Semantic (Qdrant) using RRF.
Search latency target: < 300ms.
"""
from __future__ import annotations
import asyncio
import time
from typing import Any, Dict, List, Optional, Tuple

import structlog
from opensearchpy import AsyncOpenSearch
from qdrant_client import AsyncQdrantClient
from sentence_transformers import SentenceTransformer

from app.config import settings
from app.indexing_contract import build_embedding_text, build_tender_document
from app.query_parser import parse_natural_language_query

logger = structlog.get_logger()

# Weights for Reciprocal Rank Fusion
RRF_K = 60  # Standard RRF constant
BM25_WEIGHT = 0.6
SEMANTIC_WEIGHT = 0.4
TENDER_INDEX = "tenders"
TENDER_VECTOR_COLLECTION = "tenders"


def reciprocal_rank_fusion(
    bm25_hits: List[Dict],
    semantic_hits: List[Dict],
    k: int = RRF_K,
) -> List[Tuple[str, float]]:
    """
    Combine BM25 and semantic results using Reciprocal Rank Fusion.
    Returns list of (tender_id, rrf_score) sorted by score descending.
    """
    scores: Dict[str, float] = {}

    for rank, hit in enumerate(bm25_hits, 1):
        tid = hit["_id"]
        scores[tid] = scores.get(tid, 0.0) + BM25_WEIGHT * (1.0 / (k + rank))

    for rank, hit in enumerate(semantic_hits, 1):
        tid = hit.get("id") or hit.get("tender_id")
        scores[tid] = scores.get(tid, 0.0) + SEMANTIC_WEIGHT * (1.0 / (k + rank))

    return sorted(scores.items(), key=lambda x: x[1], reverse=True)


class HybridSearchEngine:
    """
    Three-mode search engine:
    - KEYWORD: Pure BM25 via OpenSearch
    - SEMANTIC: Pure vector via Qdrant
    - HYBRID: BM25 + Semantic with RRF (default)
    - NATURAL_LANGUAGE: Parse NL query → structured query → HYBRID
    """

    def __init__(self):
        self._os: Optional[AsyncOpenSearch] = None
        self._qdrant: Optional[AsyncQdrantClient] = None
        self._embedder: Optional[SentenceTransformer] = None

    def _get_os(self) -> AsyncOpenSearch:
        if self._os is None:
            self._os = AsyncOpenSearch(
                hosts=[{"host": settings.OPENSEARCH_HOST, "port": settings.OPENSEARCH_PORT}],
                http_compress=True,
                use_ssl=False,
            )
        return self._os

    def _get_qdrant(self) -> AsyncQdrantClient:
        if self._qdrant is None:
            self._qdrant = AsyncQdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT,
                api_key=settings.QDRANT_API_KEY,
            )
        return self._qdrant

    def _get_embedder(self) -> SentenceTransformer:
        if self._embedder is None:
            self._embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
        return self._embedder

    def _embed(self, text: str) -> List[float]:
        return self._get_embedder().encode(text, normalize_embeddings=True).tolist()

    async def _ensure_opensearch_index(self) -> None:
        if settings.OPENSEARCH_HOST == "disabled":
            return
        os_client = self._get_os()
        exists = await os_client.indices.exists(index=TENDER_INDEX)
        if exists:
            return
        await os_client.indices.create(
            index=TENDER_INDEX,
            body={
                "settings": {
                    "analysis": {
                        "normalizer": {
                            "lowercase_normalizer": {
                                "type": "custom",
                                "filter": ["lowercase"],
                            }
                        }
                    }
                },
                "mappings": {
                    "properties": {
                        "title": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}},
                        "source": {"type": "keyword"},
                        "source_tender_id": {"type": "keyword"},
                        "ministry": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}},
                        "department": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}},
                        "organisation": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}},
                        "state": {"type": "text", "fields": {"keyword": {"type": "keyword", "normalizer": "lowercase_normalizer"}}},
                        "categories": {"type": "keyword"},
                        "estimated_cost_lakhs": {"type": "float"},
                        "emd_lakhs": {"type": "float"},
                        "submission_deadline": {"type": "date"},
                        "status": {"type": "keyword"},
                        "msme_eligible": {"type": "boolean"},
                        "startup_eligible": {"type": "boolean"},
                        "ai_summary": {"type": "text"},
                    }
                },
            },
        )

    async def _ensure_qdrant_collection(self, vector_size: int) -> None:
        if settings.QDRANT_HOST == "disabled":
            return
        from qdrant_client.models import Distance, VectorParams

        qdrant = self._get_qdrant()
        collections = await qdrant.get_collections()
        if any(c.name == TENDER_VECTOR_COLLECTION for c in collections.collections):
            return
        await qdrant.create_collection(
            collection_name=TENDER_VECTOR_COLLECTION,
            vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE),
        )

    async def index_tender(self, tender: Dict[str, Any]) -> Dict[str, Any]:
        """
        Index a tender into OpenSearch and Qdrant.
        Returns per-backend outcomes; raises if an enabled backend fails.
        """
        document = build_tender_document(tender)
        embedding_text = build_embedding_text(document)
        if not embedding_text:
            raise ValueError("Cannot index tender without searchable text")

        outcomes: Dict[str, Any] = {}

        if settings.OPENSEARCH_HOST == "disabled":
            outcomes["opensearch"] = {"status": "skipped", "reason": "disabled"}
        else:
            await self._ensure_opensearch_index()
            os_client = self._get_os()
            await os_client.index(
                index=TENDER_INDEX,
                id=document["id"],
                body=document,
                refresh=False,
            )
            outcomes["opensearch"] = {"status": "indexed", "index": TENDER_INDEX}

        if settings.QDRANT_HOST == "disabled":
            outcomes["qdrant"] = {"status": "skipped", "reason": "disabled"}
        else:
            from qdrant_client.models import PointStruct

            vector = self._embed(embedding_text)
            await self._ensure_qdrant_collection(len(vector))
            qdrant = self._get_qdrant()
            await qdrant.upsert(
                collection_name=TENDER_VECTOR_COLLECTION,
                points=[
                    PointStruct(
                        id=document["id"],
                        vector=vector,
                        payload=document,
                    )
                ],
            )
            outcomes["qdrant"] = {
                "status": "indexed",
                "collection": TENDER_VECTOR_COLLECTION,
                "vector_size": len(vector),
            }

        return outcomes

    def _build_os_query(
        self, query: str, filters: Dict, page: int, page_size: int
    ) -> Dict:
        """Build OpenSearch query with BM25 + filters."""
        must_clauses = []
        filter_clauses = []

        if query:
            must_clauses.append({
                "multi_match": {
                    "query": query,
                    "fields": [
                        "title^3",
                        "ministry^2",
                        "department^2",
                        "organisation^1.5",
                        "ai_summary",
                        "state",
                    ],
                    "type": "best_fields",
                    "fuzziness": "AUTO",
                }
            })

        # Apply filters
        if filters.get("states"):
            filter_clauses.append({"terms": {"state.keyword": filters["states"]}})
        if filters.get("ministries"):
            filter_clauses.append({"terms": {"ministry.keyword": filters["ministries"]}})
        if filters.get("departments"):
            filter_clauses.append({"terms": {"department.keyword": filters["departments"]}})
        if filters.get("categories"):
            filter_clauses.append({"terms": {"categories": filters["categories"]}})
        if filters.get("status"):
            filter_clauses.append({"term": {"status": filters["status"]}})
        if filters.get("msme_eligible") is not None:
            filter_clauses.append({"term": {"msme_eligible": filters["msme_eligible"]}})
        if filters.get("cost_min_lakhs") or filters.get("cost_max_lakhs"):
            range_q: Dict = {}
            if filters.get("cost_min_lakhs"):
                range_q["gte"] = filters["cost_min_lakhs"]
            if filters.get("cost_max_lakhs"):
                range_q["lte"] = filters["cost_max_lakhs"]
            filter_clauses.append({"range": {"estimated_cost_lakhs": range_q}})
        if filters.get("deadline_from") or filters.get("deadline_to"):
            range_q = {}
            if filters.get("deadline_from"):
                range_q["gte"] = filters["deadline_from"]
            if filters.get("deadline_to"):
                range_q["lte"] = filters["deadline_to"]
            filter_clauses.append({"range": {"submission_deadline": range_q}})

        # Only show active tenders by default
        if not filters.get("status"):
            filter_clauses.append({"term": {"status": "active"}})

        return {
            "query": {
                "bool": {
                    "must": must_clauses or [{"match_all": {}}],
                    "filter": filter_clauses,
                }
            },
            "highlight": {
                "fields": {
                    "title": {"number_of_fragments": 1},
                    "ai_summary": {"number_of_fragments": 2},
                }
            },
            "from": (page - 1) * page_size,
            "size": page_size * 2,  # Fetch more for RRF merging
            "aggs": {
                "states": {"terms": {"field": "state.keyword", "size": 30}},
                "ministries": {"terms": {"field": "ministry.keyword", "size": 30}},
                "categories": {"terms": {"field": "categories", "size": 30}},
                "status": {"terms": {"field": "status", "size": 5}},
            },
        }

    async def _bm25_search(self, query: str, filters: Dict, page: int, size: int) -> Tuple[List, Dict, int]:
        """Execute BM25 search on OpenSearch."""
        if settings.OPENSEARCH_HOST == "disabled":
            return [], {}, 0
        os_query = self._build_os_query(query, filters, page, size)
        os = self._get_os()
        try:
            response = await os.search(index=TENDER_INDEX, body=os_query)
            hits = response["hits"]["hits"]
            total = response["hits"]["total"]["value"]
            facets = {
                name: [{"value": b["key"], "count": b["doc_count"]} for b in agg["buckets"]]
                for name, agg in response.get("aggregations", {}).items()
            }
            return hits, facets, total
        except Exception as e:
            logger.error("OpenSearch BM25 search failed", error=str(e))
            return [], {}, 0

    async def _semantic_search(self, query: str, filters: Dict, limit: int) -> List:
        """Execute vector similarity search on Qdrant."""
        if settings.QDRANT_HOST == "disabled":
            return []
        query_embedding = self._embed(query)
        qdrant = self._get_qdrant()

        # Build Qdrant filter from our filter dict
        from qdrant_client.models import Filter, FieldCondition, MatchValue, MatchAny
        conditions = []
        if filters.get("states"):
            conditions.append(FieldCondition(key="state", match=MatchAny(any=filters["states"])))
        if filters.get("categories"):
            conditions.append(FieldCondition(key="categories", match=MatchAny(any=filters["categories"])))

        qdrant_filter = Filter(must=conditions) if conditions else None

        try:
            results = await qdrant.search(
                collection_name=TENDER_VECTOR_COLLECTION,
                query_vector=query_embedding,
                query_filter=qdrant_filter,
                limit=limit,
                with_payload=True,
                score_threshold=0.25,
            )
            return [{"id": str(r.id), **r.payload, "semantic_score": r.score} for r in results]
        except Exception as e:
            logger.error("Qdrant semantic search failed", error=str(e))
            return []

    async def search(
        self,
        query: str,
        mode: str = "hybrid",
        filters: Optional[Dict] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "relevance",
    ) -> Dict:
        start_time = time.perf_counter()
        filters = filters or {}

        # Natural language query parsing
        if mode == "natural_language":
            parsed = await parse_natural_language_query(query)
            query = parsed.get("query", query)
            # Merge parsed filters with explicit filters
            for k, v in parsed.get("filters", {}).items():
                if v and k not in filters:
                    filters[k] = v
            mode = "hybrid"

        total = 0
        facets = {}
        final_hits = []

        if mode == "keyword":
            hits, facets, total = await self._bm25_search(query, filters, page, page_size)
            final_hits = [self._format_os_hit(h) for h in hits[:page_size]]

        elif mode == "semantic":
            hits = await self._semantic_search(query, filters, page_size * 2)
            total = len(hits)
            final_hits = [self._format_qdrant_hit(h) for h in hits[:page_size]]

        else:  # hybrid (default)
            bm25_task = self._bm25_search(query, filters, 1, page_size * 3)
            semantic_task = self._semantic_search(query, filters, page_size * 3)
            (bm25_hits, facets, total), semantic_hits = await asyncio.gather(
                bm25_task, semantic_task
            )

            # Reciprocal Rank Fusion
            fused = reciprocal_rank_fusion(bm25_hits, semantic_hits)

            # Map back to tender data
            bm25_map = {h["_id"]: h for h in bm25_hits}
            sem_map = {h["id"]: h for h in semantic_hits}

            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size

            for tid, rrf_score in fused[start_idx:end_idx]:
                if tid in bm25_map:
                    hit = self._format_os_hit(bm25_map[tid])
                elif tid in sem_map:
                    hit = self._format_qdrant_hit(sem_map[tid])
                else:
                    continue
                hit["relevance_score"] = round(rrf_score * 100, 2)
                final_hits.append(hit)

            total = max(total, len(fused))

        # Fallback to postgres if OpenSearch and Qdrant are disabled/empty
        if not final_hits:
            logger.info("Falling back to Postgres direct query for search")
            import asyncpg
            import os
            pg_host = os.getenv("POSTGRES_HOST", "postgres")
            pg_port = os.getenv("POSTGRES_PORT", "5432")
            pg_db = os.getenv("POSTGRES_DB", "tenderos")
            pg_user = os.getenv("POSTGRES_USER", "tenderos")
            pg_pwd = os.getenv("POSTGRES_PASSWORD", "")
            try:
                conn = await asyncpg.connect(
                    host=pg_host, port=int(pg_port),
                    database=pg_db, user=pg_user, password=pg_pwd
                )
                offset = (page - 1) * page_size
                conditions = ["status = 'active'"]
                params = []
                param_idx = 1
                
                if query:
                    conditions.append(f"(title ILIKE ${param_idx} OR ministry ILIKE ${param_idx} OR department ILIKE ${param_idx} OR organisation ILIKE ${param_idx} OR ai_summary ILIKE ${param_idx})")
                    params.append(f"%{query}%")
                    param_idx += 1
                
                if filters.get("states") or filters.get("state"):
                    state_filter = filters.get("states") or filters.get("state")
                    states = state_filter if isinstance(state_filter, list) else [state_filter]
                    conditions.append(f"state = ANY(${param_idx})")
                    params.append(states)
                    param_idx += 1
                    
                if filters.get("ministries") or filters.get("ministry"):
                    ministry_filter = filters.get("ministries") or filters.get("ministry")
                    ministries = ministry_filter if isinstance(ministry_filter, list) else [ministry_filter]
                    conditions.append(f"ministry = ANY(${param_idx})")
                    params.append(ministries)
                    param_idx += 1

                if filters.get("departments") or filters.get("department"):
                    dept_filter = filters.get("departments") or filters.get("department")
                    depts = dept_filter if isinstance(dept_filter, list) else [dept_filter]
                    conditions.append(f"department = ANY(${param_idx})")
                    params.append(depts)
                    param_idx += 1

                if filters.get("categories") or filters.get("category"):
                    cats = filters.get("categories") or filters.get("category")
                    cats_list = cats if isinstance(cats, list) else [cats]
                    conditions.append(f"categories && ${param_idx}")
                    params.append(cats_list)
                    param_idx += 1

                if filters.get("cost_min_lakhs") is not None or filters.get("estimated_cost_min") is not None:
                    min_cost = filters.get("cost_min_lakhs") or filters.get("estimated_cost_min")
                    conditions.append(f"estimated_cost_lakhs >= ${param_idx}")
                    params.append(float(min_cost))
                    param_idx += 1
                if filters.get("cost_max_lakhs") is not None or filters.get("estimated_cost_max") is not None:
                    max_cost = filters.get("cost_max_lakhs") or filters.get("estimated_cost_max")
                    conditions.append(f"estimated_cost_lakhs <= ${param_idx}")
                    params.append(float(max_cost))
                    param_idx += 1

                if filters.get("deadline_from"):
                    from datetime import datetime
                    d_from = datetime.fromisoformat(filters["deadline_from"].replace("Z", "+00:00")).replace(tzinfo=None)
                    conditions.append(f"submission_deadline >= ${param_idx}")
                    params.append(d_from)
                    param_idx += 1
                if filters.get("deadline_to"):
                    from datetime import datetime
                    d_to = datetime.fromisoformat(filters["deadline_to"].replace("Z", "+00:00")).replace(tzinfo=None)
                    conditions.append(f"submission_deadline <= ${param_idx}")
                    params.append(d_to)
                    param_idx += 1
                
                where_clause = " AND ".join(conditions)
                
                fetch_query = f"""
                    SELECT id, title, ministry, department, organisation, state,
                           categories, estimated_cost_lakhs, emd_lakhs,
                           submission_deadline, status, source, ai_summary
                    FROM tenders
                    WHERE {where_clause}
                    ORDER BY submission_deadline DESC
                    LIMIT ${param_idx} OFFSET ${param_idx + 1}
                """
                
                count_query = f"SELECT COUNT(*) FROM tenders WHERE {where_clause}"
                
                rows = await conn.fetch(fetch_query, *params, page_size, offset)
                count_row = await conn.fetchrow(count_query, *params)
                total = count_row[0] if count_row else 0
                await conn.close()


                for r in rows:
                    hit = {
                        "tender_id": str(r["id"]),
                        "title": r["title"],
                        "ministry": r["ministry"],
                        "department": r["department"],
                        "organisation": r["organisation"],
                        "state": r["state"],
                        "categories": r["categories"] or [],
                        "estimated_cost_lakhs": float(r["estimated_cost_lakhs"]) if r["estimated_cost_lakhs"] is not None else None,
                        "emd_lakhs": float(r["emd_lakhs"]) if r["emd_lakhs"] is not None else None,
                        "submission_deadline": r["submission_deadline"].isoformat() if r["submission_deadline"] else None,
                        "status": r["status"],
                        "source": r["source"],
                        "ai_summary": r["ai_summary"],
                        "relevance_score": 100.0,
                        "highlights": {}
                    }
                    final_hits.append(hit)
            except Exception as ex:
                logger.error("Postgres fallback search failed", error=str(ex))

        query_time_ms = int((time.perf_counter() - start_time) * 1000)


        return {
            "hits": final_hits,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": max(1, (total + page_size - 1) // page_size),
            "query_time_ms": query_time_ms,
            "search_mode_used": mode,
            "facets": facets,
        }

    def _format_os_hit(self, hit: Dict) -> Dict:
        src = hit.get("_source", {})
        highlights = {k: v for k, v in hit.get("highlight", {}).items()}
        return {
            "tender_id": hit["_id"],
            "title": src.get("title", ""),
            "ministry": src.get("ministry"),
            "department": src.get("department"),
            "organisation": src.get("organisation"),
            "state": src.get("state"),
            "categories": src.get("categories", []),
            "estimated_cost_lakhs": src.get("estimated_cost_lakhs"),
            "emd_lakhs": src.get("emd_lakhs"),
            "submission_deadline": src.get("submission_deadline"),
            "status": src.get("status", "active"),
            "msme_eligible": src.get("msme_eligible", False),
            "source": src.get("source", ""),
            "ai_summary": src.get("ai_summary"),
            "relevance_score": round(hit.get("_score", 0) * 10, 2),
            "highlights": highlights,
        }

    def _format_qdrant_hit(self, hit: Dict) -> Dict:
        return {
            "tender_id": hit.get("id") or hit.get("tender_id", ""),
            "title": hit.get("title", ""),
            "ministry": hit.get("ministry"),
            "department": hit.get("department"),
            "organisation": hit.get("organisation"),
            "state": hit.get("state"),
            "categories": hit.get("categories", []),
            "estimated_cost_lakhs": hit.get("estimated_cost_lakhs"),
            "emd_lakhs": hit.get("emd_lakhs"),
            "submission_deadline": hit.get("submission_deadline"),
            "status": hit.get("status", "active"),
            "msme_eligible": hit.get("msme_eligible", False),
            "source": hit.get("source", ""),
            "ai_summary": hit.get("ai_summary"),
            "relevance_score": round(hit.get("semantic_score", 0) * 100, 2),
            "highlights": {},
        }
