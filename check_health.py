import requests
import sys
import json
import os
import time

# Set encoding for Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def check_backend_health():
    base_url = "http://127.0.0.1:8000"
    print("\n🔍 Checking Backend Health...")
    
    # 1. Basic Health Endpoint
    try:
        r = requests.get(f"{base_url}/health", timeout=5)
        if r.status_code == 200:
            print("✅ Health Endpoint: UP")
            print(f"   Response: {r.json()}")
        else:
            print(f"❌ Health Endpoint: DOWN (Status: {r.status_code})")
            return
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")
        return

    # 2. Stats Endpoint
    try:
        r = requests.get(f"{base_url}/news/stats", timeout=5)
        if r.status_code == 200:
            stats = r.json()
            print("\n📊 Database Statistics:")
            print(f"   Total Articles: {stats.get('total_articles', 'N/A')}")
            print(f"   New Today: {stats.get('new_today', 'N/A')}")
            print(f"   Status: {stats.get('status', 'Unknown')}")
        else:
            print(f"⚠️ Stats Endpoint returned {r.status_code}")
    except Exception as e:
        print(f"⚠️ Could not fetch stats: {e}")

    # 3. Content Verification
    try:
        r = requests.get(f"{base_url}/news/technology?limit=1", timeout=5)
        if r.status_code == 200:
            articles = r.json()
            print("\n📰 Content Check (Technology):")
            if articles:
                print(f"   ✅ Successfully retrieved {len(articles)} article(s)")
                print(f"   Latest: {articles[0].get('title', 'No Title')[:50]}...")
            else:
                print("   ⚠️ No articles found in Technology category")
        else:
            print(f"⚠️ Category contents verify failed: {r.status_code}")
    except Exception as e:
        print(f"⚠️ Content verification error: {e}")

if __name__ == "__main__":
    check_backend_health()
