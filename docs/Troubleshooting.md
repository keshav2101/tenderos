# TenderOS Troubleshooting Guide

## Common Issues & Solutions

### 1. Connection Refused on PostgreSQL / Redis

- Cause: Service still initializing or port conflict.
- Solution: Run `docker compose ps` to check container status. Ensure ports 5432 and 6379 are not in use by local services.

### 2. Qdrant Version Mismatch Warning

- Cause: Client library major/minor version offset.
- Solution: Use `qdrant/qdrant:v1.13.6` in `docker-compose.yml` to match `qdrant-client`.

### 3. Docker Containerd I/O Error on macOS

- Cause: Docker Desktop Mac storage snapshotter corruption.
- Solution: Factory reset Docker Desktop or clear container storage cache (`docker system prune -af`).
