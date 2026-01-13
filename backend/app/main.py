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
