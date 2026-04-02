"""
Pytest configuration and fixtures for Smart News backend.
Uses in-memory SQLite for tests to avoid touching dev database.
"""
import os
import sys
from pathlib import Path
import pytest

# Ensure backend/ is on sys.path so `import app` works from repo root
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Use in-memory SQLite for tests (before app imports session)
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["DEBUG"] = "false"
os.environ["ENABLE_INLINE_SCRAPER_LOOP"] = "false"
# Use a hashing scheme that doesn't depend on external bcrypt backend in tests
os.environ["PASSWORD_HASH_SCHEME"] = "pbkdf2_sha256"

# Optional: reduce logging noise during tests
os.environ["LOG_LEVEL"] = "WARNING"


@pytest.fixture(scope="session")
def app():
    """FastAPI app with test database."""
    # Import models so tables are registered with SQLAlchemy metadata
    import app.models.article  # noqa: F401
    from app.main import app
    from app.db.session import Base, engine
    Base.metadata.create_all(bind=engine)
    return app


@pytest.fixture
def client(app):
    """Test client for API requests."""
    from fastapi.testclient import TestClient
    return TestClient(app)
