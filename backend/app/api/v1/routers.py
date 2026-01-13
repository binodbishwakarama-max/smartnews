from fastapi import APIRouter
from .endpoints import articles, trending, news

api_router = APIRouter()
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
api_router.include_router(trending.router, prefix="/trending", tags=["trending"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
