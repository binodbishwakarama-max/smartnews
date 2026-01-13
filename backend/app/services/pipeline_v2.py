import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.article import Article
from app.services.scraper_v2 import scraper_v2
from app.services.categorizer import smart_categorize
from app.services.deduplicator import deduplicator

logger = logging.getLogger(__name__)

def process_and_save_refined_article(data: dict, source_name: str, hint_category: str = None) -> bool:
    """Refined Article Pipeline: Clean -> Embed -> Deduplicate -> Categorize -> Save"""
    db = SessionLocal()
    try:
        # 1. Quick Deduplication by URL
        existing = db.query(Article).filter(Article.url == data['url']).first()
        if existing:
            return False

        # 2. Generate Embedding (Semantic Deduplication)
        embedding = deduplicator.get_embedding(f"{data['title']}\n{data['content'][:500]}")
        
        # 3. Check for Semantic Duplicates
        recent_cutoff = datetime.utcnow() - timedelta(days=2)
        recent_articles = db.query(Article).filter(Article.created_at >= recent_cutoff).limit(1000).all()
        recent_embeddings = [a.embedding for a in recent_articles if a.embedding]
        
        if deduplicator.is_duplicate(embedding, recent_embeddings):
            return False

        # 4. Smart Categorization with Hint
        category = smart_categorize(data['title'], data['content'], data['url'], hint_category)
        
        # 5. Handle missing images with beautiful placeholders
        image_url = data.get('image_url')
        if not image_url or image_url.strip() == '':
            from app.utils.placeholder_images import generate_placeholder_image
            image_url = generate_placeholder_image(category, data['title'])
        
        # 6. Save to DB
        article = Article(
            title=data['title'],
            content=data['content'],
            url=data['url'],
            image_url=image_url,
            publish_date=data['publish_date'],
            author=data['author'],
            source=source_name,
            category=category,
            embedding=embedding,
            quality_score=80.0,
            feed_score=80.0,
            summary=data['content'][:250] + "..."
        )
        db.add(article)
        db.commit()
        return True
    except Exception as e:
        logger.error(f"Error in premium pipeline: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def run_premium_source_scrape(source_config: dict):
    """Orchestrate scrape for a single source"""
    new_count = 0
    
    for feed_url, category_hint in source_config['feeds']:
        links = scraper_v2.get_links(feed_url)
        for link in links[:15]:
            article_data = scraper_v2.parse_article(link)
            if article_data:
                if process_and_save_refined_article(article_data, source_config['name'], category_hint):
                    new_count += 1
                
    return new_count
