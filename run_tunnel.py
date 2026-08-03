import subprocess
import time
import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Fixed subdomain — URL never changes across restarts
SUBDOMAIN = "tenderos-api"
TUNNEL_URL = f"https://{SUBDOMAIN}.serveo.net"
SSH_KEY = os.path.expanduser("~/.ssh/id_ed25519")

print(f"Starting 24/7 Auto-Reconnecting Serveo Tunnel Monitor...")
print(f"Fixed URL: {TUNNEL_URL}")

cmd = [
    "ssh",
    "-i", SSH_KEY,
    "-o", "StrictHostKeyChecking=no",
    "-o", "ServerAliveInterval=10",
    "-o", "ServerAliveCountMax=3",
    "-R", f"{SUBDOMAIN}:80:127.0.0.1:8000",
    "serveo.net"
]

while True:
    try:
        print("Connecting to Serveo...", flush=True)
        proc = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace"
        )
        for line in proc.stdout:
            print(line, end="", flush=True)
        proc.wait()
    except Exception as e:
        print(f"Tunnel error: {e}", flush=True)
    print("Tunnel dropped. Reconnecting in 3s...", flush=True)
    time.sleep(3)
