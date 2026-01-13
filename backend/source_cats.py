import sqlite3
conn = sqlite3.connect('news.db')
cur = conn.cursor()
cur.execute("SELECT source, category, count(*) FROM articles GROUP BY source, category ORDER BY source")
for r in cur.fetchall():
    print(f"{r[0]:30} | {r[1]:20} | {r[2]}")
conn.close()
