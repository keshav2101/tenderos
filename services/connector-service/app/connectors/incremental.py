"""
Incremental Crawling Engine — Phase 14.

Provides:
  - Redis-backed last-crawl timestamp per connector
  - Content-hash delta detection (skip unchanged records)
  - Automatic archival of past-deadline tenders
  - Corrigenda change detection
"""
from __future__ import annotations
from datetime import datetime, timedelta
from typing import Optional
import structlog

logger = structlog.get_logger()

# Redis key prefixes
LAST_CRAWL_PREFIX = "connector:last_crawl:"
TENDER_HASH_PREFIX = "tender:hash:"


def get_last_crawl(source_id: str) -> Optional[datetime]:
    """Retrieve the last crawl timestamp for a connector from Redis."""
    try:
        from app.queue import get_redis_client
        r = get_redis_client()
        val = r.get(f"{LAST_CRAWL_PREFIX}{source_id}")
        if val:
            return datetime.fromisoformat(val.decode() if isinstance(val, bytes) else val)
    except Exception as e:
        logger.warning("Failed to get last crawl timestamp", source_id=source_id, error=str(e))
    return None


def set_last_crawl(source_id: str, ts: Optional[datetime] = None):
    """Persist the last crawl timestamp for a connector to Redis."""
    try:
        from app.queue import get_redis_client
        r = get_redis_client()
        ts = ts or datetime.utcnow()
        r.set(f"{LAST_CRAWL_PREFIX}{source_id}", ts.isoformat(), ex=86400 * 7)
    except Exception as e:
        logger.warning("Failed to set last crawl timestamp", source_id=source_id, error=str(e))


def has_content_changed(source_id: str, tender_id: str, new_hash: str) -> bool:
    """
    Compare the stored content hash for a tender against the new one.
    Returns True if content has changed (needs update) or is new.
    """
    try:
        from app.queue import get_redis_client
        r = get_redis_client()
        key = f"{TENDER_HASH_PREFIX}{source_id}:{tender_id}"
        stored = r.get(key)
        if stored is None:
            # New tender — never seen before
            r.set(key, new_hash, ex=86400 * 30)
            return True
        stored_str = stored.decode() if isinstance(stored, bytes) else stored
        if stored_str != new_hash:
            r.set(key, new_hash, ex=86400 * 30)
            return True
        return False
    except Exception:
        return True  # Default: treat as changed if cache fails


def should_archive(submission_deadline: Optional[datetime],
                   grace_days: int = 7) -> bool:
    """
    Determine if a tender should be archived based on its deadline.
    Tenders past deadline by `grace_days` are marked for archival.
    """
    if submission_deadline is None:
        return False
    cutoff = datetime.utcnow() - timedelta(days=grace_days)
    return submission_deadline < cutoff


def compute_since_delta(source_id: str, default_days_back: int = 3) -> Optional[datetime]:
    """
    Get the `since` timestamp for incremental fetching.
    Falls back to `default_days_back` ago if no checkpoint exists.
    """
    last = get_last_crawl(source_id)
    if last:
        return last
    return datetime.utcnow() - timedelta(days=default_days_back)
