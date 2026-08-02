import subprocess
import time
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

print("Starting 24/7 Auto-Reconnecting Serveo Tunnel Monitor...")

cmd = [
    "ssh",
    "-o", "StrictHostKeyChecking=no",
    "-o", "ServerAliveInterval=10",
    "-o", "ServerAliveCountMax=3",
    "-R", "80:127.0.0.1:8000",
    "serveo.net"
]

while True:
    try:
        print("Connecting to Serveo...")
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, encoding="utf-8", errors="replace")
        for line in proc.stdout:
            print(line, end="", flush=True)
        proc.wait()
    except Exception as e:
        print(f"Tunnel error: {e}", flush=True)
    print("Tunnel connection dropped. Reconnecting in 3 seconds...", flush=True)
    time.sleep(3)
