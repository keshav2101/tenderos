# TenderOS Monitoring & Observability Guide

TenderOS includes built-in Prometheus and Grafana monitoring stacks.

## Endpoints

- Prometheus UI: `http://localhost:9090`
- Grafana Dashboard: `http://localhost:3001` (Default login: `admin` / `admin`)
- Alertmanager: `http://localhost:9093`

## Service Metrics

Every FastAPI service exposes standard Prometheus metrics at `/metrics`:
- `http_requests_total`
- `http_request_duration_seconds`
- `tenderos_active_crawls`
- `tenderos_rag_latency_seconds`
