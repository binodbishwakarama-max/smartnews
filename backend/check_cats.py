import sqlite3
conn = sqlite3.connect('news.db')
cur = conn.cursor()
cur.execute("SELECT category, count(*) FROM articles GROUP BY category")
for r in cur.fetchall():
    print(f"{r[0]}: {r[1]}")
conn.close()
