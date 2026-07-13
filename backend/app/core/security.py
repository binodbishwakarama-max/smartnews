from fastapi import Request, Response, HTTPException, Depends, status
from fastapi.security import APIKeyHeader
from starlette.datastructures import MutableHeaders, Headers
from starlette.types import ASGIApp, Receive, Scope, Send
import time
import os

class SecurityHeadersMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["X-XSS-Protection"] = "1; mode=block"
                headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
                headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
                headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
                if "server" in headers:
                    del headers["server"]
            await send(message)

        await self.app(scope, receive, send_wrapper)

class RequestLoggingMiddleware:
    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        import logging
        logger = logging.getLogger(__name__)
        start_time = time.time()
        
        headers = Headers(scope=scope)
        auth_header = headers.get("Authorization")
        has_auth = "Yes" if auth_header else "No"
        auth_type = auth_header.split()[0] if auth_header else None
        path = scope.get("path", "")
        method = scope.get("method", "")
        
        client = scope.get("client")
        host = client[0] if client else "unknown"

        logger.info(f"{method} {path} - {host} - Auth: {has_auth} (Type: {auth_type})")

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                process_time = time.time() - start_time
                resp_headers = MutableHeaders(scope=message)
                resp_headers["X-Process-Time"] = str(process_time)
                status_code = message.get("status", 200)
                logger.info(f"Response: {status_code} - {process_time:.3f}s")
            await send(message)

        await self.app(scope, receive, send_wrapper)

# API Key authentication
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

def get_api_key(api_key: str = Depends(api_key_header)):
    """Validate API key for admin endpoints."""
    import secrets
    expected_api_key = os.getenv("API_KEY")
    if not expected_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API key authentication is not configured"
        )
    if not api_key or not secrets.compare_digest(api_key, expected_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )
    return api_key
