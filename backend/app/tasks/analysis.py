from app.worker import celery_app
from app.db.session import SessionLocal
from app.models.article import Article, TrendingTopic
from sqlalchemy import func
from datetime import datetime, timedelta
import logging
from collections import Counter
import re

logger = logging.getLogger(__name__)

@celery_app.task
def analyze_trends_task():
    """
    Analyzes article volume in the last 12 hours to detect trending topics.
    Updates the trending_topics table.
    """
    logger.info("Starting Trend Analysis...")
    db = SessionLocal()
    
    try:
        # 1. Get articles from the last 12 hours
        window = datetime.utcnow() - timedelta(hours=12)
        recent_articles = db.query(Article).filter(Article.publish_date >= window).all()
        
        if not recent_articles:
            logger.info("Not enough data for trend analysis.")
            return

        # 2. Extract keywords from titles (naive approach)
        all_words = []
        stop_words = {'the', 'a', 'in', 'on', 'at', 'for', 'with', 'and', 'is', 'are', 'to', 'of', 'how', 'why', 'what', 'new', 'more'}
        
        for art in recent_articles:
            # Clean title and tokenize
            words = re.findall(r'\w+', art.title.lower())
            filtered = [w for w in words if len(w) > 3 and w not in stop_words]
            all_words.extend(filtered)
            
        # 3. Count frequencies
        topic_counts = Counter(all_words).most_common(10) # Top 10 words
        
        # 4. Update TrendingTopic table
        # Clear old trends (simplified)
        db.query(TrendingTopic).delete()
        
        for topic, count in topic_counts:
            obj = TrendingTopic(
                topic=topic.capitalize(),
                article_count=count,
                growth_rate=1.0 # placeholder
            )
            db.add(obj)
            
        db.commit()
        logger.info(f"Trend Analysis complete. Top topic: {topic_counts[0][0] if topic_counts else 'None'}")
        
        # 5. Promote highly trending articles to "Featured"
        top_topic = topic_counts[0][0] if topic_counts else None
        if top_topic:
            high_quality_recent = db.query(Article).filter(
                Article.title.ilike(f"%{top_topic}%"),
                Article.publish_date >= window
            ).order_by(Article.quality_score.desc()).first()
            
            if high_quality_recent:
                # Promotion logic: could set is_featured = True
                high_quality_recent.feed_score += 2.0
                db.commit()

    except Exception as e:
        logger.error(f"Trend Analysis Failed: {e}")
        db.rollback()
    finally:
        db.close()
