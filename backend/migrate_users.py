"""
Migration to add role and is_active fields to User model
"""
from app.db.session import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Adding role column to users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR DEFAULT 'user'"))
            conn.commit()
            print("✅ Successfully added 'role' column.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column 'role' already exists.")
            else:
                print(f"Migration error for role: {e}")

        print("Adding is_active column to users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))
            conn.commit()
            print("✅ Successfully added 'is_active' column.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column 'is_active' already exists.")
            else:
                print(f"Migration error for is_active: {e}")

        print("Adding created_at column to users table...")
        try:
            conn.execute(text("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP"))
            conn.commit()
            print("✅ Successfully added 'created_at' column.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("Column 'created_at' already exists.")
            else:
                print(f"Migration error for created_at: {e}")

if __name__ == "__main__":
    migrate()