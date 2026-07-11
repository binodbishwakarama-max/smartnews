import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlalchemy import inspect, text

def apply_migration():
    inspector = inspect(engine)
    db_name = engine.dialect.name
    print(f"Applying schema changes for dialect: {db_name}")
    
    columns = [col['name'] for col in inspector.get_columns('articles')]
    
    new_cols = {
        "length_score": "FLOAT DEFAULT 0.0",
        "readability_sub_score": "FLOAT DEFAULT 0.0",
        "clickbait_penalty": "FLOAT DEFAULT 0.0",
        "caps_penalty": "FLOAT DEFAULT 0.0"
    }
    
    with engine.connect() as conn:
        for col_name, col_type in new_cols.items():
            if col_name not in columns:
                print(f"Adding column '{col_name}' to 'articles' table...")
                conn.execute(text(f"ALTER TABLE articles ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            else:
                print(f"Column '{col_name}' already exists in 'articles' table.")
        print("Schema update completed successfully.")

if __name__ == "__main__":
    apply_migration()
