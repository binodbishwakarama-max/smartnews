import sys
import os
from sqlalchemy import text

# Add parent directory to path to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine, Base
from app.models.article import Bookmark # Ensure model is imported to be registered with Base

def migrate():
    print("🚀 Starting Bookmark database migration...")
    
    try:
        # Create all tables (will only create missing ones)
        Base.metadata.create_all(bind=engine)
        print("✅ Tables initialized successfully.")
        
        # Verify if bookmarks table exists
        with engine.connect() as conn:
            # Check for bookmarks table
            # SQLite specific check
            result = conn.execute(text("SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'"))
            if result.fetchone():
                print("💎 'bookmarks' table is ready.")
            else:
                print("❌ 'bookmarks' table was NOT created.")
                
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    migrate()
