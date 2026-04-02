from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List

class ArticleBase(BaseModel):
    title: str
    content: str
    summary: Optional[str] = None
    source: str
    url: str
    image_url: Optional[str] = None
    author: Optional[str] = None
    publish_date: Optional[datetime] = None
    category: str
    region: Optional[str] = None
    tags: Optional[str] = None
    sentiment_score: float = 0.0
    bias_label: Optional[str] = None
    quality_score: float = 0.0
    readability_score: float = 0.0
    feed_score: float = 0.0
    is_featured: bool = False
    is_clickbait: bool = False
    read_time_minutes: int = 1
    view_count: int = 0

class Article(ArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class ArticleList(BaseModel):
    articles: List[Article]
    total: int
    page: int = 1
    per_page: int = 50

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    database: str
    database_error: Optional[str] = None

class TrendingTopic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    topic: str
    article_count: int
    growth_rate: float
    last_updated: Optional[datetime] = None