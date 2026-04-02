
import os
import sys

# Force the correct database URL to match run_local.py
os.environ["DATABASE_URL"] = "sqlite:///./news.db"

# Add current directory to path so we can import app modules
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models.article import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_user(username, password):
    db = SessionLocal()
    try:
        # Check if user exists
        existing_user = db.query(User).filter(User.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists. Updating password...")
            existing_user.hashed_password = get_password_hash(password)
        else:
            print(f"Creating user '{username}'...")
            new_user = User(
                username=username,
                hashed_password=get_password_hash(password)
            )
            db.add(new_user)
        
        db.commit()
        print(f"Successfully created/updated user '{username}' with password '{password}'")
        
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--username", default="admin")
    parser.add_argument("--password", default="admin123")
    args = parser.parse_args()
    
    create_user(args.username, args.password)
