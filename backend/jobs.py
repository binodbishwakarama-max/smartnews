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

async def scrape_one_source(config: dict, source_index: int, total_sources: int):
    """Scrape a single source and publish any new articles immediately via SSE pubsub."""
    source_name = config['name']
    try:
        logger.info(f"[Live Ingest] Scraping source [{source_index+1}/{total_sources}]: {source_name}")
        count = await asyncio.to_thread(run_premium_source_scrape, config)
        if count > 0:
            logger.info(f"[Live Ingest] ✅ {source_name} → {count} new article(s) published to live feed")
        else:
            logger.debug(f"[Live Ingest] {source_name} → no new articles this pass")
        return count
    except Exception as e:
        logger.error(f"[Live Ingest] ❌ Error scraping {source_name}: {e}")
        return 0

async def run_clustering_pass():
    """Run topical clustering to group related articles."""
    try:
        from app.db.session import SessionLocal
        from app.services.clustering import cluster_recent_articles
        db = SessionLocal()
        try:
            await asyncio.to_thread(cluster_recent_articles, db)
            logger.info("[Live Ingest] Clustering pass complete.")
        finally:
            db.close()
    except Exception as cluster_err:
        logger.error(f"[Live Ingest] Clustering error: {cluster_err}")

async def run_scraper_loop(interval_min: int = 15):
    """
    Continuous rolling ingestion loop.

    Instead of scraping ALL sources in one big batch every N minutes (old behavior),
    this loop rotates through sources one by one with a short inter-source delay.
    This produces a constant trickle of fresh articles, making the SSE live feed
    feel like X or Instagram where new content appears continuously.

    The inter-source delay is computed as:
        delay = (interval_min * 60) / len(SCRAPER_CONFIG)
    So if interval_min=5 and there are 16 sources, each source is checked ~every 18s.
    The full rotation completes in interval_min minutes, then repeats immediately.
    A clustering pass runs after each full rotation.
    """
    init_db()

    total_sources = len(SCRAPER_CONFIG)
    # Spread sources evenly across the interval window
    inter_source_delay = max(10, (interval_min * 60) // total_sources)

    logger.info(
        f"[Live Ingest] 🚀 Continuous rolling ingestion started. "
        f"{total_sources} sources · ~{inter_source_delay}s between each source."
    )

    rotation = 0
    while True:
        rotation += 1
        logger.info(f"[Live Ingest] ── Rotation #{rotation} starting at {datetime.now().strftime('%H:%M:%S')} ──")

        total_new = 0
        for i, config in enumerate(SCRAPER_CONFIG):
            count = await scrape_one_source(config, i, total_sources)
            total_new += count

            # Short pause between sources — this is what creates the constant trickle
            await asyncio.sleep(inter_source_delay)

        logger.info(f"[Live Ingest] ── Rotation #{rotation} complete → {total_new} new articles total ──")

        # Run clustering after each full rotation
        await run_clustering_pass()

        # No extra sleep — the inter-source delays already consumed the full interval window.
        # If the scraping itself took longer than expected, start the next rotation immediately.

if __name__ == "__main__":
    # If run directly, start the background loop
    try:
        asyncio.run(run_scraper_loop())
    except KeyboardInterrupt:
        logger.info("Scraper loop stopped by user.")
