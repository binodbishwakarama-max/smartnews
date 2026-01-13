import sqlite3
conn = sqlite3.connect('news.db')
cur = conn.cursor()
cur.execute("SELECT title, source, category FROM articles WHERE category = 'Sports' LIMIT 10")
rows = cur.fetchall()
if not rows:
    print("No sports articles found yet. Scraping might still be in progress.")
else:
    print(f"Total Sports articles found: {len(rows)}")
    for r in rows:
        print(f"Title: {r[0]} | Source: {r[1]} | Cat: {r[2]}")
conn.close()
