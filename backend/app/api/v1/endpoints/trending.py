from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.article import TrendingTopic
from app.api.v1.schemas import TrendingTopic as TrendingTopicSchema

router = APIRouter(
    prefix="/trending",
    tags=["trending"],
    responses={404: {"description": "Trending topics not found"}}
)

@router.get("/", response_model=List[TrendingTopicSchema])
def get_trending(
    db: Session = Depends(get_db),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of trending topics to return")
):
    """
    Get trending topics.

    Returns the top trending keywords/topics sorted by article count.
    These topics are dynamically calculated based on recent article content.
    """
    return db.query(TrendingTopic).order_by(TrendingTopic.article_count.desc()).limit(limit).all()
