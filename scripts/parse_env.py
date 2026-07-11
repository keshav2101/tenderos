import os
import urllib.parse

def parse_db_url(url):
    if not url:
        return {}
    try:
        parsed = urllib.parse.urlparse(url)
        return {
            "POSTGRES_USER": parsed.username or "postgres",
            "POSTGRES_PASSWORD": parsed.password or "",
            "POSTGRES_HOST": parsed.hostname or "localhost",
            "POSTGRES_PORT": str(parsed.port or 5432),
            "POSTGRES_DB": parsed.path.lstrip('/') or "railway"
        }
    except Exception as e:
        print(f"# Error parsing DATABASE_URL: {e}")
        return {}

def parse_redis_url(url):
    if not url:
        return {}
    try:
        parsed = urllib.parse.urlparse(url)
        return {
            "REDIS_HOST": parsed.hostname or "localhost",
            "REDIS_PORT": str(parsed.port or 6379),
            "REDIS_PASSWORD": parsed.password or ""
        }
    except Exception as e:
        print(f"# Error parsing REDIS_URL: {e}")
        return {}

db_url = os.environ.get("DATABASE_URL")
redis_url = os.environ.get("REDIS_URL")

env_vars = {}
env_vars.update(parse_db_url(db_url))
env_vars.update(parse_redis_url(redis_url))

# Export qdrant if present
qdrant_url = os.environ.get("QDRANT_URL")
if qdrant_url:
    try:
        parsed = urllib.parse.urlparse(qdrant_url)
        env_vars["QDRANT_HOST"] = parsed.hostname or "localhost"
        env_vars["QDRANT_PORT"] = str(parsed.port or 6333)
    except Exception as e:
        print(f"# Error parsing QDRANT_URL: {e}")

# Set fallbacks/disabled for opensearch if not provided
if "OPENSEARCH_HOST" not in os.environ:
    env_vars["OPENSEARCH_HOST"] = "disabled"
    env_vars["OPENSEARCH_PORT"] = "9200"

# Print exports for shell to source
for k, v in env_vars.items():
    print(f"export {k}='{v}'")
