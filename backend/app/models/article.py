from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON
from sqlalchemy.sql import func
from app.db.session import Base

class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    slug = Column(String, unique=True, index=True)
    content = Column(Text)
    summary = Column(Text, nullable=True)
    
    source = Column(String, index=True)
    url = Column(String, unique=True)
    image_url = Column(String, nullable=True)
    
    author = Column(String, nullable=True)
    publish_date = Column(DateTime(timezone=True), nullable=True)
    
    category = Column(String, index=True)
    region = Column(String, index=True, nullable=True) # US, Europe, Asia, India, etc.
    tags = Column(String, nullable=True) # Comma-separated or JSON
    
    # ML Fields
    sentiment_score = Column(Float, default=0.0)
    bias_label = Column(String, nullable=True)
    embedding = Column(JSON, nullable=True) 

    # Quality & Ranking Fields
    quality_score = Column(Float, default=0.0, index=True)
    readability_score = Column(Float, default=0.0)
    feed_score = Column(Float, default=0.0, index=True)
    is_featured = Column(Boolean, default=False)
    is_clickbait = Column(Boolean, default=False)
    
    # Metrics
    read_time_minutes = Column(Integer, default=1)
    view_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class TrendingTopic(Base):
    __tablename__ = "trending_topics"
    
    id = Column(Integer, primary_key=True)
    topic = Column(String, unique=True)
    article_count = Column(Integer, default=0)
    growth_rate = Column(Float, default=0.0)
    last_updated = Column(DateTime(timezone=True), server_default=func.now())
