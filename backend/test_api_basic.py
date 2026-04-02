
import sys
import os

# Ensure backend/ is on sys.path so `import app` works from repo root
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert "message" in response.json()

def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_news_stats():
    response = client.get("/news/stats")
    assert response.status_code == 200
    assert "total_articles" in response.json()

def test_news_quick_feed():
    response = client.get("/news/quick-feed")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
