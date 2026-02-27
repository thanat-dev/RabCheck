# -*- coding: utf-8 -*-
import sqlite3
import os
from contextlib import contextmanager
from config import DATABASE_PATH

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = 1")
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS uploads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_path TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            upload_id INTEGER,
            date TEXT,
            deposit_time TEXT,
            book_no TEXT,
            iv_no TEXT,
            cheque_no TEXT,
            account TEXT,
            amount REAL,
            total_amount REAL,
            buyer_place TEXT,
            cheque_source TEXT,
            status TEXT,
            payee TEXT,
            amount_words TEXT,
            memo TEXT,
            branch_name TEXT,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (upload_id) REFERENCES uploads(id)
        );
        CREATE INDEX IF NOT EXISTS idx_entries_upload ON entries(upload_id);
        CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
        """)
