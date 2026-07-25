# TenderOS Backup & Recovery Guide

## Backup Procedures

### PostgreSQL Automated Backup

```bash
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec tenderos-postgres pg_dump -U tenderos tenderos | gzip > /backups/postgres_$TIMESTAMP.sql.gz
```

### Qdrant Snapshots

```bash
curl -X POST http://localhost:6333/collections/tender_chunks/snapshots
```

## Restoration Procedures

```bash
gunzip -c /backups/postgres_latest.sql.gz | docker exec -i tenderos-postgres psql -U tenderos -d tenderos
```
