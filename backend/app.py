# -*- coding: utf-8 -*-
import os
import re
import uuid
import json
import io
import requests as http_requests
from datetime import datetime

from flask import Flask, request, jsonify, send_from_directory, send_file, redirect
from flask_cors import CORS
from werkzeug.utils import secure_filename

from config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS, BASE_DIR
from database import get_db, get_bucket, init_db

app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16 MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
    image_data = f.read()
    
    # Upload to Firebase Storage
    public_url = ''
    try:
        bucket = get_bucket()
        blob = bucket.blob(f"uploads/{filename}")
        blob.upload_from_string(image_data, content_type=f.mimetype or 'image/jpeg')
        blob.make_public()
        public_url = blob.public_url
    except Exception as e:
        print("[Firebase Storage Error]", e)
        # Fallback if bucket is not properly configured
        f.seek(0)
        path = os.path.join(UPLOAD_FOLDER, filename)
        f.save(path)

    # Save to Firestore
    try:
        db = get_db()
        _, upload_ref = db.collection('uploads').add({
            'image_path': filename,
            'image_url': public_url,
            'created_at': datetime.utcnow().isoformat()
        })
        upload_id = upload_ref.id
    except Exception as e:
        print("[Firestore Error]", e)
        return jsonify({"error": "ไม่สามารถบันทึกข้อมูลโควต้า Firestore อาจเต็มหรือยังไม่ได้เปิดใช้งาน"}), 500

    return jsonify({
        "upload_id": upload_id,
        "current_upload_id": upload_id,
        "image_url": f"/api/uploads/{filename}",
        "message": "อัพโหลดสำเร็จ ไปที่รายการใบเสร็จเพื่อเพิ่มรายการ"
    })

@app.route('/api/upload/<upload_id>/ocr', methods=['GET'])
def get_upload_ocr(upload_id):
    """Return empty fields (OCR removed)"""
    return jsonify({"fields": {}})

@app.route('/api/uploads/<filename>')
def serve_upload(filename):
    # Try Firestore first to get the public URL and redirect
    try:
        db = get_db()
        docs = db.collection('uploads').where('image_path', '==', filename).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            if data.get('image_url'):
                return redirect(data['image_url'])
    except Exception as e:
        pass

    # Fallback to local disk if running offline or Firestore failed
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/upload/<upload_id>', methods=['DELETE'])
def delete_upload(upload_id):
    """ยกเลิกอัพโหลด — ลบรูปและรายการที่ผูกกับชุดนี้"""
    db = get_db()
    
    # ลบ entries ที่ผูกกับ upload_id นี้
    entries = db.collection('entries').where('upload_id', '==', upload_id).stream()
    for ent in entries:
        ent.reference.delete()
        
    doc_ref = db.collection('uploads').document(upload_id)
    doc = doc_ref.get()
    if not doc.exists:
        return jsonify({"error": "ไม่พบรายการอัพโหลด"}), 404
        
    data = doc.to_dict()
    filename = data.get('image_path')
    
    # ลบเอกสารจาก Firestore
    doc_ref.delete()
    
    # ลบไฟล์จาก Firebase Storage
    if filename:
        try:
            bucket = get_bucket()
            blob = bucket.blob(f"uploads/{filename}")
            if blob.exists():
                blob.delete()
        except:
            pass
            
    # ลบไฟล์ในเครื่อง (fallback)
    if filename:
        path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(path):
            try:
                os.remove(path)
            except:
                pass

    return jsonify({"ok": True})

THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

def _ymd_to_thai(ymd):
    """แปลง YYYY-MM-DD เป็นรูปแบบไทย"""
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
    except:
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
    """รับค่าวันที่ คืนรายการวันที่ที่จะใช้กรอง"""
    if not date_filter:
        return []
    s = str(date_filter).strip()
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
    except:
        return []
    out = [s]
    if y >= 2500:
        out.append(str(y - 543) + '-' + m + '-' + d)
    elif y <= 2100:
        out.append(str(y + 543) + '-' + m + '-' + d)
    thai_fmt = _ymd_to_thai(s)
    if thai_fmt:
        out.append(thai_fmt)
    if y < 2500:
        thai_s = _ymd_to_thai(str(y + 543) + '-' + m + '-' + d)
        if thai_s and thai_s not in out:
            out.append(thai_s)
    return out

def _row_date_matches(row_date, target_ymd_list):
    """เช็คว่า row_date ตรงกับรายการ target หรือไม่"""
    if not row_date or not target_ymd_list:
        return False
    s = str(row_date).strip()
    for t in target_ymd_list:
        if s == t or s.startswith(t) or t.startswith(s):
            return True
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
            except:
                pass
    row_ymd = _parse_thai_date(s)
    if row_ymd and row_ymd in target_ymd_list:
        return True
    return False

def get_entries_from_firestore(upload_id=None, date_filter=None):
    db = get_db()
    date_values = _normalize_date_filter(date_filter) if date_filter else []
    
    # 1. โหลด uploads ทั้งหมดเพื่อมาแนบ image_path (จอยข้อมูลแบบ NoSQL)
    uploads_map = {}
    try:
        for upd in db.collection('uploads').stream():
            ud = upd.to_dict()
            # ใช้ image_path เพื่อให้ API คืนค่ากลับไปเหมือนเดิม
            uploads_map[upd.id] = ud.get('image_path')
    except Exception as e:
        print("[Firestore get uploads error]", e)

    # 2. คิวรี entries
    rows = []
    try:
        # ถ้ามี upload_id ให้ใช้ where เพื่อความเร็ว
        if upload_id:
            docs = db.collection('entries').where('upload_id', '==', upload_id).stream()
        else:
            docs = db.collection('entries').stream()
            
        for doc in docs:
            data = doc.to_dict()
            data['id'] = doc.id
            
            # กรอง date ในระดับแอพ (เพราะรูปแบบวันที่มีหลากหลาย)
            if date_values and not _row_date_matches(data.get('date'), date_values):
                continue
                
            # แนบรูป
            uid = data.get('upload_id')
            if uid and uid in uploads_map:
                data['image_path'] = uploads_map[uid]
                
            rows.append(data)
    except Exception as e:
        print("[Firestore get entries error]", e)
        
    # เรียงลำดับตาม created_at
    rows.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return rows

@app.route('/api/entries', methods=['GET'])
def list_entries():
    upload_id = request.args.get('upload_id')
    date_filter = request.args.get('date')
    rows = get_entries_from_firestore(upload_id, date_filter)
    return jsonify(rows)

@app.route('/api/entries/<eid>', methods=['GET'])
def get_entry(eid):
    db = get_db()
    doc = db.collection('entries').document(eid).get()
    if not doc.exists:
        return jsonify({"error": "ไม่พบรายการ"}), 404
        
    data = doc.to_dict()
    data['id'] = doc.id
    
    uid = data.get('upload_id')
    if uid:
        udoc = db.collection('uploads').document(uid).get()
        if udoc.exists:
            data['image_path'] = udoc.to_dict().get('image_path')
            
    return jsonify(data)

@app.route('/api/entries/<eid>', methods=['PUT'])
def update_entry(eid):
    data = request.get_json() or {}
    cols = [
        'date', 'deposit_time', 'book_no', 'iv_no', 'cheque_no', 'account',
        'amount', 'total_amount', 'buyer_place', 'cheque_source', 'status',
        'payee', 'amount_words', 'memo', 'branch_name'
    ]
    updates = {}
    for c in cols:
        if c in data:
            v = data[c]
            if c in ('amount', 'total_amount') and v is not None:
                try:
                    v = float(v)
                except:
                    v = None
            updates[c] = v
            
    if not updates:
        return jsonify({"error": "ไม่มีข้อมูลที่จะอัปเดต"}), 400
        
    db = get_db()
    doc_ref = db.collection('entries').document(eid)
    if doc_ref.get().exists:
        doc_ref.update(updates)
        return jsonify({"ok": True})
    return jsonify({"error": "ไม่พบรายการ"}), 404

@app.route('/api/entries/<eid>', methods=['DELETE'])
def delete_entry(eid):
    db = get_db()
    db.collection('entries').document(eid).delete()
    return jsonify({"ok": True})

def _float(v):
    if v is None or v == '':
        return None
    try:
        return float(v)
    except:
        return None

@app.route('/api/entries', methods=['POST'])
def create_entry():
    data = request.get_json() or {}
    upload_id = data.get('upload_id')
    
    doc_data = {
        'upload_id': upload_id if upload_id else None,
        'date': data.get('date'),
        'deposit_time': data.get('deposit_time'),
        'book_no': data.get('book_no'),
        'iv_no': data.get('iv_no'),
        'cheque_no': data.get('cheque_no'),
        'account': data.get('account'),
        'amount': _float(data.get('amount')),
        'total_amount': _float(data.get('total_amount')),
        'buyer_place': data.get('buyer_place'),
        'cheque_source': data.get('cheque_source'),
        'status': data.get('status'),
        'payee': data.get('payee'),
        'amount_words': data.get('amount_words'),
        'memo': data.get('memo'),
        'branch_name': data.get('branch_name'),
        'created_at': datetime.utcnow().isoformat()
    }
    
    db = get_db()
    _, doc_ref = db.collection('entries').add(doc_data)
    return jsonify({"id": doc_ref.id, "ok": True})

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
        resp = http_requests.post(url, data=payload, headers={'Content-Type': 'application/json'}, timeout=30)
        if resp.status_code != 200:
            return jsonify({"error": f"Google Apps Script ตอบกลับ HTTP {resp.status_code}"}), 502

        result_text = resp.text
        try:
            parsed = json.loads(result_text)
        except:
            return jsonify({"error": "Google Apps Script ไม่ได้ตอบกลับ JSON"}), 502

        if parsed.get('ok') is False:
            return jsonify({"error": parsed.get('error', 'เกิดข้อผิดพลาดที่ Google Apps Script')}), 400

        return jsonify({"ok": True, "message": "ส่งข้อมูลเรียบร้อย", "count": parsed.get('count')})

    except Exception as e:
        return jsonify({"error": f"เกิดข้อผิดพลาด: {str(e)}"}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
