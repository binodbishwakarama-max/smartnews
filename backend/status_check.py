
import sqlite3
from datetime import datetime, timedelta

def check():
    try:
        conn = sqlite3.connect('news.db')
        cur = conn.cursor()
        
        # Total Articles
        cur.execute("SELECT count(*) FROM articles")
        total = cur.fetchone()[0]
        
        # Articles with images
        cur.execute("SELECT count(*) FROM articles WHERE image_url IS NOT NULL AND image_url != ''")
        with_images = cur.fetchone()[0]
        
        # Last hour
        hour_ago = datetime.utcnow() - timedelta(hours=1)
        cur.execute("SELECT count(*) FROM articles WHERE created_at >= ?", (hour_ago,))
        last_hour = cur.fetchone()[0]
        
        # Categories
        cur.execute("SELECT category, count(*) FROM articles GROUP BY category")
        categories = cur.fetchall()
        
        print(f"Total Articles: {total}")
        print(f"With Images: {with_images}")
        print(f"Ingested Last Hour: {last_hour}")
        print("Categories:")
        for cat, count in categories:
            print(f"  - {cat}: {count}")
            
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    check()
