"""
API endpoint tests for Smart News backend.
Run from project root: pytest backend/tests/ -v
Or from backend/: pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient


def test_root(client: TestClient):
    """Root endpoint returns welcome message."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data
    assert "version" in data


def test_health(client: TestClient):
    """Health check returns ok and service info."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data
    assert "version" in data


def test_articles_list(client: TestClient):
    """Articles endpoint returns list or paginated response."""
    response = client.get("/api/v1/articles/")
    assert response.status_code == 200
    data = response.json()
    assert "articles" in data
    assert isinstance(data["articles"], list)
    assert "total" in data


def test_articles_with_limit(client: TestClient):
    """Articles accepts limit and offset."""
    response = client.get("/api/v1/articles/?limit=5&offset=0")
    assert response.status_code == 200
    data = response.json()
    assert len(data["articles"]) <= 5


def test_trending(client: TestClient):
    """Trending endpoint returns list."""
    response = client.get("/api/v1/trending")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_news_stats(client: TestClient):
    """News stats returns totals."""
    response = client.get("/news/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_articles" in data


def test_news_quick_feed(client: TestClient):
    """Quick feed returns list of articles."""
    response = client.get("/news/quick-feed")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_signup_creates_user(client: TestClient):
    """Signup creates a new user and returns success."""
    response = client.post(
        "/api/v1/auth/signup",
        params={"username": "testuser_api", "password": "testpass123"},
    )
    # 200 created or 400 if user already exists from previous run
    assert response.status_code in (200, 400)
    data = response.json()
    if response.status_code == 200:
        assert "message" in data


def test_login_fails_bad_password(client: TestClient):
    """Login with wrong password returns 400."""
    response = client.post(
        "/api/v1/auth/login/access-token",
        data={"username": "nobody123", "password": "wrong"},
    )
    assert response.status_code == 400
