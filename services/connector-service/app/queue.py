import json
import redis
import structlog
from app.config import settings

logger = structlog.get_logger()

def get_redis_client():
    return redis.Redis(
        host=settings.REDIS_HOST,
        port=settings.REDIS_PORT,
        password=settings.REDIS_PASSWORD or None,
        decode_responses=True
    )

def publish_tender_event(source_id: str, raw_tender_data: dict, source_url: str, source_tender_id: str, document_urls: list = None):
    """Publish a tender discovery event to the Redis queue list."""
    try:
        client = get_redis_client()
        payload = {
            "source_id": source_id,
            "source_tender_id": source_tender_id,
            "source_url": source_url,
            "raw_json": raw_tender_data,
            "document_urls": document_urls or []
        }
        client.rpush("tenderos:ingestion_queue", json.dumps(payload))
        logger.info("Published tender to queue", source_id=source_id, source_tender_id=source_tender_id)
    except Exception as e:
        logger.error("Failed to publish tender to Redis queue", error=str(e))
        raise e
