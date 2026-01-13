import sqlite3
conn = sqlite3.connect('news.db')
cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM articles WHERE category='Environment' AND (image_url LIKE 'data:image%' OR image_url LIKE 'http%')")
with_images = cur.fetchone()[0]
cur.execute("SELECT COUNT(*) FROM articles WHERE category='Environment'")
total = cur.fetchone()[0]
print(f"Environment: {with_images}/{total} articles have images")
conn.close()
