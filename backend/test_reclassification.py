"""
Reclassification test — runs the NEW categorizer logic against all DB articles
and compares the result with the currently stored category.

This script uses the stored category as the feed-hint prior (which mirrors what
the live pipeline does — the feed config already supplies hint_category at
ingestion time).
"""
import sys, os
from collections import Counter

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.article import Article
from app.services.categorizer import smart_categorize   # uses the UPDATED module


def run():
    db = SessionLocal()
    try:
        articles = db.query(Article).all()
        total = len(articles)
        print(f"Reclassification test — {total} articles\n")

        changes = []
        for art in articles:
            hint = art.category if art.category != "General" else None
            new_cat = smart_categorize(art.title, art.content, art.url, hint_category=hint)
            if new_cat != art.category:
                changes.append((art, art.category, new_cat))

        changed = len(changes)
        print(f"(a) Category CHANGED: {changed} / {total}  ({changed/total*100:.1f}%)")
        print(f"    Category STABLE:  {total - changed} / {total}  ({(total-changed)/total*100:.1f}%)\n")

        pairs = Counter()
        for _, old, new in changes:
            pairs[(old, new)] += 1

        print("Top shifts:")
        for (old, new), count in pairs.most_common(15):
            print(f"  {old:25s} → {new:25s}  ({count})")

        print(f"\n(b) Sample of {min(10, changed)} changed articles for spot-check:")
        print("=" * 110)
        for i, (art, old, new) in enumerate(changes[:10]):
            print(f"  #{i+1}")
            print(f"  Title:   {art.title!r}")
            print(f"  Source:  {art.source}  |  URL: {art.url}")
            print(f"  Old cat: {old}")
            print(f"  New cat: {new}")
            print(f"  Snippet: {art.content[:180]}…")
            print("-" * 110)
    finally:
        db.close()


if __name__ == "__main__":
    run()
