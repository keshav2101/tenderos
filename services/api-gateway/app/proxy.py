"""Proxy client — forwards requests to downstream microservices."""
from typing import Any, Dict, Optional
import httpx
import structlog
from fastapi import HTTPException, Request

logger = structlog.get_logger()


class ServiceProxy:
    """Thin HTTP proxy to a downstream service with timeout and error handling."""

    def __init__(self, base_url: str, timeout: float = 30.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _prepare_headers(self, headers: Optional[Dict], request: Optional[Request]) -> Dict[str, str]:
        fwd_headers = {k.lower(): v for k, v in (headers or {}).items()}
        if request:
            # Automatically forward JWT / API keys and Tenant context
            for header_name in ["authorization", "x-api-key", "x-tenant-id"]:
                val = request.headers.get(header_name)
                if val:
                    fwd_headers[header_name] = val
        return fwd_headers

    async def get(self, path: str, params: Optional[Dict] = None, headers: Optional[Dict] = None, request: Optional[Request] = None) -> Any:
        fwd_headers = self._prepare_headers(headers, request)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(
                    f"{self.base_url}{path}", params=params, headers=fwd_headers
                )
                return self._handle(resp)
            except httpx.TimeoutException:
                raise HTTPException(status_code=504, detail=f"Service timeout: {self.base_url}")
            except httpx.ConnectError:
                raise HTTPException(status_code=503, detail=f"Service unavailable: {self.base_url}")

    async def post(self, path: str, json: Any = None, headers: Optional[Dict] = None, request: Optional[Request] = None) -> Any:
        fwd_headers = self._prepare_headers(headers, request)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(
                    f"{self.base_url}{path}", json=json, headers=fwd_headers
                )
                return self._handle(resp)
            except httpx.TimeoutException:
                raise HTTPException(status_code=504, detail=f"Service timeout: {self.base_url}")
            except httpx.ConnectError:
                raise HTTPException(status_code=503, detail=f"Service unavailable: {self.base_url}")

    async def put(self, path: str, json: Any = None, headers: Optional[Dict] = None, request: Optional[Request] = None) -> Any:
        fwd_headers = self._prepare_headers(headers, request)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.put(f"{self.base_url}{path}", json=json, headers=fwd_headers)
            return self._handle(resp)

    async def delete(self, path: str, headers: Optional[Dict] = None, request: Optional[Request] = None) -> Any:
        fwd_headers = self._prepare_headers(headers, request)
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.delete(f"{self.base_url}{path}", headers=fwd_headers)
            return self._handle(resp)

    def _handle(self, resp: httpx.Response) -> Any:
        if resp.status_code >= 400:
            try:
                detail = resp.json().get("detail", resp.text)
            except Exception:
                detail = resp.text
            raise HTTPException(status_code=resp.status_code, detail=detail)
        if resp.status_code == 204:
            return None
        return resp.json()
