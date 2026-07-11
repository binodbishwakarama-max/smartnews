from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.v1.routers import api_router
from app.core.config import settings
from app.core.security import SecurityHeadersMiddleware, RequestLoggingMiddleware
from app.api.v1.endpoints import news
from app.api.v1.schemas import HealthResponse
from app.core.logging import setup_logging
from auth import require_admin_access
import logging
import os
import time

# Setup logging
logger = setup_logging(settings.LOG_LEVEL)

logger = logging.getLogger(__name__)

from app.core.limiter import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

@asynccontextmanager
async def lifespan(_: FastAPI):
    if settings.ENABLE_INLINE_SCRAPER_LOOP:
        try:
            import asyncio
            from jobs import run_scraper_loop

            asyncio.create_task(run_scraper_loop(interval_min=settings.SCRAPER_INTERVAL_MIN))
            logger.info("Background News Scraper Started")
        except Exception as e:
            logger.warning("Background scraper disabled. Reason: %s", e)
    else:
        logger.info("Inline background scraper loop is disabled")

    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Smart News Aggregator API with robust error handling",
    version="2.0.0",
    lifespan=lifespan,
)

# Add Rate Limit Exception Handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Add security and logging middlewares
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestLoggingMiddleware)

# Comprehensive CORS configuration
# Load from ENV or default to localhost (supports Next.js default port 3000)
# For production, set BACKEND_CORS_ORIGINS in environment variables
default_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000", 
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:3003",
    "http://127.0.0.1:3003",
    "http://localhost:3004",
    "http://127.0.0.1:3004",
    "http://localhost:3005",
    "http://127.0.0.1:3005",
    "http://localhost:3006",
    "http://127.0.0.1:3006",
    "http://localhost:3007",
    "http://127.0.0.1:3007",
    "http://localhost:8000",
    "http://127.0.0.1:8000"
]
origins = os.getenv("BACKEND_CORS_ORIGINS", ",".join(default_origins)).split(",")


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Request timeout and error handling middleware
@app.middleware("http")
async def add_process_time_and_error_handling(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response
    except Exception as e:
        logger.error(f"Global Request Crash: {str(e)}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": "Internal Server Error",
                "message": str(e) if settings.DEBUG else "An unexpected error occurred. Our team has been notified."
            }
        )

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(news.router, prefix="/news", tags=["news"])

@app.get("/health", response_model=HealthResponse)
def health_check():
    """
    Enhanced health check endpoint.

    Returns system status, database connectivity, and service information.
    Use this endpoint to monitor the health of the API service.
    """
    from datetime import datetime, timezone
    from app.db.session import engine

    health_status = {
        "status": "ok",
        "service": "Global News Backend",
        "version": "2.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    # Check database connection
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = "disconnected"
        if settings.DEBUG:
            health_status["database_error"] = str(e)
        logger.warning(f"Database health check failed: {e}")



    return health_status

@app.get("/")
def root():
    """
    Root endpoint.

    Returns welcome message and links to API documentation and health check.
    """
    return {
        "message": "Welcome to Smart News API",
        "docs": "/docs",
        "health": "/health",
        "version": "2.0.0"
    }

@app.get("/admin/stats", dependencies=[Depends(require_admin_access)])
def admin_stats():
    """
    Admin-only endpoint for detailed system statistics.

    Requires API key authentication.
    """
    from app.db.session import engine
    from sqlalchemy import text
    import psutil
    import os

    # Database stats
    db_stats = {}
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM articles"))
            db_stats["total_articles"] = result.scalar()

            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            db_stats["total_users"] = result.scalar()
    except Exception as e:
        db_stats["error"] = str(e)

    # System stats
    system_stats = {
        "cpu_percent": psutil.cpu_percent(interval=1),
        "memory_percent": psutil.virtual_memory().percent,
        "disk_usage": psutil.disk_usage(os.getcwd()).percent,
        "uptime_seconds": int(time.time() - psutil.boot_time())
    }

    return {
        "database": db_stats,
        "system": system_stats,
        "environment": os.getenv("ENVIRONMENT", "development"),
        "timestamp": time.time()
    }
