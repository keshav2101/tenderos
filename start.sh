#!/bin/bash

echo "Starting local Redis cache server..."
redis-server --daemonize yes

# Parse and export database connection details
if [ -f "/app/scripts/parse_env.py" ]; then
    eval $(python3 /app/scripts/parse_env.py)
fi

# Set default settings
export ENVIRONMENT=${ENVIRONMENT:-"production"}
export JWT_SECRET=${JWT_SECRET:-"tenderos_production_jwt_secret_key_123456"}
export JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET:-"tenderos_production_jwt_refresh_secret_key_123456"}

# Force local Redis details (as we run it inside the same container)
export REDIS_HOST="127.0.0.1"
export REDIS_PORT="6379"
export REDIS_PASSWORD=""

# Disable Qdrant and OpenSearch to run in direct Postgres fallback mode
export QDRANT_HOST="disabled"
export OPENSEARCH_HOST="disabled"

# Export service URLs to localhost (127.0.0.1) since all run in the same container on Railway
export AUTH_SERVICE_URL="http://127.0.0.1:8001"
export TENDER_SERVICE_URL="http://127.0.0.1:8002"
export CONNECTOR_SERVICE_URL="http://127.0.0.1:8003"
export SCHEDULER_SERVICE_URL="http://127.0.0.1:8004"
export SEARCH_SERVICE_URL="http://127.0.0.1:8010"
export COPILOT_SERVICE_URL="http://127.0.0.1:8011"
export DIGITAL_TWIN_SERVICE_URL="http://127.0.0.1:8012"
export PROPOSAL_SERVICE_URL="http://127.0.0.1:8017"
export NOTIFICATION_SERVICE_URL="http://127.0.0.1:8018"
export ADMIN_SERVICE_URL="http://127.0.0.1:8019"

# Core services list to start
CORE_SERVICES=(
    "auth-service:8001"
    "tender-service:8002"
    "connector-service:8003"
    "scheduler-service:8004"
    "search-service:8010"
    "copilot-service:8011"
    "digital-twin-service:8012"
    "proposal-service:8017"
    "notification-service:8018"
    "admin-service:8019"
)

# Start core services in the background with staggered 2s delays
# to prevent OOM spike on memory-constrained Railway instances
for svc_info in "${CORE_SERVICES[@]}"; do
    svc="${svc_info%%:*}"
    port="${svc_info##*:}"

    echo "Starting $svc on port $port..."
    cd "/app/services/$svc"
    uvicorn app.main:app --host 0.0.0.0 --port "$port" --workers 1 2>&1 &
    sleep 2
done

# Wait for background services to stabilize before starting gateway
sleep 5

# Start API Gateway in the foreground to keep container alive.
# PORT is injected by Railway — default 8000 for local use.
TARGET_PORT="${PORT:-8000}"
echo "Starting api-gateway on port $TARGET_PORT..."
cd /app/services/api-gateway
exec uvicorn app.main:app --host 0.0.0.0 --port "$TARGET_PORT" --workers 1
