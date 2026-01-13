from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime


class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    image = Column(String, nullable=True)
    author = Column(String, nullable=True)
    publish_date = Column(DateTime, default=datetime.datetime.utcnow)
    source = Column(String)
    url = Column(String, unique=True, index=True)
    category = Column(String, nullable=True)
    is_clickbait = Column(Boolean, default=False)
    quality_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)


class Interaction(Base):
    __tablename__ = "interactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    article_id = Column(Integer, ForeignKey("articles.id"))
    clicked = Column(Boolean, default=False)
    liked = Column(Boolean, default=False)
    read_seconds = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
    article = relationship("Article")
