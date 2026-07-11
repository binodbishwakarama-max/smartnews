import sys
import os

# Set up Python path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.article import Article
from app.utils.source import normalize_source_domain

def run_migration():
    db = SessionLocal()
    try:
        articles = db.query(Article).all()
        print(f"Loaded {len(articles)} articles for normalization.")
        
        updated_count = 0
        for article in articles:
            normalized = normalize_source_domain(article.source)
            if article.source != normalized:
                print(f"Normalizing: '{article.source}' -> '{normalized}'")
                article.source = normalized
                updated_count += 1
                
        if updated_count > 0:
            db.commit()
            print(f"Successfully normalized and committed {updated_count} article sources.")
        else:
            print("All article sources are already normalized. No changes needed.")
            
    except Exception as e:
        db.rollback()
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
