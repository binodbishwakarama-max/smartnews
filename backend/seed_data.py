import random
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.models.article import Article

def seed_welcome_articles():
    db: Session = SessionLocal()
    
    welcome_articles = [
        {
            "title": "Welcome to Smart News: AI-Powered Journalism",
            "summary": "This is a local instance of the Smart News engine. Accessing real-time global news feeds...",
            "content": "Welcome to your local news aggregator. The system is currently scraping live data from Reuters, AP, and BBC. Refresh this page in 60 seconds to see the latest headlines appearing.",
            "source": "System",
            "category": "Technology",
            "image_url": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000",
            "feed_score": 100
        },
        {
            "title": "Global Market Update: Live Data Stream Active",
            "summary": "Real-time connection established with global financial centers.",
            "content": "Tracking major indices and market movers. The backend scraper is currently processing data from Bloomberg and Reuters Finance.",
            "source": "Markets",
            "category": "Business",
            "image_url": "https://images.unsplash.com/photo-1611974765270-ca1258547430?auto=format&fit=crop&q=80&w=1000",
            "feed_score": 90
        },
        {
            "title": "Scientific Breakthroughs: Weekly Roundup",
            "summary": "Curated science updates from Nature and Science Magazine.",
            "content": "Analyzing latest publications. Our AI deduplication engine ensures you see unique stories only.",
            "source": "Science Daily",
            "category": "Science",
            "image_url": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=1000",
            "feed_score": 85
        }
    ]

    print("🌱 Seeding initial welcome articles...")
    for article_data in welcome_articles:
        # Check if exists
        exists = db.query(Article).filter(Article.title == article_data["title"]).first()
        if not exists:
            art = Article(
                title=article_data["title"],
                summary=article_data["summary"],
                content=article_data["content"],
                source=article_data["source"],
                category=article_data["category"],
                image_url=article_data["image_url"],
                feed_score=article_data["feed_score"],
                url=f"local://welcome-{random.randint(1000,9999)}",
                publish_date=datetime.utcnow()
            )
            db.add(art)
    
    db.commit()
    print("✅ Seed data inserted.")

if __name__ == "__main__":
    seed_welcome_articles()
