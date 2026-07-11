# Administrator Manual — TenderOS v1.0.0

This manual guides DevOps engineers and platform administrators through logging, monitoring, scaling, backup routines, and command line interventions on the hosted Railway infrastructure.

---

## 1. System Health Checks

TenderOS aggregates health states across all distributed microservices.

### 1.1 Live Check
Pings the API Gateway edge server:
```bash
curl -i https://backend-production-4aa8.up.railway.app/health
```

### 1.2 Deep Integration Check
Verifies connectivity between internal services and the PostgreSQL database pool:
```bash
curl -i https://backend-production-4aa8.up.railway.app/health/deep
```
An `unreachable` status on optional ML modules (e.g. `prediction-service`) is tolerated and does not crash the gateway router, while critical modules (`auth`, `tender`, `search`) must report `healthy`.

---

## 2. Viewing Live Logs

Railway captures all stdout/stderr streams from the container processes.

### 2.1 Web Dashboard
Open the Railway Project dashboard:
`https://railway.com/project/1b6ee705-9b14-4285-bba0-ceeb7fa921a2`
Select the **`backend`** service card and navigate to the **Deployments** or **Logs** tab.

### 2.2 CLI Streaming
Stream live container logs to your local terminal:
```bash
railway logs --tail 100
```
To continuously stream logs in real-time:
```bash
railway logs -f
```

---

## 3. Microservice Intervention & Restart

If an internal service becomes unresponsive or database connection pools degrade, trigger a container restart without rebuilding:

```bash
railway restart --yes
```
This forces a rolling restart, terminating the old process group while verifying the new container passes health checks before routing active web requests.

---

## 4. Database Maintenance & Backups

PostgreSQL database volume is provisioned natively on Railway.

### 4.1 Automated Backups
Railway automatically executes daily database snapshot backups. These snapshots are stored off-site and can be restored with a single click in the **Postgres service settings** under the "Backups" tab.

### 4.2 Manual Backup (pg_dump)
Administrators can run manual database snapshots from their local machine using Python:
```bash
python3 -c '
import os
os.system("pg_dump postgresql://postgres:hMftELunyqDbdAjJlHsKStplLhgrPOgG@tramway.proxy.rlwy.net:40786/railway > backup_$(date +%F).sql")
'
```

### 4.3 Database Schema Migration Execution
To apply new indices or modify table structures, execute scripts against the public database proxy domain:
```bash
python3 scratch/run_migrations.py
```

---

## 5. Environment Config Auditing

To audit the active variables and dynamic bindings on the gateway service:
```bash
railway vars
```
The critical variable mapping to ensure proper routing:
- `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (Dynamic internal routing)
- `CORS_ORIGINS`: `["*"]` (Wildcard access array)
- Service ports range internally from `8001` (auth-service) through `8019` (admin-service), with `api-gateway` mapping to the dynamic `PORT` injected by Railway.
