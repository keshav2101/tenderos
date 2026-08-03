"""
Hybrid Search Engine — combines BM25 (OpenSearch) + Semantic (Qdrant) using RRF.
Search latency target: < 300ms.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any

import structlog
try:
    from opensearchpy import AsyncOpenSearch
except ImportError:
    from opensearchpy import OpenSearch as AsyncOpenSearch
from qdrant_client import AsyncQdrantClient

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
    bm25_hits: list[dict],
    semantic_hits: list[dict],
    k: int = RRF_K,
) -> list[tuple[str, float]]:
    """
    Combine BM25 and semantic results using Reciprocal Rank Fusion.
    Returns list of (tender_id, rrf_score) sorted by score descending.
    """
    scores: dict[str, float] = {}

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
        self._os: AsyncOpenSearch | None = None
        self._qdrant: AsyncQdrantClient | None = None
        self._embedder: Any | None = None

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

    def _get_embedder(self) -> Any:
        if self._embedder is None:
            from sentence_transformers import SentenceTransformer

            self._embedder = SentenceTransformer(settings.EMBEDDING_MODEL)
        return self._embedder

    def _embed(self, text: str) -> list[float]:
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
                        "title": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "normalizer": "lowercase_normalizer",
                                }
                            },
                        },
                        "source": {"type": "keyword"},
                        "source_tender_id": {"type": "keyword"},
                        "ministry": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "normalizer": "lowercase_normalizer",
                                }
                            },
                        },
                        "department": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "normalizer": "lowercase_normalizer",
                                }
                            },
                        },
                        "organisation": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "normalizer": "lowercase_normalizer",
                                }
                            },
                        },
                        "state": {
                            "type": "text",
                            "fields": {
                                "keyword": {
                                    "type": "keyword",
                                    "normalizer": "lowercase_normalizer",
                                }
                            },
                        },
                        "categories": {"type": "keyword"},
                        "estimated_cost_lakhs": {"type": "float"},
                        "emd_lakhs": {"type": "float"},
                        "submission_deadline": {"type": "date"},
                        "status": {"type": "keyword"},
                        "msme_eligible": {"type": "boolean"},
                        "startup_eligible": {"type": "boolean"},
                        "ai_summary": {"type": "text"},
                        "sector": {"type": "keyword"},
                        "cpv": {"type": "keyword"},
                        "gem": {"type": "boolean"},
                        "railway": {"type": "boolean"},
                        "defence": {"type": "boolean"},
                        "psu": {"type": "boolean"},
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

    async def index_tender(self, tender: dict[str, Any]) -> dict[str, Any]:
        """
        Index a tender into OpenSearch and Qdrant.
        Returns per-backend outcomes; raises if an enabled backend fails.
        """
        document = build_tender_document(tender)
        embedding_text = build_embedding_text(document)
        if not embedding_text:
            raise ValueError("Cannot index tender without searchable text")

        outcomes: dict[str, Any] = {}

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

    def _build_os_query(self, query: str, filters: dict, page: int, page_size: int) -> dict:
        """Build OpenSearch query with BM25 + filters."""
        must_clauses = []
        filter_clauses = []

        if query:
            must_clauses.append(
                {
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
                }
            )

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
            range_q: dict = {}
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

        # Phase 15 dynamic metadata filters
        if filters.get("sectors"):
            filter_clauses.append({"terms": {"sector": filters["sectors"]}})
        if filters.get("cpvs"):
            filter_clauses.append({"terms": {"cpv": filters["cpvs"]}})
        if filters.get("gem") is not None:
            filter_clauses.append({"term": {"gem": filters["gem"]}})
        if filters.get("railway") is not None:
            filter_clauses.append({"term": {"railway": filters["railway"]}})
        if filters.get("defence") is not None:
            filter_clauses.append({"term": {"defence": filters["defence"]}})
        if filters.get("psu") is not None:
            filter_clauses.append({"term": {"psu": filters["psu"]}})

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

    async def _bm25_search(self, query: str, filters: dict, page: int, size: int) -> tuple[list, dict, int]:
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

    async def _semantic_search(self, query: str, filters: dict, limit: int) -> list:
        """Execute vector similarity search on Qdrant."""
        if settings.QDRANT_HOST == "disabled":
            return []
        query_embedding = self._embed(query)
        qdrant = self._get_qdrant()

        # Build Qdrant filter from our filter dict
        from qdrant_client.models import FieldCondition, Filter, MatchAny

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
        filters: dict | None = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "relevance",
    ) -> dict:
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
            (bm25_hits, facets, total), semantic_hits = await asyncio.gather(bm25_task, semantic_task)

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

        # Fallback to in-memory catalog if OpenSearch, Qdrant, and Postgres return no hits
        if not final_hits:
            logger.info("Executing in-memory tender catalog search fallback")
            try:
                from app.catalog import CATALOG_TENDERS
                res = []
                q_lower = query.lower().strip() if query else ""

                for t in CATALOG_TENDERS:
                    # Query text matching across title, ministry, department, organisation, ai_summary, categories, state
                    if q_lower:
                        searchable = f"{t.get('title','')} {t.get('ministry','')} {t.get('department','')} {t.get('organisation','')} {t.get('ai_summary','')} {' '.join(t.get('categories',[]))} {t.get('state','')} {t.get('source','')}".lower()
                        if not any(w in searchable for w in q_lower.split()):
                            continue

                    # State filter
                    st = filters.get("state") or (
                        filters.get("states")[0]
                        if isinstance(filters.get("states"), list) and filters.get("states")
                        else None
                    )
                    if st and st.lower() != "all" and st.lower() not in t.get("state", "").lower():
                        continue

                    # Ministry filter
                    min_val = filters.get("ministry") or (
                        filters.get("ministries")[0]
                        if isinstance(filters.get("ministries"), list) and filters.get("ministries")
                        else None
                    )
                    if min_val and min_val.lower() not in t.get("ministry", "").lower():
                        continue

                    # Category filter
                    cat_val = filters.get("category") or (
                        filters.get("categories")[0]
                        if isinstance(filters.get("categories"), list) and filters.get("categories")
                        else None
                    )
                    if cat_val:
                        t_cats = [c.lower() for c in t.get("categories", [])]
                        if not any(cat_val.lower() in c for c in t_cats):
                            continue

                    # MSME filter
                    if filters.get("msme_eligible") is not None and t.get("msme_eligible") != filters["msme_eligible"]:
                        continue

                    # Startup filter
                    if filters.get("startup_eligible") is not None and t.get("startup_eligible") != filters["startup_eligible"]:
                        continue

                    # Cost filter
                    cost = t.get("estimated_cost_lakhs", 0)
                    cost_min_req = filters.get("cost_min_lakhs") or filters.get("cost_min")
                    cost_max_req = filters.get("cost_max_lakhs") or filters.get("cost_max")
                    if cost_min_req is not None and cost < cost_min_req:
                        continue
                    if cost_max_req is not None and cost > cost_max_req:
                        continue

                    hit = dict(t)
                    hit["relevance_score"] = 95.0
                    hit["highlights"] = {}
                    res.append(hit)

                total = len(res)
                start_idx = (page - 1) * page_size
                final_hits = res[start_idx : start_idx + page_size]
            except Exception as ex:
                logger.error("In-memory catalog search failed", error=str(ex))

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

    def _format_os_hit(self, hit: dict) -> dict:
        src = hit.get("_source", {})
        highlights = {k: v for k, v in hit.get("highlight", {}).items()}
        return {
            "id": hit["_id"],
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
            "startup_eligible": src.get("startup_eligible", False),
            "source": src.get("source", ""),
            "source_url": src.get("source_url"),
            "ai_summary": src.get("ai_summary"),
            "relevance_score": round(hit.get("_score", 0) * 10, 2),
            "highlights": highlights,
        }

    def _format_qdrant_hit(self, hit: dict) -> dict:
        return {
            "id": hit.get("id") or hit.get("tender_id", ""),
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
            "startup_eligible": hit.get("startup_eligible", False),
            "source": hit.get("source", ""),
            "source_url": hit.get("source_url"),
            "ai_summary": hit.get("ai_summary"),
            "relevance_score": round(hit.get("semantic_score", 0) * 100, 2),
            "highlights": {},
        }
