from celery import Celery
import os

# Define Redis connection with fallback
REDIS_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "smartnews_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.news_tasks.schedule_scraping": {"queue": "scheduler"},
        "app.tasks.news_tasks.scrape_source_task": {"queue": "scraper"},
        "app.tasks.news_tasks.analyze_trends_task": {"queue": "analysis"},
        "app.tasks.news_tasks.crawl_keywords_task": {"queue": "scraper"},
        "app.tasks.scraper_tasks.scrape_news_task": {"queue": "scraper"},
        "app.tasks.scraper_tasks.daily_cleanup_task": {"queue": "maintenance"},
    },
)

# Celery Beat Schedule for Periodic Tasks
celery_app.conf.beat_schedule = {
    "scrape-breaking-news-every-5-mins": {
        "task": "app.tasks.news_tasks.schedule_scraping",
        "schedule": 300.0, # 5 minutes
        "args": (1,) # Priority 1
    },
    "scrape-general-news-every-15-mins": {
        "task": "app.tasks.news_tasks.schedule_scraping",
        "schedule": 900.0, # 15 minutes
        "args": (2,) # Priority 2
    },
    "scrape-deep-dives-every-hour": {
        "task": "app.tasks.news_tasks.schedule_scraping",
        "schedule": 3600.0, # 1 hour
        "args": (3,) # Priority 3
    },
    "update-trending-topics": {
        "task": "app.tasks.news_tasks.analyze_trends_task",
        "schedule": 1800.0, # 30 mins
    },
    "crawl-keywords-every-2-hours": {
        "task": "app.tasks.news_tasks.crawl_keywords_task",
        "schedule": 7200.0, # 2 hours
    },
    "daily-news-scrape": {
        "task": "app.tasks.scraper_tasks.scrape_news_task",
        "schedule": 3600.0, # 1 hour - run frequently for fresh content
        "args": (50,) # Scrape up to 50 articles per run
    },
    "weekly-cleanup": {
        "task": "app.tasks.scraper_tasks.daily_cleanup_task",
        "schedule": 604800.0, # 7 days
        "args": (30,) # Remove articles older than 30 days
    }
}

# Import tasks only after the Celery app exists to avoid circular imports.
import app.tasks.news_tasks  # noqa: E402,F401
import app.tasks.scraper_tasks  # noqa: E402,F401
