from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.article import Article

router = APIRouter()

def get_category_news(category: str, db: Session, limit: int = 50):
    return db.query(Article).filter(
        Article.category.ilike(f"%{category}%")
    ).order_by(Article.publish_date.desc()).limit(limit).all()

@router.get("/technology")
def get_tech(db: Session = Depends(get_db)):
    return get_category_news("Technology", db)

@router.get("/business")
def get_business(db: Session = Depends(get_db)):
    return get_category_news("Business", db)

@router.get("/science")
def get_science(db: Session = Depends(get_db)):
    return get_category_news("Science", db)

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    return get_category_news("Health", db)

@router.get("/education")
def get_education(db: Session = Depends(get_db)):
    return get_category_news("Education", db)

@router.get("/politics")
def get_politics(db: Session = Depends(get_db)):
    return get_category_news("Politics", db)

@router.get("/world")
def get_world(db: Session = Depends(get_db)):
    return get_category_news("World", db)

@router.get("/environment")
def get_environment(db: Session = Depends(get_db)):
    return get_category_news("Environment", db)

@router.get("/ai-startups")
def get_ai(db: Session = Depends(get_db)):
    return get_category_news("AI & Startups", db)

@router.get("/sports")
def get_sports(db: Session = Depends(get_db)):
    return get_category_news("Sports", db)

@router.get("/culture")
def get_culture(db: Session = Depends(get_db)):
    return get_category_news("Culture", db)

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Article).count()
    # Articles in last 24h
    from datetime import datetime, timedelta
    last_24h = db.query(Article).filter(Article.created_at >= datetime.utcnow() - timedelta(hours=24)).count()
    return {
        "total_articles": total,
        "new_today": last_24h,
        "status": "Live & Syncing"
    }

@router.get("/quick-feed")
def get_quick_feed(db: Session = Depends(get_db)):
    return db.query(Article).order_by(Article.publish_date.desc()).limit(10).all()
