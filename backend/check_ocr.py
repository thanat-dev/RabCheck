# -*- coding: utf-8 -*-
r"""
สคริปต์ตรวจสอบว่า Tesseract OCR พร้อมใช้งานหรือไม่
รันจากโฟลเดอร์ RabCheck:  python backend\check_ocr.py
หรือใส่ path รูป:         python backend\check_ocr.py path\to\image.jpg
"""
import os
import sys

# โฟลเดอร์โปรเจกต์ = RabCheck, โฟลเดอร์ backend (ใส่ใน path ทีหลัง เพื่อไม่ให้บังการหา pytesseract)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


def main():
    print("=" * 60)
    print("  ตรวจสอบ Tesseract OCR สำหรับ RabCheck")
    print("=" * 60)
    print("Python ที่ใช้รัน:", sys.executable)
    print()

    # 1. ตรวจสอบ Python packages ก่อน (ยังไม่เพิ่ม backend เข้า path เพื่อให้เจอ pytesseract จาก site-packages)
    try:
        import pytesseract
        print("[OK] ติดตั้ง pytesseract แล้ว")
    except ImportError as e:
        err = str(e)
        print("[!!] ยังไม่มี pytesseract:", err)
        if "find_loader" in err or "pkgutil" in err:
            print("     Python 3.14 ยังไม่รองรับ pytesseract แนะนำใช้ Python 3.12:")
            print("     ดาวน์โหลด https://www.python.org/downloads/release/python-3120/")
            print("     ติดตั้งแล้วรัน: py -3.12 backend\\check_ocr.py")
        else:
            print("     ให้รัน (ใช้ Python ตัวเดียวกับที่รันสคริปต์นี้):")
            print("     py -3.12 -m pip install pytesseract")
        return
    try:
        from PIL import Image
        print("[OK] ติดตั้ง Pillow (PIL) แล้ว")
    except ImportError:
        print("[!!] ยังไม่มี Pillow ให้รัน: py -3.14 -m pip install Pillow")
        return

    # 2. ใส่ backend เข้า path สำหรับ import config, ocr_helper ด้านล่าง
    if BACKEND_DIR not in sys.path:
        sys.path.insert(0, BACKEND_DIR)
    os.chdir(BASE_DIR)

    # 3. ตรวจสอบว่าใช้ Windows และ path มาตรฐานมีไฟล์หรือไม่
    if sys.platform == "win32":
        paths = (
            r"C:\Program Files\Tesseract-OCR\tesseract.exe",
            r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        )
        found = None
        for p in paths:
            if os.path.isfile(p):
                found = p
                break
        if found:
            print("[OK] เจอ Tesseract ที่:", found)
        else:
            print("[!!] ไม่เจอ tesseract.exe ที่ path มาตรฐาน")
            print("     ลอง path: C:\\Program Files\\Tesseract-OCR\\tesseract.exe")
            print("     ถ้าติดตั้งที่อื่น ตั้งตัวแปร TESSERACT_CMD ก่อนรัน")
            print("     ตัวอย่าง: set TESSERACT_CMD=D:\\Tesseract\\tesseract.exe")

    # 3. ตั้ง path Tesseract (ให้ตรงกับที่ ocr_helper ใช้)
    try:
        import config as backend_config
        TESSERACT_CMD = getattr(backend_config, 'TESSERACT_CMD', None)
        if TESSERACT_CMD and os.path.isfile(TESSERACT_CMD):
            pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
            print("[OK] ใช้ TESSERACT_CMD =", TESSERACT_CMD)
    except Exception:
        pass
    if not getattr(pytesseract.pytesseract, 'tesseract_cmd', None) and sys.platform == "win32":
        for p in (r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                  r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe"):
            if os.path.isfile(p):
                pytesseract.pytesseract.tesseract_cmd = p
                print("[OK] ตั้ง tesseract_cmd =", p)
                break

    # 4. ทดสอบเรียก Tesseract จริง
    print()
    print("กำลังทดสอบเรียก Tesseract...")
    try:
        version = pytesseract.get_tesseract_version()
        print("[OK] เวอร์ชัน Tesseract:", version)
    except Exception as e:
        print("[!!] เรียก Tesseract ไม่ได้:", e)
        print()
        print("แนวทางแก้:")
        print("  1. ตรวจว่าติดตั้ง Tesseract แล้ว (จากคู่มือติดตั้ง Tesseract)")
        print("  2. ถ้าติดตั้งที่โฟลเดอร์อื่น ตั้งตัวแปรก่อนรัน:")
        print('     set TESSERACT_CMD=C:\\Program Files\\Tesseract-OCR\\tesseract.exe')
        print("  3. จากนั้นรันสคริปต์นี้ใหม่อีกครั้ง")
        return

    # 5. ตรวจสอบภาษาที่ติดตั้ง
    try:
        langs = pytesseract.get_languages()
        if "tha" in langs:
            print("[OK] มีภาษา Thai (tha) ในรายการภาษา")
        else:
            print("[!!] ไม่พบภาษา Thai (tha) — ให้ติดตั้ง Tesseract ใหม่และติ๊กเลือกภาษา Thai")
        print("     ภาษาที่มี:", ", ".join(sorted(langs)[:15]) + ("..." if len(langs) > 15 else ""))
    except Exception as e:
        print("[!!] ตรวจภาษาที่ติดตั้งไม่ได้:", e)

    # 6. ถ้ามี path รูป ให้รัน OCR จริง
    image_path = None
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        if not os.path.isfile(image_path):
            # ลองเทียบกับโฟลเดอร์ uploads
            alt = os.path.join(BASE_DIR, "uploads", os.path.basename(image_path))
            if os.path.isfile(alt):
                image_path = alt
            else:
                print("[!!] ไม่พบไฟล์รูป:", sys.argv[1])
                image_path = None

    if not image_path and os.path.isdir(os.path.join(BASE_DIR, "uploads")):
        # ลองใช้รูปแรกใน uploads
        for f in os.listdir(os.path.join(BASE_DIR, "uploads")):
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".gif", ".webp")):
                image_path = os.path.join(BASE_DIR, "uploads", f)
                break

    if image_path:
        print()
        print("กำลังรัน OCR กับรูป:", image_path)
        from ocr_helper import run_ocr
        result = run_ocr(image_path)
        if result.get("ocr_error"):
            print("[!!] OCR เกิดข้อผิดพลาด:", result["ocr_error"])
        elif result.get("raw"):
            raw = result["raw"]
            print("[OK] อ่านข้อความได้ (ความยาวประมาณ %d ตัวอักษร)" % len(raw))
            if result.get("fields"):
                print("     ข้อมูลที่ดึงได้:", result["fields"])
            else:
                print("     (ยังดึง field ไม่ได้ — อาจเป็นรูปแบบรูปหรือภาษา)")
            # แสดง raw ส่วนท้าย + raw จากรูปส่วนล่าง (บรรทัด MICR) เพื่อไล่เหตุผลที่ดึงเลขเช็คไม่ได้
            tail_len = min(1200, len(raw))
            if tail_len > 0:
                print()
                print("--- ข้อความจาก OCR (ส่วนท้ายของภาพเต็ม %d ตัวอักษร) ---" % tail_len)
                print(raw[-tail_len:])
                print("--- จบส่วนท้าย ---")
            if result.get("raw_bottom"):
                rb = result["raw_bottom"]
                print()
                print("--- ข้อความจาก OCR เฉพาะส่วนล่าง 30%% ของรูป (บรรทัด MICR) ---")
                print(rb if len(rb) <= 800 else rb[-800:])
                print("--- จบส่วนล่าง ---")
        else:
            print("[!!] อ่านข้อความจากรูปไม่ได้ (raw ว่าง)")
    else:
        print()
        print("ถ้าต้องการทดสอบกับรูป ให้รัน:")
        print('  python backend\\check_ocr.py path\\to\\image.jpg')
        print("  หรืออัพโหลดรูปใน RabCheck ก่อน แล้วรันอีกครั้ง (จะใช้รูปในโฟลเดอร์ uploads)")

    print()
    print("=" * 60)

if __name__ == "__main__":
    main()
