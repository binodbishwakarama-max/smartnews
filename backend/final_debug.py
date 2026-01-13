import sqlite3
import requests

# Check Database
conn = sqlite3.connect('news.db')
cur = conn.cursor()
cur.execute("SELECT DISTINCT category FROM articles")
cats = [r[0] for r in cur.fetchall()]
print(f"Categories in DB: {cats}")

cur.execute("SELECT count(*) FROM articles WHERE category = 'Environment'")
count = cur.fetchone()[0]
print(f"Exact 'Environment' count: {count}")

# Check API
try:
    r = requests.get('http://127.0.0.1:8000/api/v1/articles?category=Environment')
    j = r.json()
    print(f"API (/api/v1/articles?category=Environment) returned {len(j)} items")
    
    r2 = requests.get('http://127.0.0.1:8000/news/environment')
    j2 = r2.json()
    print(f"API (/news/environment) returned {len(j2)} items")
except Exception as e:
    print(f"API Error: {e}")
conn.close()
