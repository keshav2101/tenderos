# TenderOS Operations Guide

Operational procedures for managing TenderOS in production.

## Service Controls

- Start all services: `docker compose up -d`
- Stop all services: `docker compose down`
- View service logs: `docker compose logs -f <service-name>`
- Restart single service: `docker compose restart <service-name>`

## Connector Operations

- Check status of all 205 connectors: `curl http://localhost:8003/api/v1/connectors/status`
- Manually trigger crawl: `curl -X POST http://localhost:8004/api/v1/jobs/trigger-all`

## Database Operations

- Access PostgreSQL shell: `docker compose exec postgres psql -U tenderos -d tenderos`
- Create DB backup: `docker compose exec postgres pg_dump -U tenderos tenderos > backup.sql`
