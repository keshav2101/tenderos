import urllib.request
import re

url = "https://tenderos-neon.vercel.app/login"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode()
        print("HTML fetched, finding JS script tags...")
        scripts = re.findall(r'src="(/_next/static/[^"]+)"', html)
        print(f"Found {len(scripts)} scripts")
        for s in scripts:
            js_url = "https://tenderos-neon.vercel.app" + s
            try:
                js_req = urllib.request.Request(js_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(js_req) as js_resp:
                    js_code = js_resp.read().decode()
                    if "loca.lt" in js_code:
                        print(f"🚨 FOUND OLD LOCALTUNNEL URL IN BUNDLE: {s}")
                    if "serveousercontent.com" in js_code:
                        print(f"✅ FOUND SERVEO URL IN BUNDLE: {s}")
                    urls = re.findall(r'https://[a-zA-Z0-9\.\-]+', js_code)
                    relevant = [u for u in set(urls) if "vercel" not in u and "w3.org" not in u and "google" not in u and "react" not in u]
                    if relevant:
                        print(f"   URLs in {s}:", relevant)
            except Exception as e:
                print(f"Error reading {s}:", e)
except Exception as e:
    print("Error fetching login page:", e)
