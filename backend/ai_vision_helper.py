# -*- coding: utf-8 -*-
"""
ใช้ AI (Google Gemini) ดูภาพเช็คแล้วดึงเลขที่เช็ค (8 หลัก) ออกมา
ต้องตั้งค่า GEMINI_API_KEY ใน environment และติดตั้ง google-generativeai (pip install google-generativeai)
"""
import os
import re


def get_cheque_no_from_vision(image_path):
    """
    ส่งรูปไปให้ AI (Gemini) ดู แล้วขอเฉพาะเลขที่เช็ค (8 หลัก)
    คืนค่าเป็น str 8 หลัก หรือ None ถ้าไม่มี API key / อ่านไม่ได้ / error
    """
    api_key = (os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY') or '').strip()
    if not api_key or not image_path or not os.path.isfile(image_path):
        return None

    try:
        import google.generativeai as genai
    except ImportError:
        return None

    try:
        from PIL import Image
        genai.configure(api_key=api_key)
        model_name = (os.environ.get('GEMINI_VISION_MODEL') or 'gemini-1.5-flash').strip() or 'gemini-1.5-flash'
        model = genai.GenerativeModel(model_name)

        img = Image.open(image_path)
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')

        prompt = """Look at the MICR line at the very bottom of this Thai bank check (one line of numbers and symbols).
The CHECK NUMBER (เลขที่เช็ค) is the 8-digit number that appears BETWEEN two identical symbols (e.g. between ⑈ and ⑈). It usually starts with 88 (e.g. 88024339, 88021832).
Do NOT use the 9-digit number (049107008). Reply with ONLY the 8-digit check number, nothing else. If you cannot see it, reply: NONE"""

        response = model.generate_content([prompt, img])
        text = (response.text or '').strip().upper()
        if text == 'NONE' or not text:
            return None
        # รวบรวมเลข 8 หลักทั้งหมดที่ AI ตอบมา
        all_8 = re.findall(r'\b(\d{8})\b', text)
        if not all_8:
            digits = re.sub(r'\D', '', text)
            if len(digits) == 9 and digits.startswith('04'):
                return None
            if len(digits) >= 8:
                all_8 = [digits[i:i+8] for i in range(0, len(digits)-7)]
        # เลือกตัวที่ขึ้นต้น 88 ก่อน (เลขเช็คใน MICR เป็น 88xxxxxx) — ไม่ใช้เลขบัญชี 04xxxxxx
        for cand in all_8:
            if cand.startswith('88'):
                return cand
        for cand in all_8:
            if not cand.startswith('04'):
                return cand
        if all_8:
            return all_8[0]
        return None
    except Exception:
        return None
