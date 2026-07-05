# TenderOS — Makefile
# Usage: make <target>

.PHONY: infra up down seed dev-frontend logs status clean help

# Start infrastructure only (DB, Redis, RabbitMQ, vector DBs)
infra:
	docker compose -f docker-compose.infra.yml up -d
	@echo "\n✓ Infrastructure started"
	@echo "  PostgreSQL: localhost:5432"
	@echo "  Redis:      localhost:6379"
	@echo "  RabbitMQ:   localhost:5672 (UI: http://localhost:15672)"
	@echo "  Qdrant:     http://localhost:6333"
	@echo "  OpenSearch: http://localhost:9200"
	@echo "  MinIO:      http://localhost:9001"
	@echo "  Neo4j:      http://localhost:7474"

# Wait for PostgreSQL to be ready
wait-postgres:
	@echo "Waiting for PostgreSQL..."
	@until docker exec tenderos-postgres pg_isready -U tenderos -d tenderos 2>/dev/null; do \
		sleep 1; \
	done
	@echo "✓ PostgreSQL ready"

# Seed tenders (run after infra is up)
seed: wait-postgres
	@echo "Seeding database and search indices..."
	POSTGRES_DSN="postgresql://tenderos:tenderos_dev_password@localhost:5432/tenderos" \
	OPENSEARCH_URL="http://localhost:9200" \
	QDRANT_URL="http://localhost:6333" \
	python scripts/seed_tenders.py --count 500

# Start all services via Docker Compose
up:
	docker compose up -d --build
	@echo "\n✓ TenderOS started"
	@echo "  Frontend:   http://localhost:3000"
	@echo "  API:        http://localhost:8000"
	@echo "  API Docs:   http://localhost:8000/docs"
	@echo "  Health:     http://localhost:8000/health/deep"

# Stop all services
down:
	docker compose down

# Start frontend development server
dev-frontend:
	cd apps/frontend && npm run dev

# View logs
logs:
	docker compose logs -f --tail=100

# Service-specific logs
logs-%:
	docker compose logs -f $* --tail=100

# Platform status
status:
	@echo "\n─── Infrastructure ───────────────────────────────────────────"
	@docker compose -f docker-compose.infra.yml ps 2>/dev/null || echo "Infrastructure not running"
	@echo "\n─── Services ─────────────────────────────────────────────────"
	@docker compose ps 2>/dev/null || echo "Services not running"
	@echo "\n─── Health ───────────────────────────────────────────────────"
	@curl -s http://localhost:8000/health 2>/dev/null | python3 -m json.tool || echo "API Gateway: unreachable"

# Quick dev setup
dev: infra wait-postgres seed dev-frontend

# Run tests
test:
	@echo "Running service tests..."
	pytest services/ -v --tb=short

# Clean everything (containers + volumes)
clean:
	docker compose down -v
	docker compose -f docker-compose.infra.yml down -v
	@echo "✓ All containers and volumes removed"

help:
	@echo ""
	@echo "TenderOS — Commands"
	@echo "────────────────────────────────────────────"
	@echo "  make infra          Start infrastructure (DB, Redis, RabbitMQ, etc.)"
	@echo "  make seed           Seed 500 synthetic tenders into all data stores"
	@echo "  make up             Start all services"
	@echo "  make dev            Full dev setup (infra + seed + frontend)"
	@echo "  make dev-frontend   Start Next.js dev server"
	@echo "  make down           Stop all services"
	@echo "  make logs           Tail all service logs"
	@echo "  make logs-<svc>     Tail specific service logs"
	@echo "  make status         Check platform health"
	@echo "  make test           Run test suite"
	@echo "  make clean          Remove all containers and volumes"
	@echo ""
