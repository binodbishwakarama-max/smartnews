import asyncio
import logging
from app.db.session import engine, Base
from app.services.scraper_v2 import SCRAPER_CONFIG
from app.services.pipeline_v2 import run_premium_source_scrape
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def init_db():
    """Ensure all database tables are created."""
    logger.info("Initializing database...")
    Base.metadata.create_all(bind=engine)

async def run_scraper_loop(interval_min=15):
    """Background task that runs the premium news engine periodically."""
    init_db()
    scrape_count = 0
    while True:
        try:
            scrape_count += 1
            logger.info(f"Starting Newsroom Ingestion Cycle #{scrape_count} at {datetime.now()}")
            
            # Run the V2 pipeline for all sources
            total_added = 0
            for config in SCRAPER_CONFIG:
                logger.info(f"Scraping source: {config['name']}")
                count = await asyncio.to_thread(run_premium_source_scrape, config)
                total_added += count
            
            logger.info(f"Cycle #{scrape_count} complete. Added {total_added} high-quality articles.")
        except Exception as e:
            logger.exception(f"Critical error in Scrape Cycle #{scrape_count}: {e}")
        
        logger.info(f"Newsroom heartbeat: Next cycle in {interval_min} minutes.")
        await asyncio.sleep(interval_min * 60) 

if __name__ == "__main__":
    # If run directly, start the background loop
    try:
        asyncio.run(run_scraper_loop())
    except KeyboardInterrupt:
        logger.info("Scraper loop stopped by user.")
