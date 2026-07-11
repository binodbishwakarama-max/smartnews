from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart News Aggregator"
    API_V1_STR: str = "/api/v1"
    
    # Database
    # Fallback to SQLite if no Docker/Postgres available
    DATABASE_URL: str = "sqlite:///./news.db"
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_POOL_TIMEOUT: int = 30
    
    # Security
    SECRET_KEY: str = "CHANGE_THIS_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    CLERK_ISSUER: str = "https://premium-tiger-15.clerk.accounts.dev"
    
    # Debug mode
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENABLE_INLINE_SCRAPER_LOOP: bool = True
    SCRAPER_INTERVAL_MIN: int = 30
    ADMIN_IDENTIFIERS: str = ""
    
    # Connection settings
    REQUEST_TIMEOUT: int = 30  # seconds
    MAX_CONNECTIONS: int = 100
    
    # Celery & Redis
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    
    # ML Models
    SENTENCE_TRANSFORMER_MODEL: str = "all-MiniLM-L6-v2"
    
    model_config = SettingsConfigDict(
        env_file=(".env", "backend/.env"),
        extra="ignore",
    )

    @field_validator("DEBUG", "ENABLE_INLINE_SCRAPER_LOOP", mode="before")
    @classmethod
    def parse_boolish(cls, value: Any) -> Any:
        if value is None or isinstance(value, bool):
            return value

        if isinstance(value, (int, float)):
            return bool(value)

        if isinstance(value, str):
            normalized = value.strip().lower()
            truthy = {"1", "true", "yes", "on", "debug", "development", "dev"}
            falsy = {"0", "false", "no", "off", "release", "prod", "production"}
            if normalized in truthy:
                return True
            if normalized in falsy:
                return False

        return value

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        db_display = self.DATABASE_URL.split("@")[-1] if "@" in self.DATABASE_URL else self.DATABASE_URL
        print(f"[OK] Loaded Config with DB: {db_display}")
        
        # Security validation for settings
        if self.SECRET_KEY == "CHANGE_THIS_IN_PRODUCTION":
            if not self.DEBUG:
                raise ValueError(
                    "CRITICAL CONFIG ERROR: SECRET_KEY cannot remain set to "
                    "'CHANGE_THIS_IN_PRODUCTION' in a production environment."
                )
            else:
                import logging
                logging.getLogger(__name__).warning(
                    "SECRET_KEY is insecure. Change it in production environments."
                )

settings = Settings()
