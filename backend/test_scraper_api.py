#!/usr/bin/env python3
"""Test script for scraper API endpoints"""

import os
from fastapi.testclient import TestClient
from app.main import app

# Set API key for testing
os.environ['API_KEY'] = 'smartnews-admin-key-2024'

def test_scraper_endpoints():
    client = TestClient(app)

    print("Testing scraper API endpoints...")

    # Test scraper status endpoint
    print("\n1. Testing scraper status endpoint...")
    response = client.get('/api/v1/scraper/status', headers={'X-API-Key': 'smartnews-admin-key-2024'})
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total articles: {data.get('total_articles', 0)}")
        print("✅ Scraper status endpoint working")
    else:
        print(f"❌ Error: {response.text}")

    # Test scraper trigger endpoint (without actually running it)
    print("\n2. Testing scraper trigger endpoint...")
    response = client.post('/api/v1/scraper/scrape?max_articles=5', headers={'X-API-Key': 'smartnews-admin-key-2024'})
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Message: {data.get('message', 'No message')}")
        print("✅ Scraper trigger endpoint working")
    else:
        print(f"❌ Error: {response.text}")

    print("\n🎉 Scraper API integration test completed!")

if __name__ == "__main__":
    test_scraper_endpoints()