import sqlite3

conn = sqlite3.connect('news.db')
cur = conn.cursor()

# Check articles without images in Environment
cur.execute("SELECT id, title, image_url FROM articles WHERE category = 'Environment' AND (image_url IS NULL OR image_url = '')")
no_img = cur.fetchall()
print(f"Environment articles without images: {len(no_img)}")
for r in no_img[:5]:
    print(f"ID {r[0]}: {r[1]}")

# Check overall
cur.execute("SELECT category, COUNT(*) FROM articles WHERE image_url IS NULL OR image_url = '' GROUP BY category")
print("\n--- Articles without images by category ---")
for r in cur.fetchall():
    print(f"{r[0]}: {r[1]}")

conn.close()
