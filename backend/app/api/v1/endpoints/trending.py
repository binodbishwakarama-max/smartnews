from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.article import TrendingTopic

router = APIRouter()

@router.get("/")
def get_trending(db: Session = Depends(get_db)):
    """
    Returns the top current trending keywords/topics.
    """
    return db.query(TrendingTopic).order_by(TrendingTopic.article_count.desc()).limit(10).all()
