from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.v1.endpoints import news
from app.db.session import get_db
from app.models.article import Article, Bookmark, User
from auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[Any])
def get_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Get all bookmarked articles for current user.
    """
    bookmarks = db.query(Bookmark).filter(Bookmark.user_id == current_user.id).all()
    # Extract articles from bookmarks
    articles = [b.article for b in bookmarks if b.article]
    return articles

@router.post("/{article_id}", response_model=dict)
def add_bookmark(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Bookmark an article.
    """
    # Check if article exists
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    # Check if already bookmarked
    existing = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.article_id == article_id
    ).first()
    
    if existing:
        return {"message": "Already bookmarked"}
        
    bookmark = Bookmark(user_id=current_user.id, article_id=article_id)
    db.add(bookmark)
    db.commit()
    
    return {"message": "Article bookmarked successfully"}

@router.delete("/{article_id}", response_model=dict)
def remove_bookmark(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Remove a bookmark.
    """
    bookmark = db.query(Bookmark).filter(
        Bookmark.user_id == current_user.id,
        Bookmark.article_id == article_id
    ).first()
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
        
    db.delete(bookmark)
    db.commit()
    
    return {"message": "Bookmark removed successfully"}
