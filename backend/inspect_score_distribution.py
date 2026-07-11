import sys
import os
import math
from collections import Counter

# Set up Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.article import Article
from app.services.quality import quality_engine

def analyze_distribution():
    db = SessionLocal()
    try:
        articles = db.query(Article).limit(200).all()
        if not articles:
            print("No articles found in the database to score.")
            return
            
        scores = []
        for article in articles:
            metrics = quality_engine.calculate_quality_score(article.content, article.title)
            # Scale to 10-point index like the frontend display
            index_score = metrics['score'] / 10.0
            scores.append(index_score)
            
        scores.sort()
        n = len(scores)
        
        # Stats
        min_score = min(scores)
        max_score = max(scores)
        median_score = scores[n // 2] if n % 2 != 0 else (scores[n // 2 - 1] + scores[n // 2]) / 2
        mean_score = sum(scores) / n
        
        print("\n=== AI INDEX SCORE SIMULATION (OUT OF 10.0) ===")
        print(f"Sample size: {n} articles")
        print(f"Min Score:   {min_score:.1f}")
        print(f"Max Score:   {max_score:.1f}")
        print(f"Median:      {median_score:.1f}")
        print(f"Mean:        {mean_score:.1f}")
        
        # ASCII Histogram
        buckets = [0] * 11  # 0 to 10
        for s in scores:
            idx = min(10, max(0, int(math.floor(s))))
            buckets[idx] += 1
            
        print("\n--- Distribution Histogram ---")
        for i in range(11):
            bar = "#" * int(buckets[i] * 40 / max(1, max(buckets)))
            print(f"{i:2d}.0 - {i:2d}.9 | {buckets[i]:3d} | {bar}")
            
    finally:
        db.close()

if __name__ == "__main__":
    analyze_distribution()
