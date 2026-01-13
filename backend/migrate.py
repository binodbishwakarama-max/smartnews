from app.db.session import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Checking for column 'region' in 'articles'...")
        try:
            conn.execute(text("ALTER TABLE articles ADD COLUMN region VARCHAR"))
            conn.commit()
            print("Successfully added 'region' column.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("Column 'region' already exists.")
            else:
                print(f"Migration error: {e}")

if __name__ == "__main__":
    migrate()
