from sqlalchemy import create_engine
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
else:
    engine = create_engine(
        settings.DATABASE_URL, 
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
