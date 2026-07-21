from fastapi import APIRouter
from .endpoints import articles, trending, news, auth, scraper, bookmarks

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(articles.router, prefix="/articles", tags=["articles"])
api_router.include_router(bookmarks.router, prefix="/bookmarks", tags=["bookmarks"])
api_router.include_router(trending.router, prefix="/trending", tags=["trending"])
api_router.include_router(news.router, prefix="/news", tags=["news"])
api_router.include_router(scraper.router, prefix="/scraper", tags=["scraper"])
