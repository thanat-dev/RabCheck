# -*- coding: utf-8 -*-
import os
import re
import uuid
import json
import io
import requests as http_requests

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

import sqlite3
from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS, BASE_DIR
from database import get_db, init_db, execute, execute_returning_id, fetchone, fetchall, USE_PG

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def row_to_dict(row):
    if row is None:
        return None
    return dict(row)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({"error": "ไม่มีไฟล์"}), 400
    f = request.files['file']
    if not f.filename:
        return jsonify({"error": "ไม่ได้เลือกไฟล์"}), 400
    if not allowed_file(f.filename):
        return jsonify({"error": "รองรับเฉพาะไฟล์รูป (png, jpg, jpeg, gif, webp)"}), 400

    ext = f.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    path = os.path.join(UPLOAD_FOLDER, filename)
    # อ่านข้อมูลรูปเป็น binary
    image_data = f.read()
    f.seek(0) # reset pointer for f.save if still needed, but we'll save to DB
    f.save(path) # keep local save as fallback/cache if desired, but DB is primary

    with get_db() as conn:
        upload_id = execute_returning_id(
            conn,
            "INSERT INTO uploads (image_path, image_data) VALUES (?, ?)",
            (filename, image_data if USE_PG else sqlite3.Binary(image_data))
        )

    return jsonify({
        "upload_id": upload_id,
        "current_upload_id": upload_id,
        "image_url": f"/api/uploads/{filename}",
        "message": "อัพโหลดสำเร็จ ไปที่รายการใบเสร็จเพื่อเพิ่มรายการ"
    })

@app.route('/api/upload/<int:upload_id>/ocr', methods=['GET'])
def get_upload_ocr(upload_id):
    """Return empty fields (OCR removed)"""
    return jsonify({"fields": {}})

@app.route('/api/uploads/<filename>')
def serve_upload(filename):
    # ลองหาใน DB ก่อน (สำหรับ Render ที่ไฟล์บน disk หายไป)
    with get_db() as conn:
        row = fetchone(conn, "SELECT image_data FROM uploads WHERE image_path = ?", (filename,))
        if row and row['image_data']:
            content = row['image_data']
            # ถ้าเป็น memoryview (จาก pg) หรือ bytes ให้ส่งออกไปเลย
            import mimetypes
            mime, _ = mimetypes.guess_type(filename)
            return send_file(
                io.BytesIO(content),
                mimetype=mime or 'image/jpeg'
            )

    # ถ้าไม่เจอใน DB (หรือ DB ไม่มี data) ให้ลองหาใน disk (fallback)
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/upload/<int:upload_id>', methods=['DELETE'])
def delete_upload(upload_id):
    """ยกเลิกอัพโหลด — ลบรูปและรายการที่ผูกกับชุดนี้"""
    with get_db() as conn:
        row = fetchone(conn, "SELECT image_path FROM uploads WHERE id = ?", (upload_id,))
        if not row:
            return jsonify({"error": "ไม่พบรายการอัพโหลด"}), 404
        filename = row['image_path']
        execute(conn, "DELETE FROM entries WHERE upload_id = ?", (upload_id,))
        execute(conn, "DELETE FROM uploads WHERE id = ?", (upload_id,))
    path = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.isfile(path):
        try:
            os.remove(path)
        except OSError:
            pass
    return jsonify({"ok": True})

THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']


def _ymd_to_thai(ymd):
    """แปลง YYYY-MM-DD เป็นรูปแบบไทย เช่น 11 ก.พ. 2569 (ตามที่เก็บใน DB)"""
    if not ymd or len(ymd) < 10:
        return None
    parts = ymd[:10].split('-')
    if len(parts) != 3:
        return None
    try:
        y, m, d = int(parts[0]), int(parts[1]), int(parts[2])
        if y >= 2500:
            y -= 543
        return '{} {} {}'.format(d, THAI_MONTHS[m - 1] if 1 <= m <= 12 else '', y + 543)
    except (ValueError, IndexError):
        return None


def _parse_thai_date(s):
    """แปลง 11 ก.พ. 2569 เป็น YYYY-MM-DD"""
    if not s or not isinstance(s, str):
        return None
    s = s.strip()
    for i, name in enumerate(THAI_MONTHS, 1):
        if name in s:
            m = re.search(r'(\d{1,2})\s*' + re.escape(name) + r'\s*(\d{4})', s)
            if m:
                d, y = int(m.group(1)), int(m.group(2)) - 543
                if 1900 < y < 2100 and 1 <= d <= 31:
                    return '{}-{:02d}-{:02d}'.format(y, i, d)
    return None


def _normalize_date_filter(date_filter):
    """รับค่าวันที่ YYYY-MM-DD หรือ พ.ศ. (2569-02-17) หรือไทย (11 ก.พ. 2569)
    คืนรายการวันที่ที่จะใช้ใน WHERE (รองรับทั้งรูปแบบที่เก็บใน DB)"""
    if not date_filter:
        return []
    s = str(date_filter).strip()
    # ลองแปลงรูปแบบไทย (11 ก.พ. 2569) เป็น Y-m-d ก่อน
    ymd = _parse_thai_date(s)
    if ymd:
        s = ymd
    if len(s) < 10:
        return []
    s = s[:10]
    if not s.replace('-', '').isdigit():
        return []
    parts = s.split('-')
    if len(parts) != 3:
        return []
    try:
        y = int(parts[0])
        m, d = parts[1], parts[2]
    except ValueError:
        return []
    out = [s]
    if y >= 2500:
        out.append(str(y - 543) + '-' + m + '-' + d)
    elif y <= 2100:
        out.append(str(y + 543) + '-' + m + '-' + d)
    # เพิ่มรูปแบบไทยที่ DB อาจเก็บไว้ (เช่น 11 ก.พ. 2569)
    thai_fmt = _ymd_to_thai(s)
    if thai_fmt:
        out.append(thai_fmt)
    # ถ้า s เป็นค.ศ. ให้เพิ่มรูปแบบไทยของ s ด้วย
    if y < 2500:
        thai_s = _ymd_to_thai(str(y + 543) + '-' + m + '-' + d)
        if thai_s and thai_s not in out:
            out.append(thai_s)
    return out


def _row_date_matches(row_date, target_ymd_list):
    """เช็คว่า row_date (ค่าจาก DB) ตรงกับรายการ target หรือไม่ (รองรับ Y-m-d และรูปแบบไทย)"""
    if not row_date or not target_ymd_list:
        return False
    s = str(row_date).strip()
    for t in target_ymd_list:
        if s == t or s.startswith(t) or t.startswith(s):
            return True
    # รองรับ YYYY-MM-DD ใน DB
    s10 = s[:10]
    if len(s10) >= 10 and s10.replace('-', '').isdigit():
        parts = s10.split('-')
        if len(parts) == 3:
            try:
                y = int(parts[0])
                if y >= 2500:
                    greg = str(y - 543) + '-' + parts[1] + '-' + parts[2]
                    if greg in target_ymd_list:
                        return True
            except ValueError:
                pass
    # รองรับรูปแบบไทยใน DB (11 ก.พ. 2569)
    row_ymd = _parse_thai_date(s)
    if row_ymd and row_ymd in target_ymd_list:
        return True
    return False


@app.route('/api/entries', methods=['GET'])
def list_entries():
    upload_id = request.args.get('upload_id', type=int)
    date_filter = request.args.get('date', type=str)
    date_values = _normalize_date_filter(date_filter) if date_filter else []
    with get_db() as conn:
        if upload_id:
            if date_values:
                conditions = []
                for d in date_values:
                    conditions.append("(trim(coalesce(e.date,'')) = ? OR trim(coalesce(e.date,'')) LIKE ?)")
                params = (upload_id,) + tuple(p for d in date_values for p in [d, d + '%'])
                rows = fetchall(conn,
                    """SELECT e.*, u.image_path
                       FROM entries e
                       LEFT JOIN uploads u ON e.upload_id = u.id
                       WHERE e.upload_id = ? AND (""" + ' OR '.join(conditions) + """)
                       ORDER BY e.created_at DESC""",
                    params
                )
            else:
                rows = fetchall(conn,
                    """SELECT e.*, u.image_path
                       FROM entries e
                       LEFT JOIN uploads u ON e.upload_id = u.id
                       WHERE e.upload_id = ?
                       ORDER BY e.created_at DESC""",
                    (upload_id,)
                )
        else:
            if date_values:
                # รองรับทั้ง date เท่ากับค่าที่ส่งมา และ date ขึ้นต้นด้วยค่าที่ส่งมา (เช่น มีเวลาต่อท้าย)
                conditions = []
                params = []
                for d in date_values:
                    conditions.append("(trim(coalesce(e.date,'')) = ? OR trim(coalesce(e.date,'')) LIKE ?)")
                    params.extend([d, d + '%'])
                where_sql = ' OR '.join(conditions)
                rows = fetchall(conn,
                    """SELECT e.*, u.image_path
                       FROM entries e
                       LEFT JOIN uploads u ON e.upload_id = u.id
                       WHERE (""" + where_sql + """)
                       ORDER BY e.created_at DESC""",
                    tuple(params)
                )
                # ถ้าไม่เจอจาก SQL ลองดึงทั้งหมดแล้วกรองใน Python (รองรับรูปแบบวันที่ใน DB ที่หลากหลาย)
                if not rows:
                    all_rows = fetchall(conn,
                        """SELECT e.*, u.image_path
                           FROM entries e
                           LEFT JOIN uploads u ON e.upload_id = u.id
                           ORDER BY e.created_at DESC"""
                    )
                    rows = [r for r in all_rows if _row_date_matches(r['date'], date_values)]
            else:
                rows = fetchall(conn,
                    """SELECT e.*, u.image_path
                       FROM entries e
                       LEFT JOIN uploads u ON e.upload_id = u.id
                       ORDER BY e.created_at DESC"""
                )
    return jsonify([row_to_dict(r) for r in rows])

@app.route('/api/entries/<int:eid>', methods=['GET'])
def get_entry(eid):
    with get_db() as conn:
        row = fetchone(conn,
            """SELECT e.*, u.image_path
               FROM entries e
               LEFT JOIN uploads u ON e.upload_id = u.id
               WHERE e.id = ?""",
            (eid,)
        )
    if not row:
        return jsonify({"error": "ไม่พบรายการ"}), 404
    return jsonify(row_to_dict(row))

@app.route('/api/entries/<int:eid>', methods=['PUT'])
def update_entry(eid):
    data = request.get_json() or {}
    cols = [
        'date', 'deposit_time', 'book_no', 'iv_no', 'cheque_no', 'account',
        'amount', 'total_amount', 'buyer_place', 'cheque_source', 'status',
        'payee', 'amount_words', 'memo', 'branch_name'
    ]
    updates = []
    values = []
    for c in cols:
        if c in data:
            updates.append(f"{c} = ?")
            v = data[c]
            if c in ('amount', 'total_amount') and v is not None:
                try:
                    v = float(v)
                except (TypeError, ValueError):
                    v = None
            values.append(v)
    if not updates:
        return jsonify({"error": "ไม่มีข้อมูลที่จะอัปเดต"}), 400
    values.append(eid)
    sql = "UPDATE entries SET " + ", ".join(updates) + " WHERE id = ?"
    with get_db() as conn:
        execute(conn, sql, values)
    return jsonify({"ok": True})

@app.route('/api/entries/<int:eid>', methods=['DELETE'])
def delete_entry(eid):
    with get_db() as conn:
        execute(conn, "DELETE FROM entries WHERE id = ?", (eid,))
    return jsonify({"ok": True})

@app.route('/api/entries', methods=['POST'])
def create_entry():
    """สร้างรายการใหม่ (กรอกเองโดยไม่ต้องอัพโหลดรูป)"""
    data = request.get_json() or {}
    upload_id = data.get('upload_id')
    with get_db() as conn:
        eid = execute_returning_id(conn,
            """INSERT INTO entries (
                upload_id, date, deposit_time, book_no, iv_no, cheque_no, account,
                amount, total_amount, buyer_place, cheque_source, status,
                payee, amount_words, memo, branch_name
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                upload_id if upload_id else None,
                data.get('date'),
                data.get('deposit_time'),
                data.get('book_no'),
                data.get('iv_no'),
                data.get('cheque_no'),
                data.get('account'),
                _float(data.get('amount')),
                _float(data.get('total_amount')),
                data.get('buyer_place'),
                data.get('cheque_source'),
                data.get('status'),
                data.get('payee'),
                data.get('amount_words'),
                data.get('memo'),
                data.get('branch_name'),
            )
        )
    return jsonify({"id": eid, "ok": True})

def _float(v):
    if v is None or v == '':
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None

@app.route('/api/send-to-sheet', methods=['POST'])
def send_to_sheet():
    """ส่งข้อมูลไปยัง Google Apps Script Web App"""
    data = request.get_json() or {}
    url = (data.get('url') or '').strip()
    rows = data.get('rows') or []
    if not url:
        return jsonify({"error": "ไม่มี URL"}), 400
    if not url.startswith('https://script.google.com/'):
        return jsonify({"error": "URL ต้องเป็น Google Apps Script Web App"}), 400
    if not rows:
        return jsonify({"error": "ไม่มีข้อมูลที่จะส่ง"}), 400
    try:
        payload = json.dumps({'rows': rows})

        # Debug: แสดงข้อมูล buyer_place/cheque_source/status ที่กำลังส่ง
        for i, r in enumerate(rows[:3]):
            print(f"[send-to-sheet] row {i}: buyer_place={r.get('buyer_place')!r}, "
                  f"cheque_source={r.get('cheque_source')!r}, status={r.get('status')!r}")

        # Google Apps Script ประมวลผล POST แล้วตอบ 302 redirect ไปยัง URL สำหรับอ่าน response
        # requests จะ follow redirect อัตโนมัติ (302 → GET) ซึ่งถูกต้อง
        resp = http_requests.post(
            url,
            data=payload,
            headers={'Content-Type': 'application/json'},
            timeout=30
        )

        if resp.status_code != 200:
            return jsonify({"error": f"Google Apps Script ตอบกลับ HTTP {resp.status_code}"}), 502

        # ตรวจสอบ response เป็น JSON หรือไม่
        result_text = resp.text
        try:
            parsed = json.loads(result_text)
        except (ValueError, TypeError):
            return jsonify({
                "error": "Google Apps Script ไม่ได้ตอบกลับ JSON — ตรวจสอบว่า Deploy เป็น Web App และ URL ถูกต้อง"
            }), 502

        if parsed.get('ok') is False:
            error_msg = parsed.get('error', 'เกิดข้อผิดพลาดที่ Google Apps Script')
            return jsonify({"error": error_msg}), 400

        return jsonify({"ok": True, "message": "ส่งข้อมูลเรียบร้อย", "count": parsed.get('count')})

    except http_requests.exceptions.Timeout:
        return jsonify({"error": "หมดเวลาเชื่อมต่อ Google Apps Script (30 วินาที)"}), 504
    except http_requests.exceptions.ConnectionError as e:
        return jsonify({"error": f"เชื่อมต่อ Google Apps Script ไม่สำเร็จ: {str(e)}"}), 502
    except Exception as e:
        return jsonify({"error": f"เกิดข้อผิดพลาด: {str(e)}"}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
