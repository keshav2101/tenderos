# TenderOS v1.0.0 — Deployment Guide

> **India-First AI Procurement Decision Intelligence Platform**
> Production deployment guide for DevOps and SRE teams.

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|------|----------------|---------|
| Docker | 24.x | Container runtime |
| Docker Compose | 2.24.x | Service orchestration |
| Git | 2.x | Source control |
| Python | 3.11+ | Scripts & tooling |
| Node.js | 20 LTS | Frontend build |
| OpenSSL | 3.x | TLS certificate generation |
| 8+ CPU cores, 32 GB RAM | — | Minimum production server |

---

## 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tenderos.git
cd tenderos

# Create Python virtual environment (used for scripts)
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements.txt   # if present
```

---

## 2. Configuration

### 2a. Copy environment template
```bash
cp .env.production.template .env
```

### 2b. Fill in ALL values in `.env`

**Mandatory secrets** (platform will not start without these):

| Variable | How to generate |
|---|---|
| `JWT_SECRET` | `openssl rand -hex 64` |
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` |
| `REDIS_PASSWORD` | `openssl rand -base64 32` |
| `RABBITMQ_PASSWORD` | `openssl rand -base64 32` |
| `NEO4J_PASSWORD` | `openssl rand -base64 24` |
| `QDRANT_API_KEY` | `openssl rand -hex 32` |
| `MINIO_SECRET_KEY` | `openssl rand -base64 32` |
| `GEMINI_API_KEY` | From Google AI Studio |
| `STRIPE_API_KEY` | From Stripe Dashboard |

---

## 3. First-Time Launch

```bash
# Pull and build all images (first run takes 10–20 min)
docker-compose -f docker-compose.prod.yml build --parallel

# Start infrastructure first
docker-compose -f docker-compose.prod.yml up -d \
  postgres redis rabbitmq minio opensearch qdrant neo4j

# Wait for all infra healthchecks to pass (~60s)
docker-compose -f docker-compose.prod.yml ps

# Start application services
docker-compose -f docker-compose.prod.yml up -d

# Check all services are healthy
docker-compose -f docker-compose.prod.yml ps
```

---

## 4. Seed Demo Data

```bash
# Run after all services are healthy
docker exec -i tenderos-postgres psql -U tenderos -d tenderos \
  < infrastructure/postgres/seed_demo.sql
```

This creates:
- **6 test accounts** with pre-set passwords (see Step 5)
- **3 company digital twins** (MSME, Startup, Large Enterprise)
- **6 sample tenders** (GeM, CPPP, IREPS sources)
- **2 active bid workflows** with full transition histories
- **Analytics snapshots** for dashboard demo

---

## 5. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| **Administrator** | `admin@tenderos.in` | `AdminSecure@TenderOS2026!` |
| **Enterprise** | `enterprise@demo.in` | `EnterpriseDemo@2026!` |
| **Consultant** | `consultant@demo.in` | `ConsultantDemo@2026!` |
| **MSME (Udyam)** | `msme@demo.in` | `MSMEDemoExemption@2026!` |
| **Startup (DPIIT)** | `startup@demo.in` | `StartupRelaxation@2026!` |
| **Viewer** | `viewer@demo.in` | `ViewerAccessOnly@2026!` |

> ⚠️ **Change all passwords immediately after first login.**

---

## 6. Service URLs

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | `http://localhost:3000` | Next.js UI |
| **API Gateway** | `http://localhost:8000` | Entrypoint for all API calls |
| **Swagger UI** | `http://localhost:8000/docs` | Interactive API docs |
| **ReDoc** | `http://localhost:8000/redoc` | OpenAPI documentation |
| **Grafana** | `http://localhost:3001` | Metrics dashboards |
| **Prometheus** | `http://localhost:9090` | Raw metrics |
| **RabbitMQ UI** | `http://localhost:15672` | Queue management |
| **MinIO Console** | `http://localhost:9001` | Object storage |
| **Neo4j Browser** | `http://localhost:7474` | Knowledge graph explorer |
| **Qdrant Dashboard** | `http://localhost:6333/dashboard` | Vector DB UI |
| **OpenSearch** | `http://localhost:9200` | Full-text search API |

---

## 7. Running Tests

```bash
# Integration test suite (requires running platform)
python scripts/integration_test.py --base-url http://localhost:8000

# Health check all services
for port in 8000 8001 8002 8003 8004 8005 8006 8007 8008 8009 \
            8010 8011 8012 8013 8014 8015 8016 8017 8018 8019 8020 8021 8022; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$port/health)
  echo "Port $port: $status"
done
```

---

## 8. Updating Services

```bash
# Pull latest code
git pull origin main

# Rebuild specific service (zero-downtime for stateless services)
docker-compose -f docker-compose.prod.yml build proposal-service
docker-compose -f docker-compose.prod.yml up -d --no-deps proposal-service

# Full rolling redeploy
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 9. Backup & Restore

### Database backup
```bash
# Full Postgres backup
docker exec tenderos-postgres pg_dump -U tenderos tenderos | \
  gzip > "backup_tenderos_$(date +%Y%m%d_%H%M%S).sql.gz"

# Restore
gunzip -c backup_tenderos_*.sql.gz | \
  docker exec -i tenderos-postgres psql -U tenderos tenderos
```

### Volume backups
```bash
# Stop services, backup volumes, restart
docker-compose -f docker-compose.prod.yml stop
tar -czf volumes_backup_$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/tender-ai_postgres_data \
  /var/lib/docker/volumes/tender-ai_qdrant_data \
  /var/lib/docker/volumes/tender-ai_neo4j_data
docker-compose -f docker-compose.prod.yml start
```

---

## 10. Monitoring

### View logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api-gateway

# Errors only
docker-compose -f docker-compose.prod.yml logs | grep -i "error\|exception\|critical"
```

### Grafana dashboards
1. Open `http://localhost:3001`
2. Login: `admin` / `tenderos_grafana_prod` (or value of `GRAFANA_PASSWORD`)
3. Navigate to **TenderOS Platform** dashboard

### Alert thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| API latency p95 | >500ms | >2000ms |
| Error rate | >1% | >5% |
| CPU usage | >70% | >90% |
| Memory usage | >80% | >95% |
| DB connections | >80% pool | >95% pool |

---

## 11. Troubleshooting

### Service won't start
```bash
docker-compose -f docker-compose.prod.yml logs <service-name> --tail=50
```

### Database connection errors
```bash
# Check postgres is healthy
docker exec tenderos-postgres pg_isready -U tenderos
# Check env vars are set
docker exec tenderos-api-gateway env | grep POSTGRES
```

### Redis connection errors
```bash
docker exec tenderos-redis redis-cli -a $REDIS_PASSWORD ping
```

### Vector search not working
```bash
curl http://localhost:6333/healthz
curl http://localhost:6333/collections
```

### Tender ingestion not running
```bash
# Check connector service
docker-compose -f docker-compose.prod.yml logs connector-service -f
# Trigger manual sync via API
curl -X POST http://localhost:8000/api/v1/connectors/gem/sync \
  -H "Authorization: Bearer <admin_token>"
```

---

## 12. Production Hardening Checklist

- [ ] All `CHANGE_ME` values replaced in `.env`
- [ ] TLS certificates installed at `/etc/ssl/certs/tenderos.in.crt`
- [ ] NGINX config deployed at `/etc/nginx/sites-available/tenderos.conf`
- [ ] Firewall: only ports 80, 443 exposed publicly
- [ ] All internal service ports bound to `127.0.0.1` (done in `docker-compose.prod.yml`)
- [ ] Automated nightly database backups configured
- [ ] Log rotation configured (done via docker logging driver)
- [ ] Grafana alerts configured for critical thresholds
- [ ] Demo passwords changed after first login
- [ ] GEMINI_API_KEY quota limits reviewed with Google Cloud
- [ ] Stripe webhook endpoint registered: `https://api.tenderos.in/api/v1/billing/webhooks/stripe`
