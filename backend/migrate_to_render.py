import sqlite3
import psycopg2
import os
from psycopg2.extras import RealDictCursor
import argparse

# Load Local SQLite
SQLITE_DB = os.path.join(os.path.dirname(__file__), '..', 'rabcheck.db')

# Setup arguments for running independently if needed
parser = argparse.ArgumentParser(description="Migrate local SQLite to Render PostgreSQL")
parser.add_argument("--url", help="Render PostgreSQL DATABASE_URL", default=os.getenv("DATABASE_URL"))
args = parser.parse_args()

def migrate_data():
    database_url = args.url
    if not database_url:
        print("Error: No DATABASE_URL provided. Please set it in .env or pass via --url.")
        return

    print(f"Connecting to SQLite: {SQLITE_DB}")
    if not os.path.exists(SQLITE_DB):
        print(f"Error: Local SQLite database not found at {SQLITE_DB}")
        return

    sl_conn = sqlite3.connect(SQLITE_DB)
    sl_conn.row_factory = sqlite3.Row
    sl_cursor = sl_conn.cursor()

    print(f"Connecting to PostgreSQL: {database_url}")
    try:
        pg_conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        pg_cursor = pg_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        return

    try:
        # Initialize tables on PG if they don't exist
        print("Ensuring tables exist on PostgreSQL...")
        from database import _PG_SCHEMA
        pg_cursor.execute(_PG_SCHEMA)
        pg_conn.commit()

        # Migrate Uploads
        print("Migrating uploads table...")
        sl_cursor.execute("SELECT * FROM uploads")
        uploads = sl_cursor.fetchall()
        
        # We need to insert and keep the same ID for foreign key mapping
        upload_inserted = 0
        for row in uploads:
            # Check if exists
            pg_cursor.execute("SELECT id FROM uploads WHERE id = %s", (row['id'],))
            if not pg_cursor.fetchone():
                pg_cursor.execute("""
                    INSERT INTO uploads (id, image_path, image_data, created_at)
                    VALUES (%s, %s, %s, %s)
                """, (row['id'], row['image_path'], row['image_data'], row['created_at']))
                upload_inserted += 1
        
        # Reset sequence for uploads
        if upload_inserted > 0:
            pg_cursor.execute("SELECT setval(pg_get_serial_sequence('uploads', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM uploads;")
        print(f"Inserted {upload_inserted} new uploads.")

        # Migrate Entries
        print("Migrating entries table...")
        sl_cursor.execute("SELECT * FROM entries")
        entries = sl_cursor.fetchall()

        entry_inserted = 0
        for row in entries:
            # Check if exists
            pg_cursor.execute("SELECT id FROM entries WHERE id = %s", (row['id'],))
            if not pg_cursor.fetchone():
                pg_cursor.execute("""
                    INSERT INTO entries (
                        id, upload_id, date, deposit_time, book_no, iv_no, 
                        cheque_no, account, amount, total_amount, buyer_place, 
                        cheque_source, status, payee, amount_words, memo, 
                        branch_name, created_at
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, 
                        %s, %s, %s, %s, %s, 
                        %s, %s, %s, %s, %s, 
                        %s, %s
                    )
                """, (
                    row['id'], row['upload_id'], row['date'], row['deposit_time'], row['book_no'], row['iv_no'],
                    row['cheque_no'], row['account'], row['amount'], row['total_amount'], row['buyer_place'],
                    row['cheque_source'], row['status'], row['payee'], row['amount_words'], row['memo'],
                    row['branch_name'], row['created_at']
                ))
                entry_inserted += 1

        # Reset sequence for entries
        if entry_inserted > 0:
            pg_cursor.execute("SELECT setval(pg_get_serial_sequence('entries', 'id'), coalesce(max(id), 1), max(id) IS NOT null) FROM entries;")
        print(f"Inserted {entry_inserted} new entries.")

        pg_conn.commit()
        print("Migration completed successfully!")

    except Exception as e:
        pg_conn.rollback()
        print(f"An error occurred during migration: {e}")
    finally:
        sl_conn.close()
        pg_conn.close()

if __name__ == "__main__":
    migrate_data()
