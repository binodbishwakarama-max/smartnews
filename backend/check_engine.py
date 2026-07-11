import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import engine
from sqlalchemy import inspect

def check_db_engine():
    inspector = inspect(engine)
    db_name = engine.dialect.name
    print(f"DATABASE DIALECT DETECTED: {db_name}")
    print(f"URL: {engine.url}")
    
    tables = inspector.get_table_names()
    print(f"TABLES FOUND: {tables}")
    
    if "articles" in tables:
        columns = [col['name'] for col in inspector.get_columns('articles')]
        print(f"COLUMNS IN 'articles' TABLE: {columns}")
    else:
        print("ERROR: 'articles' table not found!")

if __name__ == "__main__":
    check_db_engine()
