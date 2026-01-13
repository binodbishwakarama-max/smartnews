import logging
import asyncio
from app.services.scraper_v2 import SCRAPER_CONFIG
from app.services.pipeline_v2 import run_premium_source_scrape
from app.db.session import engine, Base
from app.models.article import Article

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def main():
    logger.info("Starting Massive Newsroom Injection...")
    
    # Ensure tables are ready
    Base.metadata.create_all(bind=engine)
    
    total_new = 0
    # Run through all verified sources
    for config in SCRAPER_CONFIG:
        logger.info(f"--- Scraping {config['name']} ---")
        try:
            new_count = run_premium_source_scrape(config)
            total_new += new_count
            logger.info(f"Added {new_count} new articles from {config['name']}")
        except Exception as e:
            logger.error(f"Failed source {config['name']}: {e}")
            
    logger.info(f"Injection Complete. Total High-Quality Articles Added: {total_new}")

if __name__ == "__main__":
    asyncio.run(main())
