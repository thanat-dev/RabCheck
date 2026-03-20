# -*- coding: utf-8 -*-
"""
Database layer — รองรับทั้ง SQLite (local) และ PostgreSQL (Render Cloud)
ถ้าตั้ง DATABASE_URL → ใช้ PostgreSQL
ถ้าไม่ตั้ง → ใช้ SQLite เหมือนเดิม
"""
import sqlite3
import os
from contextlib import contextmanager
from config import DATABASE_PATH, DATABASE_URL

# ---------- ตรวจว่าใช้ PostgreSQL หรือ SQLite ----------
USE_PG = bool(DATABASE_URL)

if USE_PG:
    import psycopg2
    from psycopg2.extras import RealDictCursor

# ---------- Connection ----------

def get_connection():
    if USE_PG:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        conn.autocommit = False
        return conn
    else:
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

# ---------- SQL Helpers ----------

def _q(sql):
    """แปลง placeholder ? → %s สำหรับ PostgreSQL"""
    if USE_PG:
        return sql.replace('?', '%s')
    return sql

def execute(conn, sql, params=None):
    """Execute SQL — รองรับทั้ง SQLite และ PostgreSQL"""
    sql = _q(sql)
    if USE_PG:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        return cur
    else:
        return conn.execute(sql, params or ())

def execute_returning_id(conn, sql, params=None):
    """INSERT แล้ว return id ของแถวใหม่"""
    if USE_PG:
        sql = _q(sql)
        # เพิ่ม RETURNING id ถ้ายังไม่มี
        if 'RETURNING' not in sql.upper():
            sql = sql.rstrip().rstrip(';') + ' RETURNING id'
        cur = conn.cursor()
        cur.execute(sql, params or ())
        row = cur.fetchone()
        return row['id'] if row else None
    else:
        cur = conn.execute(sql, params or ())
        return cur.lastrowid

def fetchone(conn, sql, params=None):
    """SELECT หนึ่งแถว — return dict-like object"""
    sql = _q(sql)
    if USE_PG:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        return cur.fetchone()
    else:
        return conn.execute(sql, params or ()).fetchone()

def fetchall(conn, sql, params=None):
    """SELECT หลายแถว — return list of dict-like objects"""
    sql = _q(sql)
    if USE_PG:
        cur = conn.cursor()
        cur.execute(sql, params or ())
        return cur.fetchall()
    else:
        return conn.execute(sql, params or ()).fetchall()

# ---------- Init DB ----------

_PG_SCHEMA = """
CREATE TABLE IF NOT EXISTS uploads (
    id SERIAL PRIMARY KEY,
    image_path TEXT NOT NULL,
    image_data BYTEA,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS entries (
    id SERIAL PRIMARY KEY,
    upload_id INTEGER,
    date TEXT,
    deposit_time TEXT,
    book_no TEXT,
    iv_no TEXT,
    cheque_no TEXT,
    account TEXT,
    amount DOUBLE PRECISION,
    total_amount DOUBLE PRECISION,
    buyer_place TEXT,
    cheque_source TEXT,
    status TEXT,
    payee TEXT,
    amount_words TEXT,
    memo TEXT,
    branch_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (upload_id) REFERENCES uploads(id)
);

CREATE INDEX IF NOT EXISTS idx_entries_upload ON entries(upload_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
"""

_SQLITE_SCHEMA = """
CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path TEXT NOT NULL,
    image_data BLOB,
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
"""

def init_db():
    with get_db() as conn:
        if USE_PG:
            cur = conn.cursor()
            cur.execute(_PG_SCHEMA)
            # ตรวจสอบและเพิ่มคอลัมน์ image_data ถ้ายังไม่มี
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='uploads' AND column_name='image_data'")
            if not cur.fetchone():
                print("[database] Adding image_data column to PostgreSQL uploads")
                cur.execute("ALTER TABLE uploads ADD COLUMN image_data BYTEA")
            conn.commit()
            print("[database] PostgreSQL tables ready")
        else:
            # สำหรับ SQLite
            conn.executescript(_SQLITE_SCHEMA)
            cur = conn.execute("PRAGMA table_info(uploads)")
            columns = [row[1] for row in cur.fetchall()]
            if 'image_data' not in columns:
                print("[database] Adding image_data column to SQLite uploads")
                conn.execute("ALTER TABLE uploads ADD COLUMN image_data BLOB")
            print("[database] SQLite tables ready")
