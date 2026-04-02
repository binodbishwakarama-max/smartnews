
import sqlite3
import os

# Ensure we use the same database as the running app
DB_FILE = 'news.db'

def check_users():
    if not os.path.exists(DB_FILE):
        print(f"Database {DB_FILE} not found!")
        return

    try:
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        
        cur.execute("SELECT username, hashed_password FROM users")
        users = cur.fetchall()
        
        if not users:
            print("No users found in the database.")
        else:
            print(f"Found {len(users)} users:")
            for u in users:
                print(f" - {u[0]}")
                
        conn.close()
    except Exception as e:
        print(f"Error checking users: {e}")

if __name__ == "__main__":
    check_users()