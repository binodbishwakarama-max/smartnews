import sys
import os
from collections import defaultdict

# Set up Python path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.article import Article

def analyze_sources():
    db = SessionLocal()
    try:
        articles = db.query(Article).all()
        if not articles:
            print("No articles found in the database.")
            return
            
        print(f"Analyzing score distributions for {len(articles)} total articles across sources...")
        
        # Group scores by source
        source_scores = defaultdict(list)
        for article in articles:
            # Scale score to 10-point scale for readability
            score_10 = article.quality_score / 10.0
            source_scores[article.source].append(score_10)
            
        # Compute and print statistics for each source
        print("\n" + "=" * 80)
        print(f"{'NEWS SOURCE':<35} | {'COUNT':<6} | {'MIN':<5} | {'MAX':<5} | {'MEDIAN':<6} | {'MEAN':<5}")
        print("-" * 80)
        
        # Sort sources by average score descending
        stats = []
        for source, scores in source_scores.items():
            scores.sort()
            n = len(scores)
            min_score = min(scores)
            max_score = max(scores)
            median_score = scores[n // 2] if n % 2 != 0 else (scores[n // 2 - 1] + scores[n // 2]) / 2
            mean_score = sum(scores) / n
            stats.append({
                "source": source,
                "count": n,
                "min": min_score,
                "max": max_score,
                "median": median_score,
                "mean": mean_score
            })
            
        # Sort by mean descending
        stats.sort(key=lambda x: x['mean'], reverse=True)
        
        for s in stats:
            # Shorten source name if too long
            src_name = s['source'][:33] if len(s['source']) > 33 else s['source']
            print(f"{src_name:<35} | {s['count']:<6d} | {s['min']:<5.1f} | {s['max']:<5.1f} | {s['median']:<6.1f} | {s['mean']:<5.1f}")
        print("=" * 80)
        
    finally:
        db.close()

if __name__ == "__main__":
    analyze_sources()
