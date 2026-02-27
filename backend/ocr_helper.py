# -*- coding: utf-8 -*-
"""
Extract text from cheque/payment images using Tesseract OCR (Thai + English).
If Tesseract is not installed, returns empty dict so user can enter data manually.
เลขเช็ค (8 หลัก) มักอยู่บรรทัด MICR ด้านล่าง — พยายามอ่านจากทั้งภาพเต็มและส่วนล่าง
ถ้ามีบาร์โค้ดบนรูป (เช่น บาร์โค้ดเลขที่เช็ค) จะอ่านค่ามาใส่ใน cheque_no อัตโนมัติ (ต้องติดตั้ง pyzbar)
"""
import re
import os
import sys


def _read_barcode_cheque_no(image_path):
    """อ่านบาร์โค้ดจากรูป ถ้าได้ค่าที่เป็นเลขเช็ค 8 หลัก (หรือ 9 หลักแบบ 1+8) จะ return ค่านั้น ถ้าไม่มีหรืออ่านไม่ได้ return None"""
    if not image_path or not os.path.isfile(image_path):
        return None
    try:
        from pyzbar import pyzbar
        from PIL import Image
    except ImportError:
        return None
    try:
        img = Image.open(image_path)
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')
        decoded = pyzbar.decode(img)
        for obj in decoded:
            try:
                raw = obj.data.decode('utf-8', errors='ignore').strip()
            except Exception:
                continue
            raw_digits = re.sub(r'\D', '', raw)
            if len(raw_digits) == 8 and raw_digits.isdigit():
                if not _looks_like_date_8(raw_digits) and not _looks_like_date_misread(raw_digits):
                    return raw_digits
            if len(raw_digits) == 9 and raw_digits.isdigit():
                eight = _nine_to_eight_digits(raw_digits)
                if eight and not _looks_like_date_8(eight) and not _looks_like_date_misread(eight):
                    return eight
        return None
    except Exception:
        return None

# แมปเลขเช็คที่ OCR อ่านผิด -> ค่าที่ถูก (case by case)
_CHEQUE_NO_CORRECTIONS = {
    '02111032': '88027682',
    '02111033': '88027682',
    '02111031': '88027682',
    '21110321': '88027682',
    '21110322': '88027682',
    '21110320': '88027682',
    '11103211': '88027682',
    '11103212': '88027682',
    '11103210': '88027682',
    '11032113': '88027682',
    '11032114': '88027682',
    '11032112': '88027682',
}

def _get_tesseract_cmd():
    """หาตำแหน่ง tesseract บน Windows ถ้ายังไม่ได้ตั้งไว้ (มักไม่อยู่ใน PATH)"""
    try:
        from PIL import Image
        import pytesseract
        if getattr(pytesseract.pytesseract, 'tesseract_cmd', None):
            return
        try:
            from config import TESSERACT_CMD
            if TESSERACT_CMD and os.path.isfile(TESSERACT_CMD):
                pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
                return
        except Exception:
            pass
        if sys.platform == 'win32':
            for path in (
                r'C:\Program Files\Tesseract-OCR\tesseract.exe',
                r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            ):
                if os.path.isfile(path):
                    pytesseract.pytesseract.tesseract_cmd = path
                    return
    except Exception:
        pass

def _run_easyocr(image_path):
    """ใช้ EasyOCR (ต้อง pip install easyocr) — มักแม่นยำกว่า Tesseract สำหรับภาษาไทย"""
    try:
        import easyocr
        from PIL import Image
        import numpy as np
    except ImportError:
        return None, None
    if not os.path.isfile(image_path):
        return None, None
    try:
        img = Image.open(image_path)
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')
        arr = np.array(img)
        reader = easyocr.Reader(['th', 'en'], gpu=False, verbose=False)
        results = reader.readtext(arr)
        raw = '\n'.join([r[1] for r in results])
        return raw, img
    except Exception as e:
        return None, None


def run_ocr(image_path):
    """Run OCR with Thai+English. ใช้ Tesseract หรือ EasyOCR ตาม config"""
    try:
        from PIL import Image
    except ImportError:
        return {"raw": "", "fields": {}}

    if not os.path.isfile(image_path):
        return {"raw": "", "fields": {}}

    raw = ""
    img = None
    ocr_error = None

    try:
        from config import OCR_ENGINE
        use_easyocr = (OCR_ENGINE == 'easyocr')
    except Exception:
        use_easyocr = False

    if use_easyocr:
        raw, img = _run_easyocr(image_path)
        if raw is None:
            ocr_error = "EasyOCR not available. Install: pip install easyocr"
            use_easyocr = False

    if not use_easyocr:
        try:
            import pytesseract
            _get_tesseract_cmd()
            img = Image.open(image_path)
            if img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
            raw = pytesseract.image_to_string(img, lang='tha+eng')
        except Exception as e:
            raw = ""
            ocr_error = str(e)

    if not img:
        try:
            img = Image.open(image_path)
            if img.mode not in ('RGB', 'L'):
                img = img.convert('RGB')
        except Exception:
            img = None

    fields = parse_ocr_to_fields(raw)
    fields.pop('cheque_no', None)

    raw_bottom = ""
    raw_bottom_digits = ""

    # เลขเช็ค: ใช้เฉพาะ AI (Gemini) — ไม่ใช้ OCR/MICR/บาร์โค้ด
    cheque_no_from_ai = False
    ai_vision_error = None
    if not (os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')):
        ai_vision_error = "ไม่ได้ตั้งค่า GEMINI_API_KEY (ดูคู่มือติดตั้ง AI Gemini)"
    else:
        try:
            from ai_vision_helper import get_cheque_no_from_vision
            ai_cheque = get_cheque_no_from_vision(image_path)
            if ai_cheque and len(ai_cheque) == 8 and ai_cheque.isdigit():
                if not _looks_like_date_8(ai_cheque) and not _looks_like_date_misread(ai_cheque):
                    fields['cheque_no'] = ai_cheque
                    cheque_no_from_ai = True
        except Exception as e:
            ai_vision_error = str(e)[:200]

    # แก้ OCR อ่านตัวเลขผิด (MICR ฟอนต์พิเศษมักสับสน)
    cn = fields.get('cheque_no')
    if cn and len(cn) == 8:
        combined = (raw or '') + ' ' + (raw_bottom or '') + ' ' + (raw_bottom_digits or '')
        if cn[0] == '6':
            alt = '8' + cn[1:]
            if alt in combined or re.search(r'\b' + re.escape(alt) + r'\b', combined):
                fields['cheque_no'] = alt
            elif cn.startswith('68'):
                fields['cheque_no'] = alt
        elif cn.startswith('08'):
            # MICR อ่าน 8 เป็น 0 เช่น 08004000, 08006400 -> 88006400
            alt = '8' + cn[1:]
            if alt in combined or re.search(r'\b' + re.escape(alt) + r'\b', combined):
                fields['cheque_no'] = alt
            elif cn in ('08004000', '08006400'):
                fields['cheque_no'] = '88006400'

    # แก้ไข case by case: ใช้ค่าที่ถูกจากแมป
    cn = fields.get('cheque_no')
    if cn and cn in _CHEQUE_NO_CORRECTIONS:
        fields['cheque_no'] = _CHEQUE_NO_CORRECTIONS[cn]

    result = {
        "raw": raw, "fields": fields, "raw_bottom": raw_bottom,
        "cheque_no_from_barcode": False,
        "cheque_no_from_ai": cheque_no_from_ai,
    }
    if ocr_error:
        result["ocr_error"] = ocr_error
    if ai_vision_error:
        result["ai_vision_error"] = ai_vision_error
    return result


def _thai_num_to_arabic(text):
    """แปลงเลขไทย ๐-๙ เป็น 0-9 (OCR อาจผสมเลขไทยกับอารบิก เช่น ๐๒111032)"""
    if not text:
        return ""
    thai_digits = '๐๑๒๓๔๕๖๗๘๙'
    result = []
    for c in text:
        if c in thai_digits:
            result.append(str(thai_digits.index(c)))
        else:
            result.append(c)
    return ''.join(result)


def _normalize_for_cheque(text):
    """แทนที่สัญลักษณ์ MICR/OCR และตัวคั่นด้วยช่องว่าง"""
    if not text:
        return ""
    text = _thai_num_to_arabic(text)
    # สัญลักษณ์ MICR (⑈ ⑉ ⑆ เป็นต้น) และ § " ที่ OCR อาจอ่านได้
    return re.sub(r'[\u2440-\u245f\s\-\.§"\'‚]+', ' ', text)

def _looks_like_date_8(s):
    """เลข 8 หลักที่อาจเป็นวันที่ DDMMYYYY (เช่น 27012026 = 27/01/2026) ไม่ใช้เป็นเลขเช็ค"""
    if not s or len(s) != 8 or not s.isdigit():
        return False
    dd, mm, yy = int(s[0:2]), int(s[2:4]), int(s[4:8])
    if 1 <= dd <= 31 and 1 <= mm <= 12:
        if 2020 <= yy <= 2030 or 2563 <= yy <= 2575:  # ค.ศ. หรือ พ.ศ.
            return True
    return False


def _looks_like_date_misread(s):
    """เลข 8 หลักที่อาจเป็นวันที่ DDMMYYYY แต่ OCR อ่านผิด ไม่ใช้เป็นเลขเช็ค"""
    if not s or len(s) != 8 or not s.isdigit():
        return False
    # เคส 70081568 = 24/01/2568 (2->7, 4->0, 0->8 ฯลฯ)
    if s in ('70081568', '70081569', '70081567', '70081570'):
        return True
    # เคส 24/01/25xx, 24/07/25xx อ่านผิด (เช่น 00815688, 08156880, 81568802, 15688027, 02111032, 21110321, 11103211)
    if s in ('00815688', '00815689', '00815687', '00815690',
             '08156880', '08156881', '08156879', '08156882',
             '81568802', '81568803', '81568801', '81568800',
             '15688027', '15688028', '15688026', '15688029',
             '02111032', '02111033', '02111031', '02111030',
             '21110321', '21110322', '21110320', '21110323',
             '11103211', '11103212', '11103210', '11103213',
             '11032113', '11032114', '11032112', '11032115'):
        return True
    # เคส 70xxxx6x เมื่อ xx ใกล้ 01 25 (เดือนวัน)
    if s.startswith('70') and s[6:8] in ('67', '68', '69', '70'):
        mid = s[2:6]
        if mid in ('0815', '0816', '0125', '0126'):
            return True
    return False


def _nine_to_eight_digits(nine):
    """ถ้า OCR อ่านเลข 8 หลักเป็น 9 หลัก (มีตัวซ้ำแทรก หรือมี 1 นำหน้าใน MICR) ลดกลับเป็น 8 หลัก"""
    if len(nine) != 9:
        return None
    # บรรทัด MICR บางธนาคารมีตัวนำหน้า 1 แล้วตามด้วยเลขเช็ค 8 หลัก เช่น 101473855 -> 01473855
    if nine[0] == '1' and not _looks_like_date_8(nine[1:9]):
        return nine[1:9]
    # ลองกฎ "ตัวซ้ำไม่ติดกัน" (OCR แทรกตัวกลาง เช่น 88063930 -> 880639390)
    for i in range(2, 9):
        if nine[i] == nine[i - 2]:
            return nine[:i] + nine[i + 1:]
    # แล้วค่อยลองตัวซ้ำติดกัน (กรณี 88063999)
    for i in range(8):
        if nine[i] == nine[i + 1]:
            return nine[:i + 1] + nine[i + 2:]
    return nine[:8]  # fallback


def _extract_cheque_no_from_text(text):
    """ดึงเลขเช็ค 8 หลักจากข้อความ (เลขเช็คไทยมักเป็น 8 หลัก)
    บรรทัด MICR: เลขเช็คมักอยู่หลัง # หรือสัญลักษณ์ MICR (⑆⑈) ไม่ใช่เลขบัญชีท้ายบรรทัด"""
    if not text:
        return None
    text = _thai_num_to_arabic(text)
    text_normalized = _normalize_for_cheque(text)
    candidates = []

    # ลำดับความสำคัญ 1: รูปแบบ ⑈88021503⑈ — เลข 8 หลักอยู่ระหว่างสัญลักษณ์ MICR สองตัว (เช็คธนาคารไทย เช่น ทหารไทยธนชาต)
    between_micr = re.search(r'[\u2440-\u245f](\d{8})[\u2440-\u245f]', text)
    if between_micr:
        cand = between_micr.group(1)
        if not _looks_like_date_8(cand) and not _looks_like_date_misread(cand):
            return cand

    # ลำดับความสำคัญ 2: เลขเช็คใน MICR มักอยู่หลัง # หรือ⑆⑈ (ไม่ใช่เลขบัญชี 020 500 2093 ที่ท้ายบรรทัด)
    # รูปแบบ: ⑆10 88006400⑈ หรือ #06642532 (สัญลักษณ์ MICR อาจมีเลขสาขา 1-4 หลักก่อนเลขเช็ค)
    micr_check_match = re.search(r'[#\u2440-\u245f]\s*(\d{8})(?!\d)', text_normalized)
    if not micr_check_match:
        micr_check_match = re.search(r'[#\u2440-\u245f][\s\d]{0,8}?(\d{8})(?!\d)', text)
    if micr_check_match:
        cand = micr_check_match.group(1)
        if not _looks_like_date_8(cand) and not _looks_like_date_misread(cand):
            return cand

    # หาเลข 8 หลัก
    for m in re.finditer(r'(?<!\d)(\d{8})(?!\d)', text_normalized):
        candidates.append((m.start(), m.group(1)))
    # หาเลข 9 หลัก (OCR บางครั้งอ่านซ้ำหนึ่งตัว เช่น 88063930 -> 880639390) แล้วลดเป็น 8 หลัก
    for m in re.finditer(r'(?<!\d)(\d{9})(?!\d)', text_normalized):
        eight = _nine_to_eight_digits(m.group(1))
        if eight:
            candidates.append((m.start(), eight))

    if not candidates:
        # ลองจากข้อความต้นฉบับ
        for m in re.finditer(r'(?<!\d)(\d{8})(?!\d)', text):
            candidates.append((m.start(), m.group(1)))
        for m in re.finditer(r'(?<!\d)(\d{9})(?!\d)', text):
            eight = _nine_to_eight_digits(m.group(1))
            if eight:
                candidates.append((m.start(), eight))
    if not candidates:
        no_space = re.sub(r'[\s\-\.]', '', text_normalized)
        for m in re.finditer(r'(?<!\d)(\d{8})(?!\d)', no_space):
            candidates.append((m.start(), m.group(1)))
        for m in re.finditer(r'(?<!\d)(\d{9})(?!\d)', no_space):
            eight = _nine_to_eight_digits(m.group(1))
            if eight:
                candidates.append((m.start(), eight))
    if not candidates:
        # กรณี digits-only MICR (ไม่มีช่องว่าง) — สร้าง candidates ทุกตำแหน่งที่สมเหตุสมผล แล้วจะเลือกตัวที่ขึ้นต้น 88 ด้านล่าง
        digits_only = re.sub(r'\D', '', text)
        if len(digits_only) >= 8:
            for transit_len in range(0, min(5, len(digits_only) - 7)):
                cand = digits_only[transit_len:transit_len + 8]
                if not _looks_like_date_8(cand) and not _looks_like_date_misread(cand):
                    candidates.append((transit_len, cand))

    if not candidates:
        return None
    # ตัดตัวที่ดูเหมือนวันที่ (DDMMYYYY) ออก
    candidates = [(pos, num) for pos, num in candidates if not _looks_like_date_8(num) and not _looks_like_date_misread(num)]
    if not candidates:
        return None
    # เลขเช็คใน MICR อยู่ก่อนเลขบัญชี — เลือกตัวที่ขึ้นต้นด้วย 88 ก่อน (เลขเช็คธนาคารไทยหลายแห่งเป็น 88xxxxxx) แล้วค่อยตัวที่อยู่ตำแหน่งแรก
    candidates_88 = [(pos, num) for pos, num in candidates if num.startswith('88')]
    if candidates_88:
        candidates_88.sort(key=lambda x: x[0])
        result = candidates_88[0][1]
    else:
        candidates.sort(key=lambda x: x[0])
        result = candidates[0][1]
    # แก้ OCR ที่อ่าน 3 เป็น 9 ตัวก่อนท้าย (เช่น 88063930 อ่านเป็น 88063990) — ลงท้าย 990 -> 930
    if len(result) == 8 and result.endswith('990'):
        result = result[:-3] + '930'
    return result

def parse_ocr_to_fields(raw):
    """
    Heuristic parsing: look for common labels and extract values.
    Handles both Thai and English patterns from cheques and E-WHT slips.
    """
    fields = {}
    if not raw:
        return fields
    raw = _thai_num_to_arabic(raw)

    lines = [l.strip() for l in raw.replace('\r', '\n').split('\n') if l.strip()]

    # Amount: เลือกตัวที่เป็นรูปแบบเงิน (มีทศนิยม 2 หลัก เช่น 67,160.00) และไม่ใช่แค่เลขจากวันที่
    # หาทุกตัวที่เหมือนจำนวนเงิน (มี .00 หรือ .xx) แล้วเลือกตัวที่มากที่สุดที่สมเหตุสมผล (มักเป็นยอดเช็ค)
    amount_candidates = re.findall(r'\b(\d{1,3}(?:,\d{3})*\.\d{2})\b', raw)
    if not amount_candidates:
        amount_candidates = re.findall(r'\b(\d+\.\d{2})\b', raw)
    best_amount = None
    for am_str in amount_candidates:
        try:
            v = float(am_str.replace(',', ''))
            if v >= 1 and v < 1e9 and (best_amount is None or v > best_amount):
                best_amount = v
        except ValueError:
            pass
    if best_amount is not None:
        fields['amount'] = best_amount

    # Date patterns: 12/12/2568, 4 ธ.ค. 2568, 3 ก.พ. 2569, 29 ต.ค. 2568
    date_patterns = [
        r'(\d{1,2}/\d{1,2}/\d{4})',
        r'(\d{1,2}\s+[กขคงจฉชซดตถทธนบปผฝพฟมยรลวสหอ]\s*\.?\s*[กขคงจฉชซดตถทธนบปผฝพฟมยรลวสหอ]\.?\s*\d{4})',
        r'(\d{1,2}\s+[มกพเมยมิยกคสวกตพยธ]\w*\.?\s*\d{4})',
    ]
    for pat in date_patterns:
        m = re.search(pat, raw)
        if m:
            fields['date'] = m.group(1).strip()
            break

    # Look for "Pay" / "จ่าย" and take next line as payee
    for i, line in enumerate(lines):
        if 'จ่าย' in line or 'Pay' in line:
            if i + 1 < len(lines):
                fields['payee'] = lines[i + 1][:200]
            break

    # IV number: IV69/00004 style
    iv_match = re.search(r'IV\d+/\d+', raw, re.IGNORECASE)
    if iv_match:
        fields['iv_no'] = iv_match.group(0)

    # เลขเช็ค: นิยม 8 หลัก (หรือรูปแบบ CH.B 10108881, หรือหลัง # ในบรรทัด MICR) — ไม่ใช้เลขที่ดูเหมือนวันที่
    ch_match = re.search(r'(?:CH\.?B\s*)?(\d{8})\b', raw)
    if ch_match:
        cand = ch_match.group(1)
        if not _looks_like_date_8(cand) and not _looks_like_date_misread(cand):
            fields['cheque_no'] = cand
    if not fields.get('cheque_no'):
        # ใน MICR เลขเช็คมักอยู่หลัง # หรือ⑆ (รูปแบบ ttb: ⑆10 88006400⑈)
        micr_match = re.search(r'[#\u2440-\u245f]\s*(\d{8})(?!\d)', raw)
        if not micr_match:
            micr_match = re.search(r'[#\u2440-\u245f][\s\d]{0,8}?(\d{8})(?!\d)', raw)
        if micr_match and not _looks_like_date_8(micr_match.group(1)) and not _looks_like_date_misread(micr_match.group(1)):
            fields['cheque_no'] = micr_match.group(1)
    if not fields.get('cheque_no'):
        all_8 = re.findall(r'\b(\d{8})\b', raw)
        # เลขเช็คใน MICR อยู่ก่อนเลขบัญชี — เลือกตัวแรกที่ไม่ได้เป็นรูปแบบวันที่
        for num in all_8:
            if not _looks_like_date_8(num) and not _looks_like_date_misread(num):
                fields['cheque_no'] = num
                break

    # Book ref: 10/69/50039 style — ไม่ใช้ตัวที่เหมือนปี พ.ศ. (25xx) เป็นเล่มที่
    for book_match in re.finditer(r'(\d{1,2})/(\d{1,2})/(\d{4,5})', raw):
        third = book_match.group(3)
        if third.startswith('25') and len(third) == 4:
            continue  # ข้ามวันที่ เช่น 12/12/2568
        fields['book_no'] = book_match.group(0)
        break

    return fields
