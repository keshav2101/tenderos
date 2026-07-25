import json
import sys
import time
import urllib.parse
import urllib.request

BASE_FRONTEND = "https://tenderos-neon.vercel.app"
BASE_BACKEND = "https://backend-production-4aa8.up.railway.app"

results = []


def test_route(name, url, expected_code=200, check_text=None, headers=None):
    t0 = time.perf_counter()
    req_headers = {
        "User-Agent": "TenderOS-SmokeTester/1.0",
        "Accept": "text/html,application/xhtml+xml,application/json,application/xml;q=0.9,*/*;q=0.8",
    }
    if headers:
        req_headers.update(headers)

    try:
        req = urllib.request.Request(url, headers=req_headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            code = resp.getcode()
            content = resp.read().decode("utf-8", errors="ignore")
            ms = (time.perf_counter() - t0) * 1000

            passed = code == expected_code
            if check_text and check_text.lower() not in content.lower():
                passed = False

            status_str = "PASS" if passed else "FAIL"
            results.append(
                {
                    "feature": name,
                    "url": url,
                    "status": status_str,
                    "http_code": code,
                    "latency_ms": round(ms, 1),
                    "payload_kb": round(len(content) / 1024, 2),
                }
            )
            print(f"[{status_str}] {name} ({url}) -> HTTP {code} in {round(ms, 1)}ms ({round(len(content)/1024, 1)}KB)")
            return content
    except urllib.error.HTTPError as e:
        ms = (time.perf_counter() - t0) * 1000
        passed = e.code == expected_code
        status_str = "PASS" if passed else "FAIL"
        results.append(
            {
                "feature": name,
                "url": url,
                "status": status_str,
                "http_code": e.code,
                "latency_ms": round(ms, 1),
            }
        )
        print(f"[{status_str}] {name} ({url}) -> HTTP {e.code} in {round(ms, 1)}ms")
        return None
    except Exception as e:
        ms = (time.perf_counter() - t0) * 1000
        results.append(
            {
                "feature": name,
                "url": url,
                "status": "FAIL",
                "error": str(e),
                "latency_ms": round(ms, 1),
            }
        )
        print(f"[FAIL] {name} ({url}) -> Error: {e}")
        return None


print("=== STARTING TENDEROS V1.0.0 LIVE PRODUCTION SMOKE TEST ===")
print(f"Frontend Ingress: {BASE_FRONTEND}")
print(f"Backend Ingress:  {BASE_BACKEND}\n")

# 1. Frontend Route Probes
test_route("Landing Page", f"{BASE_FRONTEND}/", 200)
test_route("Login Interface", f"{BASE_FRONTEND}/login", 200)
test_route("Registration Interface", f"{BASE_FRONTEND}/register", 200)
test_route("Main Dashboard Overview", f"{BASE_FRONTEND}/dashboard", 200)
test_route("Tender Search & Filtering", f"{BASE_FRONTEND}/dashboard/search", 200)
test_route("AI Intelligence Engine", f"{BASE_FRONTEND}/dashboard/intelligence", 200)
test_route("Procurement Connectors", f"{BASE_FRONTEND}/dashboard/connectors", 200)
test_route("Analytics & CPWD Scoring", f"{BASE_FRONTEND}/dashboard/analytics", 200)
test_route("Admin & Digital Twin Check", f"{BASE_FRONTEND}/dashboard/admin", 200)
test_route("Watchlist & Alerts", f"{BASE_FRONTEND}/dashboard/watchlist", 200)
test_route("Tender Comparison Tool", f"{BASE_FRONTEND}/dashboard/compare", 200)
test_route("User Profile Management", f"{BASE_FRONTEND}/dashboard/profile", 200)
test_route("System Settings", f"{BASE_FRONTEND}/dashboard/settings", 200)
test_route("Notifications Center", f"{BASE_FRONTEND}/dashboard/notifications", 200)

# 2. Live Backend API Endpoint Probes
print("\n=== PROBING LIVE RAILWAY BACKEND ENDPOINTS ===")
test_route("Backend System Health Check", f"{BASE_BACKEND}/health", 200, "healthy")
test_route("Backend Open API Specs", f"{BASE_BACKEND}/docs", 200)
test_route("Live Tender Search API", f"{BASE_BACKEND}/api/v1/tenders?limit=5", 200)
test_route("Live Ministries API", f"{BASE_BACKEND}/api/v1/analytics/ministries", 200)
test_route(
    "Protected Connector API (Auth Guarded)",
    f"{BASE_BACKEND}/api/v1/connectors/status",
    401,
)

# 3. Interactive Auth & API Token Verification
print("\n=== VERIFYING AUTHENTICATED FLOWS ===")
try:
    auth_data = urllib.parse.urlencode({"username": "demo@tenderos.in", "password": "DemoPassword123!"}).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_BACKEND}/api/v1/auth/token",
        data=auth_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req) as resp:
        token_res = json.loads(resp.read().decode("utf-8"))
        access_token = token_res.get("access_token")
        print(f"[PASS] Authentication Token Generation -> Issued JWT ({access_token[:15]}...)")

        # Test Authenticated Connector Status
        test_route(
            "Authenticated Connector Status API",
            f"{BASE_BACKEND}/api/v1/connectors/status",
            200,
            headers={"Authorization": f"Bearer {access_token}"},
        )
except Exception as e:
    print(f"[NOTE] Public/Demo auth token endpoint check: {e}")

# Save Smoke Test Report
with open("reports/live_smoke_test_results.json", "w") as f:
    json.dump(results, f, indent=2)

passed_count = sum(1 for r in results if r["status"] == "PASS")
total_count = len(results)

print(f"\n=== LIVE PRODUCTION SMOKE TEST RESULT: {passed_count}/{total_count} PASSED ===")
