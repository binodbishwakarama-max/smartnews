from datetime import datetime
from sqlalchemy.orm import Session
from app.models.article import Article, TrendingTopic
from app.services.scraper_engine import get_scrapers
from app.db.session import SessionLocal
from app.utils.source import normalize_source_domain

from concurrent.futures import ThreadPoolExecutor, as_completed
from app.services.quality import quality_engine
from app.services.media import image_processor
import logging

logger = logging.getLogger(__name__)

from app.services.categorizer import smart_categorize

def process_and_save_article(scraper, link):
    """Worker function to process a single article"""
    db = SessionLocal()
    try:
        # Check deduplication first
        existing = db.query(Article).filter(Article.url == link).first()
        if existing: 
            return False

        data = scraper.parse_article(link)
        if not data or not data.get('content'): 
            return False
        
        # --- 1. Clean ---
        data['content'] = quality_engine.clean_text(data['content'])
        data['title'] = quality_engine.clean_text(data['title'])
        
        # --- 2. Quality Score ---
        q_metrics = quality_engine.calculate_quality_score(data['content'], data['title'])
        if q_metrics['score'] < 30: 
            print(f"Skipping low quality: {data['title'][:30]}...")
            return False
            
        # --- 3. Image Processing (Fast Check) ---
        valid_image = image_processor.process_image(data['image_url'])

        # --- 4. High-Precision NLP Classification ---
        category = smart_categorize(data['title'], data['content'], data['url'])
        
        article = Article(
            title=data['title'],
            content=data['content'],
            url=data['url'],
            image_url=valid_image,
            publish_date=data['publish_date'],
            author=data['author'],
            source=normalize_source_domain(scraper.base_url),
            category=category,
            summary=data['content'][:200] + "...", 
            quality_score=q_metrics['score'],
            readability_score=q_metrics['readability'],
            length_score=q_metrics.get('length_score', 0.0),
            readability_sub_score=q_metrics.get('readability_sub_score', 0.0),
            clickbait_penalty=q_metrics.get('clickbait_penalty', 0.0),
            caps_penalty=q_metrics.get('caps_penalty', 0.0),
            feed_score=q_metrics['score']
        )
        db.add(article)
        db.commit() # Commit IMMEDIATELY so user sees it
        print(f"Saved: {data['title'][:30]}...")
        return True
    
    except Exception as e:
        logger.error(f"Error processing {link}: {e}")
        db.rollback()
        return False
    finally:
        db.close()

def run_pipeline():
    """Main ETL Pipeline: Scrape -> Clean -> Classify -> Score -> Save"""
    scrapers = get_scrapers()
    
    # 1. Collect all links first (Fast)
    all_tasks = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        for scraper in scrapers:
            print(f"Collecting links from: {scraper.base_url}")
            try:
                links = scraper.scrape_feed()
                for link in links:
                    all_tasks.append((scraper, link))
            except Exception as e:
                print(f"Scraper failed for {scraper.base_url}: {e}")

    print(f"Found {len(all_tasks)} links. Processing in parallel...")

    # 2. Process articles in parallel (Slow part made fast)
    total_new = 0
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(process_and_save_article, scraper, link) for scraper, link in all_tasks]
        for future in as_completed(futures):
            if future.result():
                total_new += 1
    
    print(f"Pipeline finished. Added {total_new} new articles.")

if __name__ == "__main__":
    run_pipeline()
