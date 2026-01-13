import sqlite3
import requests

# 1. Check Database
conn = sqlite3.connect('news.db')
cur = conn.cursor()
cur.execute("SELECT id, title, category, feed_score, url FROM articles WHERE category LIKE '%Environment%'")
rows = cur.fetchall()
print(f"--- DB CHECK ---")
print(f"Found {len(rows)} environment articles in DB")
for r in rows[:5]:
    print(f"ID: {r[0]} | Title: {r[1]} | Score: {r[3]}")
conn.close()

# 2. Check API
try:
    r = requests.get('http://127.0.0.1:8000/api/v1/articles?category=Environment')
    data = r.json()
    print(f"\n--- API CHECK ---")
    print(f"API returned {len(data)} articles")
    if len(data) > 0:
        print(f"First title: {data[0]['title']}")
except Exception as e:
    print(f"API Error: {e}")
