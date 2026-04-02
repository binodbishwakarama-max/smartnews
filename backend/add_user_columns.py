import sqlite3

def add_user_columns():
    conn = sqlite3.connect('smartnews.db')
    cursor = conn.cursor()

    try:
        # Add role column
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'")
        print("Added role column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("Role column already exists")
        else:
            print(f"Error adding role column: {e}")

    try:
        # Add is_active column
        cursor.execute("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1")
        print("Added is_active column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("is_active column already exists")
        else:
            print(f"Error adding is_active column: {e}")

    try:
        # Add created_at column
        cursor.execute("ALTER TABLE users ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP")
        print("Added created_at column")
    except sqlite3.OperationalError as e:
        if "duplicate column" in str(e):
            print("created_at column already exists")
        else:
            print(f"Error adding created_at column: {e}")

    conn.commit()
    conn.close()
    print("Migration completed")

if __name__ == "__main__":
    add_user_columns()