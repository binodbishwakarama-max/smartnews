import logging
from app.worker import celery_app
from app.services.scraper_v2 import SCRAPER_CONFIG
from app.services.pipeline_v2 import run_premium_source_scrape
from app.db.session import SessionLocal
from app.models.article import Article, TrendingTopic
from sqlalchemy import func
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

@celery_app.task(name="app.tasks.scheduler.schedule_scraping")
def schedule_scraping(priority: int):
    """
    Priority 1: Breaking News sources (Reuters, AP, Bloomberg)
    Priority 2: Category specific (TechCrunch, Wired, Nature)
    Priority 3: Deep Dives / Local (The Hindu, EdSurge)
    """
    priority_mapping = {
        1: ['Reuters', 'Associated Press', 'Bloomberg', 'CNN', 'BBC'],
        2: ['TechCrunch', 'The Verge', 'Wired', 'Nature', 'Science Daily', 'Bloomberg'],
        3: ['EdSurge', 'Medical News Today', 'The Hindu', 'NDTV', 'Hacker News']
    }
    
    selected_sources = priority_mapping.get(priority, [])
    
    total_new = 0
    for config in SCRAPER_CONFIG:
        if config['name'] in selected_sources:
            logger.info(f"Triggering scrape for {config['name']}")
            # Use delay to run in parallel workers
            scrape_source_task.delay(config)
    
    return f"Scheduled {len(selected_sources)} sources for priority {priority}"

@celery_app.task(name="app.tasks.scraper.scrape_source_task")
def scrape_source_task(source_config: dict):
    """Worker task to scrape a single source"""
    return run_premium_source_scrape(source_config)

@celery_app.task(name="app.tasks.analysis.analyze_trends_task")
def analyze_trends_task():
    """
    Calculate trending topics by looking at keyword frequency changes 
    in the last 24 hours vs last 7 days.
    """
    db = SessionLocal()
    try:
        # Simple trending logic: Most frequent categories/keywords in recent articles
        # In a real system, we'd use NLTK/SpaCy for entity extraction
        recent_cutoff = datetime.utcnow() - timedelta(hours=24)
        articles = db.query(Article).filter(Article.created_at >= recent_cutoff).all()
        
        topic_counts = {}
        for art in articles:
            topic_counts[art.category] = topic_counts.get(art.category, 0) + 1
            
        # Update TrendingTopic table
        for topic, count in topic_counts.items():
            existing = db.query(TrendingTopic).filter(TrendingTopic.topic == topic).first()
            if existing:
                existing.article_count = count
                existing.last_updated = datetime.utcnow()
            else:
                new_topic = TrendingTopic(topic=topic, article_count=count)
                db.add(new_topic)
        
        db.commit()
        return f"Updated {len(topic_counts)} trending topics"
    except Exception as e:
        logger.error(f"Trend analysis failed: {e}")
        db.rollback()
    finally:
        db.close()
