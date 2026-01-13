from app.worker import celery_app
from app.scraper.config import SOURCES, TOPIC_KEYWORDS
from app.scraper.engine import engine
from app.db.session import SessionLocal
from app.models.article import Article
from ml.quality import calculate_quality_score
from ml.cleaner import clean_text
from ml import predict
import logging
from datetime import datetime
from urllib.parse import quote

logger = logging.getLogger(__name__)

@celery_app.task
def scrape_source_task(source_name: str):
    """
    Task to scrape a specific source.
    """
    source_config = next((s for s in SOURCES if s.name == source_name), None)
    if not source_config: return
    
    links = engine.discover_links(source_config)
    process_links(links, source_config)

@celery_app.task
def crawl_keywords_task():
    """
    Crawl for specific high-value keywords across major search-friendly publishers.
    """
    db = SessionLocal()
    # Major publishers that support simple query params
    SEARCHABLE_SOURCES = [
        {"name": "BBC Search", "url": "https://www.bbc.co.uk/search?q=", "category": "World"},
        {"name": "Reuters Search", "url": "https://www.reuters.com/site-search/?query=", "category": "Business"},
        {"name": "The Guardian Search", "url": "https://www.theguardian.com/uk/search?q=", "category": "World"}
    ]
    
    for kw in TOPIC_KEYWORDS:
        for src in SEARCHABLE_SOURCES:
            search_url = src['url'] + quote(kw)
            logger.info(f"Keyword Crawl: {kw} on {src['name']}")
            
            # Use engine to discover links on search result page
            from app.scraper.config import SourceConfig
            fake_config = SourceConfig(name=src['name'], url=search_url, category=src['category'], priority=3)
            links = engine.discover_links(fake_config)
            process_links(links, fake_config)
            
    db.close()

def process_links(links, source_config):
    db = SessionLocal()
    new_count = 0
    
    for url in links:
        exists = db.query(Article).filter(Article.url == url).first()
        if exists: continue
            
        data = engine.fetch_article_content(url)
        if not data: continue
            
        q_score = calculate_quality_score(data)
        if q_score < 4.0: continue
            
        category = predict.predict_topic(data['content']) or source_config.category
        is_cb = predict.predict_clickbait(data['title'])
        
        article = Article(
            title=clean_text(data['title']),
            content=clean_text(data['content']),
            url=url,
            image_url=data['image'],
            source=source_config.name,
            region=getattr(source_config, 'region', 'Global'),
            publish_date=data['publish_date'],
            category=category,
            quality_score=q_score,
            feed_score=q_score,
            is_clickbait=is_cb
        )
        
        try:
            db.add(article)
            db.commit()
            new_count += 1
        except Exception:
            db.rollback()
            
    db.close()
    logger.info(f"Processed {len(links)} links for {source_config.name}, added {new_count}")
