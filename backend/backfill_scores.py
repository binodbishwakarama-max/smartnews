import sys
import os

# Set up Python path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.article import Article
from app.services.quality import quality_engine

def run_backfill():
    db = SessionLocal()
    try:
        articles = db.query(Article).all()
        print(f"Loaded {len(articles)} articles for quality score backfilling...")
        
        updated_count = 0
        for article in articles:
            metrics = quality_engine.calculate_quality_score(article.content, article.title)
            
            # Update columns
            article.quality_score = metrics['score']
            article.feed_score = metrics['score']
            article.length_score = metrics['length_score']
            article.readability_sub_score = metrics['readability_sub_score']
            article.clickbait_penalty = metrics['clickbait_penalty']
            article.caps_penalty = metrics['caps_penalty']
            
            updated_count += 1
            if updated_count % 200 == 0:
                db.commit()
                print(f"Processed and committed {updated_count} articles...")
                
        db.commit()
        print(f"Backfill complete! Successfully updated {updated_count} articles.")
        
    except Exception as e:
        db.rollback()
        print(f"Backfill failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_backfill()
