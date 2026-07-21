import logging
import re
import hashlib
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.article import Article
from app.services.scraper_v2 import scraper_v2
from app.services.categorizer import smart_categorize
from app.services.deduplicator import deduplicator
from app.utils.source import normalize_source_domain
from app.services.quality import quality_engine

logger = logging.getLogger(__name__)


def generate_slug(title: str, url: str) -> str:
    """Generate a URL-safe slug from article title + url hash for uniqueness."""
    if not title:
        return hashlib.md5(url.encode()).hexdigest()[:12]
    # Lowercase, replace non-alphanum with hyphens, collapse multiples
    slug = re.sub(r'[^a-z0-9]+', '-', title.lower().strip()).strip('-')
    # Truncate to 80 chars and append short hash for uniqueness
    slug = slug[:80].rstrip('-')
    url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
    return f"{slug}-{url_hash}"


def calculate_read_time(content: str) -> int:
    """Estimate read time in minutes (avg 200 words/min)."""
    if not content:
        return 1
    word_count = len(content.split())
    minutes = max(1, round(word_count / 200))
    return minutes

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
        
        # 3. Check for Semantic / Fallback Title Duplicates
        recent_cutoff = datetime.now(timezone.utc) - timedelta(days=2)
        recent_articles = db.query(Article).filter(Article.created_at >= recent_cutoff).limit(1000).all()
        
        if embedding:
            recent_embeddings = [a.embedding for a in recent_articles if a.embedding]
            if deduplicator.is_duplicate(embedding, recent_embeddings):
                logger.info(f"Duplicate detected via semantic similarity: {data['title']}")
                return False
        else:
            # Fallback to Jaccard title-similarity check
            recent_titles = [a.title for a in recent_articles]
            if deduplicator.is_duplicate_title(data['title'], recent_titles):
                logger.info(f"Duplicate detected via fallback title Jaccard similarity: {data['title']}")
                return False

        # 4. Smart Categorization with Hint
        category = smart_categorize(data['title'], data['content'], data['url'], hint_category)
        
        # 5. Handle missing images with beautiful placeholders
        image_url = data.get('image_url')
        if not image_url or image_url.strip() == '':
            from app.utils.placeholder_images import generate_placeholder_image
            image_url = generate_placeholder_image(category, data['title'])
        
        # Calculate dynamic quality scores using quality_engine
        q_metrics = quality_engine.calculate_quality_score(data['content'], data['title'])
        
        # 6. Save to DB
        article = Article(
            title=data['title'],
            slug=generate_slug(data['title'], data['url']),
            content=data['content'],
            url=data['url'],
            image_url=image_url,
            publish_date=data['publish_date'],
            author=data['author'],
            source=normalize_source_domain(source_name),
            category=category,
            embedding=embedding,
            quality_score=q_metrics['score'],
            readability_score=q_metrics['readability'],
            length_score=q_metrics['length_score'],
            readability_sub_score=q_metrics['readability_sub_score'],
            clickbait_penalty=q_metrics['clickbait_penalty'],
            caps_penalty=q_metrics['caps_penalty'],
            feed_score=q_metrics['score'],
            read_time_minutes=calculate_read_time(data['content']),
            summary=data['content'][:250] + "..."
        )
        db.add(article)
        db.commit()
        
        # Refresh to get DB-generated ID and default fields
        db.refresh(article)
        
        # Publish real-time event to SSE listeners
        try:
            from app.core.pubsub import pubsub
            pubsub.publish({
                "id": article.id,
                "title": article.title,
                "summary": article.summary,
                "url": article.url,
                "image_url": article.image_url,
                "category": article.category,
                "source": article.source,
                "publish_date": article.publish_date.isoformat() if article.publish_date else datetime.now(timezone.utc).isoformat(),
                "quality_score": article.quality_score,
                "feed_score": article.feed_score
            })
        except Exception as pub_err:
            logger.error(f"Failed to publish new article event: {pub_err}")
            
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
