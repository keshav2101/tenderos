import asyncio
import json
import time
from datetime import datetime
import asyncio
import json
import time
from datetime import datetime
import httpx

from app.connectors.registry import _auto_discover, _CONNECTOR_CLASSES
from app.connectors.plugins.state.state_base import StateBaseConnector

# Auto discover all connectors
_auto_discover()

async def probe_connector(source_id, conn_cls, semaphore):
    async with semaphore:
        url = "https://eprocure.gov.in"
        if hasattr(conn_cls, "PORTAL_URL") and conn_cls.PORTAL_URL:
            url = conn_cls.PORTAL_URL
        elif hasattr(conn_cls, "TENDER_URL") and conn_cls.TENDER_URL:
            url = conn_cls.TENDER_URL
        elif source_id == "cppp":
            url = "https://eprocure.gov.in/cppp/latestactivetendersnew/cpppdata"
        elif source_id == "gem":
            url = "https://gem.gov.in"
            
        display_name = getattr(conn_cls, "display_name", source_id)
        
        # Determine connector type
        conn_type = "state"
        module_name = conn_cls.__module__
        if issubclass(conn_cls, StateBaseConnector):
            conn_type = getattr(conn_cls, "PORTAL_TYPE", "state")
        elif "psu" in module_name:
            conn_type = "psu"
        elif "central" in module_name:
            conn_type = "central"
            
        status = "online"
        error_msg = None
        start_time = time.time()
        
        # Configure headers to look like a real browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-IN,en;q=0.9",
        }
        
        try:
            # We bypass SSL verification to prevent cert errors from marking connectors offline
            async with httpx.AsyncClient(verify=False, timeout=8.0, headers=headers) as client:  # nosec B501
                response = await client.get(url)
                latency = int((time.time() - start_time) * 1000)
                
                if response.status_code >= 400:
                    if response.status_code == 403:
                        status = "blocked"
                        error_msg = "HTTP 403 Forbidden - Cloudflare/WAF block"
                    else:
                        status = "degraded"
                        error_msg = f"HTTP status {response.status_code}"
                else:
                    status = "online"
        except httpx.ConnectTimeout:
            status = "timeout"
            latency = int((time.time() - start_time) * 1000)
            error_msg = "Connection timeout (portal slow or unresponsive)"
        except (httpx.ConnectError, httpx.RequestError) as ce:
            status = "dns_failure"
            latency = 0
            error_msg = f"Connection error: {str(ce)}"
        except Exception as e:
            status = "offline"
            latency = int((time.time() - start_time) * 1000)
            error_msg = f"Error: {str(e)}"
            
        return {
            "source_id": source_id,
            "display_name": display_name,
            "type": conn_type,
            "url": url,
            "status": status,
            "latency_ms": latency,
            "last_checked": datetime.utcnow().isoformat() + "Z",
            "error_message": error_msg
        }

async def main():
    print(f"Starting audit for {len(_CONNECTOR_CLASSES)} connectors...")
    semaphore = asyncio.Semaphore(15) # Concurrent limit of 15
    tasks = []
    for sid, cls in _CONNECTOR_CLASSES.items():
        tasks.append(probe_connector(sid, cls, semaphore))
        
    results = await asyncio.gather(*tasks)
    
    # Save output to file inside the container
    output_path = "/tmp/connector_audit.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"Audit completed. Saved {len(results)} results to {output_path}")

if __name__ == "__main__":
    asyncio.run(main())
