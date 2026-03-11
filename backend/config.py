# -*- coding: utf-8 -*-
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
DATABASE_PATH = os.path.join(BASE_DIR, 'rabcheck.db')

# PostgreSQL URL สำหรับ Cloud deploy (Render) — ถ้าไม่ตั้งจะใช้ SQLite
DATABASE_URL = os.environ.get('DATABASE_URL', '').strip() or None

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
