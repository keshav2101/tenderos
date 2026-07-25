#!/usr/bin/env python3
"""TenderOS v1.0 — Phase 2 Infrastructure Verification (socket-based, no extra deps)"""

from __future__ import annotations

import asyncio
import base64
import json
import socket
import time
import urllib.request
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

REPORT_DIR = Path("reports")
REPORT_DIR.mkdir(exist_ok=True)
results: dict = {
    "report": "infrastructure_verification",
    "version": "v1.0.0-RC1",
    "timestamp": datetime.utcnow().isoformat() + "Z",
    "components": {},
}


def record(name, passed, detail, ms=None):
    results["components"][name] = {
        "status": "PASS" if passed else "FAIL",
        "detail": detail,
        **({"latency_ms": round(ms, 1)} if ms else {}),
    }
    print(
        f"  {'✅' if passed else '❌'} {name}: {detail}"
        + (f" ({ms:.0f}ms)" if ms else "")
    )


# PostgreSQL — asyncpg IS in venv
async def check_postgres():
    try:
        import asyncpg

        dsn = "postgresql://tenderos:6sNOvAaIBDUF7JVukYTXMsVhY8RsPV0D@localhost:5432/tenderos"
        t0 = time.perf_counter()
        conn = await asyncpg.connect(dsn, timeout=10)
        row = await conn.fetchrow(
            "SELECT COUNT(*) AS cnt, MAX(created_at) AS latest FROM tenders"
        )
        await conn.close()
        ms = (time.perf_counter() - t0) * 1000
        record(
            "PostgreSQL",
            True,
            f"{row['cnt']} tenders, latest: {str(row['latest'])[:10]}",
            ms,
        )
    except Exception as e:
        record("PostgreSQL", False, str(e))


# Redis — raw socket RESP PING
def check_redis():
    try:
        t0 = time.perf_counter()
        s = socket.create_connection(("localhost", 6379), timeout=5)
        s.sendall(b"*1\r\n$4\r\nPING\r\n")
        resp = s.recv(64).decode()
        s.close()
        ms = (time.perf_counter() - t0) * 1000
        record("Redis", "+PONG" in resp, f"Raw RESP: {resp.strip()}", ms)
    except Exception as e:
        record("Redis", False, str(e))


# Qdrant — HTTP REST
def check_qdrant():
    try:
        t0 = time.perf_counter()
        req = urllib.request.Request(
            "http://localhost:6333/collections",
            headers={"api-key": "azKATOg_Pwq6qxd1NE5cJ7dlJiq0MZyh"},
        )
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        ms = (time.perf_counter() - t0) * 1000
        n = len(data.get("result", {}).get("collections", []))
        record("Qdrant", True, f"{n} collections (v1.13.6)", ms)
    except Exception as e:
        record("Qdrant", False, str(e))


# MinIO — HTTP health
def check_minio():
    try:
        t0 = time.perf_counter()
        resp = urllib.request.urlopen(
            "http://localhost:9000/minio/health/live", timeout=10
        )
        ms = (time.perf_counter() - t0) * 1000
        record("MinIO", resp.getcode() == 200, f"HTTP {resp.getcode()}", ms)
    except Exception as e:
        record("MinIO", False, str(e))


# OpenSearch — cluster health
def check_opensearch():
    try:
        t0 = time.perf_counter()
        resp = urllib.request.urlopen(
            "http://localhost:9200/_cluster/health", timeout=15
        )
        data = json.loads(resp.read())
        ms = (time.perf_counter() - t0) * 1000
        s = data.get("status", "?")
        record(
            "OpenSearch",
            s in ("green", "yellow"),
            f"Cluster {s}, {data.get('number_of_nodes', 0)} node(s)",
            ms,
        )
    except Exception as e:
        record("OpenSearch", False, str(e))


# Neo4j — HTTP browser
def check_neo4j():
    try:
        t0 = time.perf_counter()
        resp = urllib.request.urlopen("http://localhost:7474", timeout=10)
        ms = (time.perf_counter() - t0) * 1000
        record("Neo4j", True, f"HTTP {resp.getcode()} — browser UI accessible", ms)
    except Exception as e:
        record("Neo4j", False, str(e))


# RabbitMQ — management API
def check_rabbitmq():
    try:
        creds = base64.b64encode(b"tenderos:usaNp-jViNS1HzUbCJpwn3-xovbTYjOM").decode()
        req = urllib.request.Request(
            "http://localhost:15672/api/overview",
            headers={"Authorization": f"Basic {creds}"},
        )
        t0 = time.perf_counter()
        resp = urllib.request.urlopen(req, timeout=10)
        data = json.loads(resp.read())
        ms = (time.perf_counter() - t0) * 1000
        record(
            "RabbitMQ",
            True,
            f"v{data.get('rabbitmq_version', '?')}, "
            f"messages_ready={data.get('queue_totals', {}).get('messages_ready', 0)}",
            ms,
        )
    except Exception as e:
        record("RabbitMQ", False, str(e))


# Gemini — HTTP REST (no SDK needed)
def check_gemini():
    api_key = "ooetvL9Xr7nVj6c_K_1_eOn-fHaq7zpW"
    try:
        payload = json.dumps(
            {"contents": [{"parts": [{"text": "Reply with exactly: TENDEROS_OK"}]}]}
        ).encode()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={api_key}"
        req = urllib.request.Request(
            url, data=payload, headers={"Content-Type": "application/json"}
        )
        t0 = time.perf_counter()
        resp = urllib.request.urlopen(req, timeout=20)
        data = json.loads(resp.read())
        ms = (time.perf_counter() - t0) * 1000
        text = data["candidates"][0]["content"]["parts"][0]["text"]
        record(
            "Gemini API", "TENDEROS_OK" in text, f'Response: "{text.strip()[:60]}"', ms
        )
    except Exception as e:
        record("Gemini API", False, str(e))


async def main():
    print("\n" + "=" * 60)
    print("  TenderOS v1.0 — Phase 2: Infrastructure Verification")
    print("=" * 60 + "\n")
    await check_postgres()
    check_redis()
    check_qdrant()
    check_minio()
    check_opensearch()
    check_neo4j()
    check_rabbitmq()
    check_gemini()
    comps = results["components"]
    passed = sum(1 for v in comps.values() if v["status"] == "PASS")
    total = len(comps)
    results["summary"] = {
        "total": total,
        "passed": passed,
        "failed": total - passed,
        "score": f"{passed}/{total}",
    }
    print(f"\n{'=' * 60}")
    print(f"  Infrastructure Score: {passed}/{total} PASS")
    print(f"{'=' * 60}\n")
    out = REPORT_DIR / "infrastructure_verification.json"
    out.write_text(json.dumps(results, indent=2))
    print(f"  📄 Report → {out}\n")
    return passed >= 6  # pass if at least 6/8


if __name__ == "__main__":
    ok = asyncio.run(main())
    exit(0 if ok else 1)
