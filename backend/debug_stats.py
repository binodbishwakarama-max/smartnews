import sqlite3
from datetime import datetime, timedelta

def get_stats():
    conn = sqlite3.connect('news.db')
    cur = conn.cursor()
    
    print("="*50)
    print(f" SMART NEWSROOM MONITORING DASHBOARD - {datetime.now().strftime('%H:%M:%S')} ")
    print("="*50)
    
    # Total Articles
    cur.execute("SELECT count(*) FROM articles")
    total = cur.fetchone()[0]
    print(f"Total High-Quality Articles: {total}")
    
    # Last Hour
    hour_ago = datetime.utcnow() - timedelta(hours=1)
    cur.execute("SELECT count(*) FROM articles WHERE created_at >= ?", (hour_ago,))
    last_hour = cur.fetchone()[0]
    print(f"Ingested in Last Hour: {last_hour}")
    
    print("\n--- CATEGORY DISTRIBUTION ---")
    cur.execute("SELECT category, count(*) FROM articles GROUP BY category ORDER BY count(*) DESC")
    for cat, count in cur.fetchall():
        bar = "█" * int(count/total * 20) if total > 0 else ""
        print(f"{cat:20} | {count:5} {bar}")
        
    print("\n--- TOP SOURCES ---")
    cur.execute("SELECT source, count(*) FROM articles GROUP BY source ORDER BY count(*) DESC LIMIT 5")
    for src, count in cur.fetchall():
        print(f"{src:20} | {count:5}")
        
    print("\n--- LIVE TRENDING TOPICS ---")
    cur.execute("SELECT topic, article_count FROM trending_topics ORDER BY article_count DESC")
    for topic, count in cur.fetchall():
        print(f"#{topic:20} | Active Stories: {count}")
        
    print("="*50)
    conn.close()

if __name__ == "__main__":
    get_stats()
