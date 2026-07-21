from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.db.session import get_db
from app.models.article import Article
from app.core.limiter import limiter

router = APIRouter()

@router.get("")
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
    
    # Exclude non-lead duplicate cluster articles in main feed requests
    # Bypassed if doing specific text search or source filter to keep those searches transparent
    if not (search and search.strip()) and not source:
        query = query.filter(or_(Article.cluster_id == None, Article.cluster_id == Article.id))
    
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
    
    # Batch query all duplicate coverage to avoid N+1 query performance bottleneck
    cluster_ids = {a.cluster_id for a in articles if a.cluster_id is not None}
    duplicates_by_cluster = {}
    if cluster_ids:
        all_duplicates = db.query(Article).filter(
            Article.cluster_id.in_(list(cluster_ids))
        ).all()
        for dup in all_duplicates:
            duplicates_by_cluster.setdefault(dup.cluster_id, []).append(dup)

    # Serialize articles with duplicate coverage metadata
    serializable_articles = []
    for a in articles:
        other_sources = []
        if a.cluster_id:
            duplicates = [
                dup for dup in duplicates_by_cluster.get(a.cluster_id, [])
                if dup.id != a.id
            ]
            
            seen_sources = {}
            for dup in duplicates:
                src_name = (dup.source or "").strip().lower()
                if src_name:
                    if src_name not in seen_sources or (dup.quality_score or 0) > (seen_sources[src_name].quality_score or 0):
                        seen_sources[src_name] = dup
            
            other_sources = [
                {
                    "id": dup.id,
                    "source": dup.source,
                    "url": dup.url,
                    "title": dup.title,
                    "quality_score": dup.quality_score
                }
                for dup in seen_sources.values()
            ]
        
        art_dict = {
            "id": a.id,
            "title": a.title,
            "slug": a.slug,
            "content": a.content,
            "summary": a.summary,
            "source": a.source,
            "url": a.url,
            "image_url": a.image_url,
            "author": a.author,
            "publish_date": a.publish_date,
            "category": a.category,
            "region": a.region,
            "tags": a.tags,
            "sentiment_score": a.sentiment_score,
            "bias_label": a.bias_label,
            "quality_score": a.quality_score,
            "feed_score": a.feed_score,
            "is_featured": a.is_featured,
            "is_clickbait": a.is_clickbait,
            "read_time_minutes": a.read_time_minutes,
            "view_count": a.view_count,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
            "other_sources": other_sources
        }
        serializable_articles.append(art_dict)
    
    return {
        "articles": serializable_articles,
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
    
    # Serialize results to dicts to avoid JSON serialization errors
    serialized_results = [
        {
            "id": a.id,
            "title": a.title,
            "slug": a.slug,
            "content": a.content,
            "summary": a.summary,
            "source": a.source,
            "url": a.url,
            "image_url": a.image_url,
            "author": a.author,
            "publish_date": a.publish_date,
            "category": a.category,
            "region": a.region,
            "tags": a.tags,
            "sentiment_score": a.sentiment_score,
            "quality_score": a.quality_score,
            "feed_score": a.feed_score,
            "is_featured": a.is_featured,
            "is_clickbait": a.is_clickbait,
            "read_time_minutes": a.read_time_minutes,
            "view_count": a.view_count,
            "created_at": a.created_at,
            "updated_at": a.updated_at,
        }
        for a in results
    ]
    
    return {
        "query": q,
        "results": serialized_results,
        "total": total_count,
        "limit": limit,
        "offset": offset
    }

@router.get("/stream")
async def stream_articles(request: Request):
    """
    Server-Sent Events (SSE) stream for real-time article ingest broadcasts.
    Clients receive new articles instantly as they are crawled and indexed.
    """
    from fastapi.responses import StreamingResponse
    import json
    import asyncio
    from app.core.pubsub import pubsub

    async def event_generator():
        # Get subscriber queue
        queue = pubsub.subscribe()
        try:
            while True:
                # Disconnect if client leaves
                if await request.is_disconnected():
                    break
                    
                try:
                    # Non-blocking wait for next article message (timeout allows client heartbeat checks)
                    article_data = await asyncio.wait_for(queue.get(), timeout=25.0)
                    yield f"data: {json.dumps(article_data)}\n\n"
                except asyncio.TimeoutError:
                    # Send a keep-alive heartbeat comment to prevent browser timeout disconnects
                    yield ": heartbeat\n\n"
                    
        except asyncio.CancelledError:
            pass
        finally:
            pubsub.unsubscribe(queue)

    headers = {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
    }
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers=headers
    )

@router.get("/tts")
@limiter.limit("30/minute")
async def stream_tts(text: str, request: Request):
    """
    Proxy text-to-speech requests to Google Translate TTS to bypass browser referrer/CORS blocks.
    """
    import urllib.parse
    import httpx
    import io
    from fastapi.responses import StreamingResponse
    from fastapi import HTTPException

    if not text.strip():
        raise HTTPException(status_code=400, detail="Text parameter is required")

    # Limit text to 200 chars to satisfy Google TTS requirements
    clean_text = text.strip()
    if len(clean_text) > 200:
        clean_text = clean_text[:197] + "..."

    # Google TTS URL
    encoded_text = urllib.parse.quote(clean_text)
    url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=en&client=tw-ob&q={encoded_text}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, timeout=10.0)
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch TTS from upstream service")
                
            return StreamingResponse(
                io.BytesIO(response.content),
                media_type="audio/mpeg"
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"TTS Proxy Error: {str(e)}")

@router.get("/{article_id}")
def get_article_by_id(article_id: int, db: Session = Depends(get_db)):
    """
    Fetch a single article by its ID.
    """
    from fastapi import HTTPException
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.post("/{article_id}/view")
@limiter.limit("10/minute")
def increment_view_count(article_id: int, request: Request, db: Session = Depends(get_db)):
    """
    Increment the view_count for an article.
    Called by the frontend when a reader opens an article in ReaderModal.
    Returns the updated view count.
    """
    from sqlalchemy import update
    db.execute(
        update(Article)
        .where(Article.id == article_id)
        .values(view_count=Article.view_count + 1)
    )
    db.commit()
    article = db.query(Article.view_count).filter(Article.id == article_id).first()
    return {"view_count": article.view_count if article else 1}
