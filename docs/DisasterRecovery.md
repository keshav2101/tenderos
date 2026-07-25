# TenderOS Disaster Recovery (DR) Plan

## Recovery Time Objective (RTO) & Recovery Point Objective (RPO)

- RTO Target: < 30 minutes for full platform restore.
- RPO Target: < 1 hour (PostgreSQL WAL streaming + daily MinIO sync).

## Failover Strategy

1. Database Failover: Primary-replica PostgreSQL failover using PgBouncer.
2. Storage Replication: MinIO bucket replication across dual regions.
3. Stateless Services: Multi-region deployment on Railway with automatic traffic rerouting.
