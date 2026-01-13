from app.worker import celery_app
from app.tasks.scraper import scrape_source_task
from app.scraper.config import SOURCES
import logging

logger = logging.getLogger(__name__)

@celery_app.task
def schedule_scraping(priority: int):
    """
    Dispatcher task that queues scraping jobs based on priority.
    """
    logger.info(f"Scheduling scrapes for Priority {priority} sources...")
    
    count = 0
    for source in SOURCES:
        if source.priority == priority:
            # Dispatch async task for this source
            scrape_source_task.delay(source.name)
            count += 1
            
    logger.info(f"Dispatched {count} scraping tasks.")
