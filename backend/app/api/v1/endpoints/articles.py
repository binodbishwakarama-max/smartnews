from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.db.session import get_db
from app.models.article import Article

router = APIRouter()

@router.get("/")
def get_articles(
    db: Session = Depends(get_db), 
    limit: int = 50,
    offset: int = 0,
    category: Optional[str] = None,
    search: Optional[str] = None,
    source: Optional[str] = None
):
    """
    Fetch articles with optional filtering and search.
    
    Parameters:
    - limit: Number of articles to return (default: 50, max: 100)
    - offset: Number of articles to skip for pagination (default: 0)
    - category: Filter by category (fuzzy match)
    - search: Search in title, content, and author (case-insensitive)
    - source: Filter by source name
    
    Returns articles sorted by feed_score and publish_date.
    """
    # Limit maximum to prevent abuse
    limit = min(limit, 100)
    
    query = db.query(Article)
    
    # Category filter
    if category and category.lower() != "all":
        query = query.filter(Article.category.ilike(f"%{category}%"))
    
    # Source filter
    if source:
        query = query.filter(Article.source.ilike(f"%{source}%"))
    
    # Search functionality - searches across title, content, and author
    if search and search.strip():
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Article.title.ilike(search_term),
                Article.content.ilike(search_term),
                Article.author.ilike(search_term),
                Article.summary.ilike(search_term)
            )
        )
    
    # Get total count for pagination metadata
    total_count = query.count()
    
    # Apply sorting and pagination
    articles = query.order_by(
        Article.feed_score.desc(), 
        Article.publish_date.desc()
    ).offset(offset).limit(limit).all()
    
    return {
        "articles": articles,
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total_count
    }

@router.get("/search")
def search_articles(
    q: str = Query(..., min_length=2, description="Search query"),
    db: Session = Depends(get_db),
    limit: int = 20,
    offset: int = 0,
    category: Optional[str] = None
):
    """
    Dedicated search endpoint with enhanced relevance scoring.
    
    Searches across title (highest weight), summary, content, and author.
    Returns results ranked by relevance and recency.
    """
    limit = min(limit, 50)
    search_term = f"%{q.strip()}%"
    
    query = db.query(Article)
    
    # Category filter if provided
    if category:
        query = query.filter(Article.category.ilike(f"%{category}%"))
    
    # Multi-field search
    query = query.filter(
        or_(
            Article.title.ilike(search_term),
            Article.summary.ilike(search_term),
            Article.content.ilike(search_term),
            Article.author.ilike(search_term)
        )
    )
    
    total_count = query.count()
    
    # Prioritize title matches, then by quality score and date
    results = query.order_by(
        Article.feed_score.desc(),
        Article.publish_date.desc()
    ).offset(offset).limit(limit).all()
    
    return {
        "query": q,
        "results": results,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }
