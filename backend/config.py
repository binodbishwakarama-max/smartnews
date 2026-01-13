from pydantic_settings import BaseSettings
from typing import List
import json

class Settings(BaseSettings):
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str = "sqlite:///./smartnews.db"
    
    # API
    API_TITLE: str = "Smart News Aggregator"
    API_VERSION: str = "1.0.0"
    API_RATE_LIMIT: int = 100
    ALLOWED_ORIGINS: str = "*"  # Changed to str, will parse in app
    
    # Scraper
    SCRAPE_INTERVAL_MIN: int = 30
    MAX_ARTICLES_PER_SOURCE: int = 20
    REQUEST_TIMEOUT: int = 10
    
    # ML
    TOPIC_MODEL_PATH: str = "ml/models/topic_model.joblib"
    CLICKBAIT_MODEL_PATH: str = "ml/models/clickbait_model.joblib"
    
    # Cache
    USE_CACHE: bool = False
    CACHE_TTL_SECONDS: int = 300
    REDIS_URL: str = "redis://localhost:6379"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/app.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def get_allowed_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS from string"""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

settings = Settings()
