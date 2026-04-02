from typing import Dict
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.session import SessionLocal
from app.models.article import Article
from app.scraper.scraper import scrape_all
import logging
from datetime import datetime
from auth import require_admin_access

logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["scraper"],
    dependencies=[Depends(require_admin_access)]
)

@router.post("/scrape", response_model=Dict)
async def trigger_scraping(
    background_tasks: BackgroundTasks,
    max_articles: int = Query(50, ge=1, le=200, description="Maximum number of articles to scrape"),
):
    """
    Trigger manual scraping of news articles.

    This endpoint starts a background scraping task that will:
    1. Scrape articles from configured news sources
    2. Process and clean the content
    3. Store new articles in the database

    Args:
        max_articles: Maximum number of articles to scrape (default: 50, max: 200)

    Returns:
        Status message with scraping details
    """
    logger.info(f"Manual scraping triggered for {max_articles} articles")

    # Start scraping in background
    background_tasks.add_task(run_scraping_task, max_articles)

    return {
        "message": "Scraping started in background",
        "max_articles": max_articles,
        "status": "running",
        "timestamp": datetime.utcnow()
    }

@router.get("/status", response_model=Dict)
def get_scraping_status(db: Session = Depends(get_db)):
    """
    Get current scraping statistics and recent activity.

    Returns information about:
    - Total articles in database
    - Recent scraping activity
    - Source distribution
    """
    try:
        # Get total article count
        total_articles = db.query(Article).count()

        # Get articles by source
        from sqlalchemy import func
        source_stats = db.query(
            Article.source,
            func.count(Article.id).label('count')
        ).group_by(Article.source).all()

        # Get recent articles (last 24 hours)
        from datetime import datetime, timedelta
        yesterday = datetime.utcnow() - timedelta(hours=24)
        recent_count = db.query(Article).filter(Article.created_at >= yesterday).count()

        # Get category distribution
        category_stats = db.query(
            Article.category,
            func.count(Article.id).label('count')
        ).group_by(Article.category).all()

        return {
            "total_articles": total_articles,
            "recent_articles_24h": recent_count,
            "sources": {source: count for source, count in source_stats},
            "categories": {category: count for category, count in category_stats},
            "last_updated": datetime.utcnow()
        }

    except Exception as e:
        logger.error(f"Error getting scraping status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get scraping status")

@router.delete("/cleanup", response_model=Dict)
def cleanup_old_articles(
    days_old: int = 30,
    db: Session = Depends(get_db)
):
    """
    Remove articles older than specified days.

    Args:
        days_old: Remove articles older than this many days (default: 30)

    Returns:
        Number of articles removed
    """
    try:
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        deleted_count = db.query(Article).filter(Article.created_at < cutoff_date).delete()
        db.commit()

        logger.info(f"Cleaned up {deleted_count} articles older than {days_old} days")

        return {
            "message": f"Removed {deleted_count} articles older than {days_old} days",
            "deleted_count": deleted_count,
            "cutoff_date": cutoff_date
        }

    except Exception as e:
        db.rollback()
        logger.error(f"Error during cleanup: {e}")
        raise HTTPException(status_code=500, detail="Failed to cleanup old articles")

async def run_scraping_task(max_articles: int):
    """
    Background task to run the scraping process.
    """
    db = SessionLocal()
    try:
        logger.info(f"Starting background scraping for {max_articles} articles")

        # Run the improved scraper
        articles = scrape_all(max_articles)

        saved_count = 0
        for article_data in articles:
            try:
                # Check if article already exists
                existing = db.query(Article).filter(Article.url == article_data['url']).first()
                if existing:
                    continue

                # Create new article
                article = Article(
                    title=article_data['title'][:500],  # Limit title length
                    content=article_data['content'],
                    url=article_data['url'],
                    image_url=article_data.get('image'),
                    source=article_data.get('source', 'unknown'),
                    author=article_data.get('author'),
                    publish_date=article_data.get('publish_date'),
                    summary=article_data.get('summary'),
                    category='General',  # Default category, could be enhanced with ML
                    quality_score=5.0,  # Default quality score
                    feed_score=5.0
                )

                db.add(article)
                db.commit()
                saved_count += 1

            except Exception as e:
                logger.error(f"Error saving article {article_data.get('url')}: {e}")
                db.rollback()
                continue

        logger.info(f"Background scraping completed. Saved {saved_count} new articles out of {len(articles)} scraped")

    except Exception as e:
        logger.error(f"Error in background scraping task: {e}")
    finally:
        db.close()
