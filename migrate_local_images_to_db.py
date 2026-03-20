import os
import sqlite3
import psycopg2
from psycopg2.extras import RealDictCursor

# Config - Use values from your config or environment
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DATABASE_PATH = os.path.join(BASE_DIR, 'rabcheck.db')
DATABASE_URL = os.environ.get('DATABASE_URL')

USE_PG = bool(DATABASE_URL)

def get_connection():
    if USE_PG:
        return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    else:
        conn = sqlite3.connect(DATABASE_PATH)
        conn.row_factory = sqlite3.Row
        return conn

def migrate_existing_images():
    print("Starting migration of existing images to database...")
    conn = get_connection()
    try:
        if USE_PG:
            cur = conn.cursor()
            cur.execute("SELECT id, image_path FROM uploads WHERE image_data IS NULL")
            rows = cur.fetchall()
        else:
            rows = conn.execute("SELECT id, image_path FROM uploads WHERE image_data IS NULL").fetchall()

        print(f"Found {len(rows)} images to migrate.")
        count = 0
        for row in rows:
            filename = row['image_path']
            path = os.path.join(UPLOAD_FOLDER, filename)
            if os.path.exists(path):
                with open(path, 'rb') as f:
                    data = f.read()
                
                if USE_PG:
                    cur.execute("UPDATE uploads SET image_data = %s WHERE id = %s", (data, row['id']))
                else:
                    conn.execute("UPDATE uploads SET image_data = ? WHERE id = ?", (sqlite3.Binary(data), row['id']))
                count += 1
                if count % 10 == 0:
                    print(f"Migrated {count} images...")
            else:
                print(f"Warning: File not found for {filename}")

        conn.commit()
        print(f"Finished! Successfully migrated {count} images to the database.")
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_existing_images()
