from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.article import Article
from app.api.v1.schemas import Article as ArticleSchema, ArticleList

router = APIRouter(
    tags=["news"],
    responses={404: {"description": "Category not found"}}
)

def get_category_news(category: str, db: Session, limit: int = 50):
    """Get news articles for a specific category."""
    return db.query(Article).filter(
        Article.category.ilike(f"%{category}%")
    ).order_by(Article.publish_date.desc()).limit(limit).all()

@router.get("/technology", response_model=List[ArticleSchema])
def get_tech(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get technology news articles.

    Returns the latest technology news articles sorted by publish date.
    """
    return get_category_news("Technology", db, limit)

@router.get("/business", response_model=List[ArticleSchema])
def get_business(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get business news articles.

    Returns the latest business news articles sorted by publish date.
    """
    return get_category_news("Business", db, limit)

@router.get("/science", response_model=List[ArticleSchema])
def get_science(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get science news articles.

    Returns the latest science news articles sorted by publish date.
    """
    return get_category_news("Science", db, limit)

@router.get("/health", response_model=List[ArticleSchema])
def get_health(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get health news articles.

    Returns the latest health news articles sorted by publish date.
    """
    return get_category_news("Health", db, limit)

@router.get("/education", response_model=List[ArticleSchema])
def get_education(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get education news articles.

    Returns the latest education news articles sorted by publish date.
    """
    return get_category_news("Education", db, limit)

@router.get("/politics", response_model=List[ArticleSchema])
def get_politics(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get politics news articles.

    Returns the latest politics news articles sorted by publish date.
    """
    return get_category_news("Politics", db, limit)

@router.get("/world", response_model=List[ArticleSchema])
def get_world(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get world news articles.

    Returns the latest world news articles sorted by publish date.
    """
    return get_category_news("World", db, limit)

@router.get("/environment", response_model=List[ArticleSchema])
def get_environment(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get environment news articles.

    Returns the latest environment news articles sorted by publish date.
    """
    return get_category_news("Environment", db, limit)

@router.get("/ai-startups", response_model=List[ArticleSchema])
def get_ai(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get AI and startups news articles.

    Returns the latest AI and startup news articles sorted by publish date.
    """
    return get_category_news("AI & Startups", db, limit)

@router.get("/sports", response_model=List[ArticleSchema])
def get_sports(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get sports news articles.

    Returns the latest sports news articles sorted by publish date.
    """
    return get_category_news("Sports", db, limit)

@router.get("/culture", response_model=List[ArticleSchema])
def get_culture(
    db: Session = Depends(get_db),
    limit: int = Query(50, description="Maximum number of articles to return", ge=1, le=100)
):
    """
    Get culture news articles.

    Returns the latest culture news articles sorted by publish date.
    """
    return get_category_news("Culture", db, limit)

@router.get("/stats", response_model=dict)
def get_stats(db: Session = Depends(get_db)):
    """
    Get database statistics.

    Returns statistics about the total number of articles and recent activity.
    """
    try:
        total = db.query(Article).count()

        # Use SQLAlchemy's func for datetime comparison to avoid timezone issues
        from sqlalchemy import func
        from datetime import datetime, timedelta, timezone

        # Get current UTC time and calculate 24h ago
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        last_24h = db.query(Article).filter(Article.created_at >= cutoff).count()

        return {
            "total_articles": total,
            "new_today": last_24h,
            "status": "Live & Syncing"
        }
    except Exception as e:
        import logging
        from app.core.config import settings
        logging.error(f"Stats endpoint error: {e}")
        err_msg = str(e) if settings.DEBUG else "Failed to retrieve statistics"
        return {
            "total_articles": 0,
            "new_today": 0,
            "status": "Error",
            "error": err_msg
        }


@router.get("/quick-feed", response_model=List[ArticleSchema])
def get_quick_feed(
    db: Session = Depends(get_db),
    limit: int = Query(10, description="Maximum number of articles to return", ge=1, le=50)
):
    """
    Get a quick feed of recent articles.

    Returns the 10 most recent articles across all categories, sorted by publish date.
    """
    return db.query(Article).order_by(Article.publish_date.desc()).limit(limit).all()
