from app.worker import celery_app
from app.scraper.scraper import scrape_all
from app.db.session import SessionLocal
from app.models.article import Article
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.scraper_tasks.scrape_news_task")
def scrape_news_task(max_articles: int = 100):
    """
    Celery task to scrape news articles and store them in the database.

    Args:
        max_articles: Maximum number of articles to scrape and store

    Returns:
        Dict with scraping results
    """
    logger.info(f"Starting scheduled scraping task for {max_articles} articles")

    db = SessionLocal()
    try:
        # Run the improved scraper
        articles_data = scrape_all(max_articles)

        saved_count = 0
        skipped_count = 0
        error_count = 0

        for article_data in articles_data:
            try:
                # Check if article already exists (by URL)
                existing = db.query(Article).filter(Article.url == article_data['url']).first()
                if existing:
                    skipped_count += 1
                    continue

                # Create new article with basic processing
                article = Article(
                    title=article_data['title'][:500],  # Limit title length
                    content=article_data['content'],
                    url=article_data['url'],
                    image_url=article_data.get('image'),
                    source=article_data.get('source', 'unknown'),
                    author=article_data.get('author'),
                    publish_date=article_data.get('publish_date'),
                    summary=article_data.get('summary'),
                    category='General',  # Default category - could be enhanced with ML
                    quality_score=5.0,  # Default quality score
                    feed_score=5.0,
                    region='Global'  # Default region
                )

                db.add(article)
                db.commit()
                saved_count += 1

            except Exception as e:
                logger.error(f"Error saving article {article_data.get('url')}: {e}")
                db.rollback()
                error_count += 1
                continue

        result = {
            "status": "completed",
            "scraped_count": len(articles_data),
            "saved_count": saved_count,
            "skipped_count": skipped_count,
            "error_count": error_count,
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Scheduled scraping completed: {result}")
        return result

    except Exception as e:
        logger.error(f"Error in scheduled scraping task: {e}")
        db.rollback()
        return {
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()

@celery_app.task(name="app.tasks.scraper_tasks.daily_cleanup_task")
def daily_cleanup_task(days_old: int = 30):
    """
    Celery task to clean up old articles.

    Args:
        days_old: Remove articles older than this many days

    Returns:
        Dict with cleanup results
    """
    logger.info(f"Starting daily cleanup task for articles older than {days_old} days")

    db = SessionLocal()
    try:
        from datetime import datetime, timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=days_old)

        # Get count before deletion for reporting
        old_count = db.query(Article).filter(Article.created_at < cutoff_date).count()

        # Delete old articles
        deleted_count = db.query(Article).filter(Article.created_at < cutoff_date).delete()
        db.commit()

        result = {
            "status": "completed",
            "deleted_count": deleted_count,
            "old_count": old_count,
            "cutoff_date": cutoff_date.isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Daily cleanup completed: {result}")
        return result

    except Exception as e:
        logger.error(f"Error in daily cleanup task: {e}")
        db.rollback()
        return {
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
    finally:
        db.close()
