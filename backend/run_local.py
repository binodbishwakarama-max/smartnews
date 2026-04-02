import os
# Force the correct database URL to avoid any environment confusion
os.environ["DATABASE_URL"] = "sqlite:///./news.db"

import uvicorn
from app.db.session import engine, Base
from app.models.article import Article, User  # Import both models

# Create tables
Base.metadata.create_all(bind=engine)

if __name__ == "__main__":
    import os
    # Force the correct database URL to avoid any environment confusion
    os.environ["DATABASE_URL"] = "sqlite:///./news.db"
    
    from app.core.config import settings
    print(f"Starting backend with FORCED DB: {settings.DATABASE_URL}")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
