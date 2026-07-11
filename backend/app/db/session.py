from sqlalchemy import create_engine, event, text
from sqlalchemy.pool import StaticPool
from typing import Generator
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from app.core.config import settings

# Use local sqlite for dev if postgres fails (or default to postgres)
# We will use the settings.DATABASE_URL
# Handle SQLite specific args with timeout to prevent locking
if "sqlite" in settings.DATABASE_URL:
    connect_args = {
        "check_same_thread": False,
        "timeout": 30,  # Wait up to 30 seconds for locks to be released
    }
    engine_kwargs = {
        "pool_pre_ping": True,
        "connect_args": connect_args,
    }
    # Ensure in-memory SQLite persists across connections during tests
    if settings.DATABASE_URL == "sqlite:///:memory:":
        engine_kwargs["poolclass"] = StaticPool
    engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
    
    # Enable WAL mode and busy timeout on all SQLite connections
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA busy_timeout=30000")
        cursor.close()
else:
    # Production-ready PostgreSQL connection pool configuration
    # - pool_pre_ping: detects stale connections and recycles them before use
    # - pool_size: base pool size
    # - max_overflow: max additional transient connections
    # - pool_recycle: cycle connection after 30 mins to avoid Postgres server disconnects
    # - pool_timeout: wait max 30s for a free connection
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_recycle=settings.DB_POOL_RECYCLE,
        pool_timeout=settings.DB_POOL_TIMEOUT,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_and_add_columns():
    import logging
    logger = logging.getLogger(__name__)
    try:
        from sqlalchemy import inspect
        inspector = inspect(engine)
        columns = [col["name"] for col in inspector.get_columns("articles")]
        
        # Column migrations
        if "cluster_id" not in columns:
            logger.info("Migrating articles table: Adding cluster_id column...")
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE articles ADD COLUMN cluster_id INTEGER NULL"))
                
        # Index migrations for high performance scale
        indices = [idx["name"] for idx in inspector.get_indexes("articles")]
        with engine.begin() as conn:
            if "idx_articles_category_publish" not in indices:
                logger.info("Creating performance index: idx_articles_category_publish...")
                conn.execute(text("CREATE INDEX idx_articles_category_publish ON articles (category, publish_date DESC)"))
            if "idx_articles_feed_score" not in indices:
                logger.info("Creating performance index: idx_articles_feed_score...")
                conn.execute(text("CREATE INDEX idx_articles_feed_score ON articles (feed_score DESC)"))
    except Exception as e:
        logger.error(f"Failed to migrate database columns: {e}")

# Run automatic schema migration on startup
check_and_add_columns()

