"""
TenderOS Backend Master Server Manager (Windows & Cross-Platform)
Starts all core microservices and API Gateway listening on 0.0.0.0 for Global/LAN access.
"""

import os
import sys
import time
import subprocess

# Reconfigure stdout for UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except AttributeError:
        pass

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Virtualenv Python Executable
venv_python = os.path.join(BASE_DIR, ".venv", "Scripts", "python.exe")
if os.path.exists(venv_python):
    PYTHON_EXE = venv_python
else:
    PYTHON_EXE = sys.executable

print(f"[INFO] Using Python Executable: {PYTHON_EXE}")

# Environment setup
env = os.environ.copy()
env["PYTHONIOENCODING"] = "utf-8"
env["ENVIRONMENT"] = "development"
env["JWT_SECRET"] = "tenderos_production_jwt_secret_key_123456"
env["JWT_REFRESH_SECRET"] = "tenderos_production_jwt_refresh_secret_key_123456"
env["POSTGRES_HOST"] = "127.0.0.1"
env["POSTGRES_PORT"] = "5432"
env["REDIS_HOST"] = "127.0.0.1"
env["REDIS_PORT"] = "6379"
env["QDRANT_HOST"] = "127.0.0.1"
env["OPENSEARCH_HOST"] = "127.0.0.1"

# Service endpoints mapping to 127.0.0.1 for Gateway proxying
env["AUTH_SERVICE_URL"] = "http://127.0.0.1:8001"
env["TENDER_SERVICE_URL"] = "http://127.0.0.1:8002"
env["CONNECTOR_SERVICE_URL"] = "http://127.0.0.1:8003"
env["SEARCH_SERVICE_URL"] = "http://127.0.0.1:8010"
env["COPILOT_SERVICE_URL"] = "http://127.0.0.1:8011"
env["DIGITAL_TWIN_SERVICE_URL"] = "http://127.0.0.1:8012"
env["BID_QUAL_SERVICE_URL"] = "http://127.0.0.1:8002"
env["MARKET_INTEL_SERVICE_URL"] = "http://127.0.0.1:8014"
env["PREDICTION_SERVICE_URL"] = "http://127.0.0.1:8015"
env["COMPETITOR_SERVICE_URL"] = "http://127.0.0.1:8016"
env["PROPOSAL_SERVICE_URL"] = "http://127.0.0.1:8017"
env["NOTIFICATION_SERVICE_URL"] = "http://127.0.0.1:8018"
env["ADMIN_SERVICE_URL"] = "http://127.0.0.1:8019"
env["BILLING_SERVICE_URL"] = "http://127.0.0.1:8020"

SERVICES = [
    ("auth-service", 8001),
    ("tender-service", 8002),
    ("connector-service", 8003),
    ("search-service", 8010),
    ("copilot-service", 8011),
    ("proposal-service", 8017),
    ("admin-service", 8019),
    ("api-gateway", 8000),
]

processes = []

def start_services():
    print("=" * 60)
    print("[INIT] TenderOS Active Backend Server Initializing...")
    print("=" * 60)

    for svc_name, port in SERVICES:
        svc_dir = os.path.join(BASE_DIR, "services", svc_name)
        if not os.path.exists(svc_dir):
            print(f"[WARN] Directory {svc_dir} not found. Skipping {svc_name}.")
            continue

        print(f"[START] Starting {svc_name} on port {port} (0.0.0.0:{port})...")
        cmd = [
            PYTHON_EXE, "-m", "uvicorn", "app.main:app",
            "--host", "0.0.0.0",
            "--port", str(port),
            "--workers", "1"
        ]
        
        proc = subprocess.Popen(
            cmd,
            cwd=svc_dir,
            env=env
        )
        processes.append((svc_name, proc))
        time.sleep(1.5)

    print("\n[OK] All TenderOS Backend Microservices & API Gateway are ACTIVE!")
    print("[URL] Local API Access: http://localhost:8000")
    print("[URL] LAN API Access:   http://192.168.1.21:8000")
    print("[URL] OpenAPI Docs:     http://localhost:8000/docs")
    print("=" * 60)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[STOP] Shutting down TenderOS backend services...")
        for svc_name, proc in processes:
            proc.terminate()
        print("Done.")

if __name__ == "__main__":
    start_services()
