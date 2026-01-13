from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.routers import api_router
from app.core.config import settings
from app.api.v1.endpoints import news

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(news.router, prefix="/news", tags=["news"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Global News Backend"}

@app.get("/")
def root():
    return {
        "message": "Welcome to Smart News API",
        "docs": "/docs",
        "health": "/health"
    }

from app.services.scraper_v2 import SCRAPER_CONFIG
from app.services.pipeline_v2 import run_premium_source_scrape
from fastapi import BackgroundTasks
import asyncio

@app.get("/force-scrape")
async def force_scrape_root(background_tasks: BackgroundTasks):
    async def job():
        for config in SCRAPER_CONFIG:
            try:
                print(f"Scraping {config['name']}...")
                await asyncio.to_thread(run_premium_source_scrape, config)
            except Exception as e:
                print(e)
    background_tasks.add_task(job)
    return {"status": "Scraper Started (Root)"}
