import sys
import os
from collections import defaultdict

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.article import Article
from sqlalchemy import func

def check_duplicates():
    db = SessionLocal()
    try:
        # Check duplicate URLs
        dup_urls_query = db.query(
            Article.url, 
            func.count(Article.id).label('count')
        ).group_by(Article.url).having(func.count(Article.id) > 1).all()
        
        print(f"Number of duplicate URLs: {len(dup_urls_query)}")
        
        if dup_urls_query:
            print("\nDetails of duplicate URLs:")
            for url, count in dup_urls_query[:10]:
                articles = db.query(Article).filter(Article.url == url).all()
                print(f"\nURL: {url} (Count: {count})")
                for a in articles:
                    print(f"  - ID: {a.id} | Title: {a.title[:40]} | Category: {a.category} | Created: {a.created_at}")
                    
        # Check duplicate Titles
        dup_titles_query = db.query(
            Article.title, 
            func.count(Article.id).label('count')
        ).group_by(Article.title).having(func.count(Article.id) > 1).all()
        
        print(f"\nNumber of duplicate Titles: {len(dup_titles_query)}")
        
        if dup_titles_query:
            print("\nDetails of duplicate Titles (top 10):")
            for title, count in dup_titles_query[:10]:
                articles = db.query(Article).filter(Article.title == title).all()
                print(f"\nTitle: {title[:50]} (Count: {count})")
                for a in articles:
                    print(f"  - ID: {a.id} | URL: {a.url[:40]}... | Category: {a.category} | Created: {a.created_at}")
                    
    finally:
        db.close()

if __name__ == "__main__":
    check_duplicates()
