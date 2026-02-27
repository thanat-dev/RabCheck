# -*- coding: utf-8 -*-
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
DATABASE_PATH = os.path.join(BASE_DIR, 'rabcheck.db')

# Path ของ Tesseract (ถ้าว่าง ระบบจะลองหาเองที่ path มาตรฐานของ Windows)
# ตั้งค่าได้ผ่านตัวแปรสภาพ TESSERACT_CMD เช่น C:\Program Files\Tesseract-OCR\tesseract.exe
TESSERACT_CMD = os.environ.get('TESSERACT_CMD', '').strip() or None

# OCR Engine: 'tesseract' (ค่าเดิม) หรือ 'easyocr' (แม่นยำกว่าสำหรับไทย, ต้อง pip install easyocr)
OCR_ENGINE = os.environ.get('OCR_ENGINE', 'tesseract').strip().lower()

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
