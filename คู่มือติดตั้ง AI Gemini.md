# คู่มือติดตั้ง AI Gemini สำหรับดึงเลขที่เช็คจากภาพ

ระบบ RabCheck ใช้ **Google AI Gemini** ดูภาพเช็คแล้วดึงเลขที่เช็ค (8 หลัก) ออกมาใส่ในช่อง "เช็คเลขที่" อัตโนมัติ และจะแสดงคำว่า **(อ่านจาก AI)** ตรงช่องนั้นเมื่อใช้ค่าจาก Gemini

---

## ขั้นตอนที่ 1: สร้าง API Key จาก Google AI Studio

1. เปิดเบราว์เซอร์ไปที่ **Google AI Studio**:  
   **https://aistudio.google.com/apikey**

2. ล็อกอินด้วยบัญชี Google

3. คลิก **"Create API key"** (สร้าง API key)

4. เลือกโปรเจกต์ Google Cloud ที่มีอยู่ หรือคลิก **"Create new project"** เพื่อสร้างโปรเจกต์ใหม่

5. เมื่อสร้างเสร็จ ระบบจะแสดง **API key** (ขึ้นต้นด้วย `AIza...`)  
   - ** copy เก็บไว้** — จะแสดงแค่ครั้งเดียว (หรือดูใหม่ได้ที่เมนู API keys)

6. (ทางเลือก) บน Google AI Studio มีโควต้าฟรีสำหรับทดสอบ ไม่ต้องใส่บัตรเครดิตก็ใช้ได้

---

## ขั้นตอนที่ 2: ติดตั้งแพ็กเกจ Python

เปิด Command Prompt หรือ Terminal แล้วไปที่โฟลเดอร์โปรเจกต์ RabCheck:

```bash
cd C:\Users\...\Documents\RabCheck
```

จากนั้นติดตั้งแพ็กเกจ (รวมถึง google-generativeai):

```bash
pip install -r requirements.txt
```

หรือติดตั้งเฉพาะ Gemini:

```bash
pip install google-generativeai
```

---

## ขั้นตอนที่ 3: ตั้งค่า API Key

ระบบอ่าน API key จาก **ตัวแปรสภาพแวดล้อม (environment variable)** ชื่อ **`GEMINI_API_KEY`**

### วิธีที่ 1: ตั้งใน Command Prompt ก่อนรัน (Windows CMD)

```cmd
set GEMINI_API_KEY=AIzaSy...ใส่คีย์ที่คุณได้...
python backend\app.py
```

### วิธีที่ 2: ตั้งใน PowerShell ก่อนรัน (Windows PowerShell)

```powershell
$env:GEMINI_API_KEY="AIzaSy...ใส่คีย์ที่คุณได้..."
python backend\app.py
```

### วิธีที่ 3: ตั้งแบบถาวรใน Windows (แนะนำถ้าใช้บ่อย)

1. กด **Win + R** พิมพ์ `sysdm.cpl` แล้วกด Enter  
2. แท็บ **ขั้นสูง** → **ตัวแปรสภาพแวดล้อม**  
3. ใต้ **ตัวแปรของผู้ใช้** → **สร้างใหม่**  
   - ชื่อตัวแปร: `GEMINI_API_KEY`  
   - ค่า: `AIzaSy...ใส่คีย์ที่คุณได้...`  
4. กด **ตกลง** แล้วเปิด Command Prompt / PowerShell หน้าต่างใหม่

### วิธีที่ 4: ใช้ไฟล์ .env (ไม่ต้องตั้งในเทอร์มินัลทุกครั้ง)

โปรเจกต์รองรับการอ่าน API key จากไฟล์ `.env` แล้ว — รัน `python backend\app.py` ครั้งเดียวก็ใช้ได้โดยไม่ต้องใส่ `$env:GEMINI_API_KEY` ใน PowerShell ก่อน

**ขั้นตอนสร้างไฟล์ .env**

1. **เปิดโฟลเดอร์โปรเจกต์**  
   ไปที่โฟลเดอร์ `RabCheck` (ระดับเดียวกับโฟลเดอร์ `backend`)

2. **สร้างไฟล์ชื่อ `.env`**  
   - วิธีที่ ก: ใน Cursor / VS Code คลิกขวาใน Explorer → **New File** → ตั้งชื่อว่า `.env`  
   - วิธีที่ ข: ใน Command Prompt หรือ PowerShell ที่อยู่ที่โฟลเดอร์ RabCheck ให้รัน:
     ```cmd
     copy .env.example .env
     ```
     (โปรเจกต์มีไฟล์ตัวอย่าง `.env.example` อยู่แล้ว จะได้ไฟล์ `.env` ที่มีบรรทัด GEMINI_API_KEY)

3. **เปิดไฟล์ `.env`** ด้วย Notepad หรือ Cursor แล้วแก้บรรทัดเป็น:
   ```
   GEMINI_API_KEY=AIzaSy...ใส่คีย์ที่คุณได้จาก Google AI Studio...
   ```
   - ใส่เฉพาะค่า API key หลัง `=` ไม่ต้องใส่เครื่องหมายคำพูด  
   - อย่ามีช่องว่างหน้า–หลัง `=`

4. **บันทึกไฟล์** แล้วรันแอปตามปกติ:
   ```bash
   python backend\app.py
   ```
   ไม่ต้องรัน `$env:GEMINI_API_KEY=...` อีก

**หมายเหตุ:** ไฟล์ `.env` เก็บค่าลับ อย่าส่งหรือ commit ขึ้น Git (ใน `.gitignore` ควรมี `.env` อยู่แล้ว)

---

## ขั้นตอนที่ 4: รันระบบและทดสอบ

1. รันเซิร์ฟเวอร์ (ใน Command Prompt ที่ตั้ง GEMINI_API_KEY แล้ว):

```bash
python backend\app.py
```

หรือดับเบิลคลิก **run.bat** (ถ้าใน run.bat มีการตั้ง GEMINI_API_KEY ไว้แล้ว)

2. เปิดเบราว์เซอร์ที่ **http://localhost:5000**

3. ไปที่ **อัพโหลดรูป** → เลือกรูปเช็ค → อัพโหลด

4. ไปที่ **รายการทั้งหมด** → คลิก **เพิ่มรายการ (กรอกเอง)**

5. ถ้า Gemini อ่านเลขที่เช็คได้ จะเห็นเลข 8 หลักในช่อง **เช็คเลขที่** และมีคำว่า **(อ่านจาก AI)** ต่อท้ายป้าย "เช็คเลขที่"

---

## ตัวแปรที่เกี่ยวข้อง (ถ้าต้องการปรับ)

| ตัวแปร | ความหมาย | ค่าเริ่มต้น |
|--------|----------|-------------|
| **GEMINI_API_KEY** | API key จาก Google AI Studio | (ต้องตั้งเอง) |
| **GOOGLE_API_KEY** | ใช้แทน GEMINI_API_KEY ได้ | (ถ้าไม่ตั้ง GEMINI_API_KEY) |
| **GEMINI_VISION_MODEL** | ชื่อโมเดล Gemini ที่ใช้ดูภาพ | `gemini-1.5-flash` |

ตัวอย่างเปลี่ยนโมเดล (ใน CMD):

```cmd
set GEMINI_VISION_MODEL=gemini-1.5-pro
```

- **gemini-1.5-flash** — เร็ว ค่าใช้จ่ายต่ำ (เหมาะใช้ประจำ)  
- **gemini-1.5-pro** — แม่นยำกว่า ใช้เมื่อต้องการความละเอียดสูง

---

## แก้ปัญหาเบื้องต้น

- **ไม่มีคำว่า (อ่านจาก AI)**  
  - ตรวจว่าได้ตั้ง `GEMINI_API_KEY` แล้ว และรันแอปหลังตั้งค่า  
  - ตรวจว่า `pip install google-generativeai` ติดตั้งสำเร็จ

- **Error เกี่ยวกับ API key**  
  - ตรวจว่า key ถูก copy ครบ ไม่มีช่องว่างหน้าหลัง  
  - ตรวจที่ [Google AI Studio](https://aistudio.google.com/apikey) ว่า key ยังใช้งานได้

- **Error เกี่ยวกับ quota / บริการ**  
  - โควต้าฟรีมีจำกัด ดูโควต้าได้ที่ Google AI Studio / Google Cloud Console

---

## สรุป

1. สร้าง API key ที่ https://aistudio.google.com/apikey  
2. ติดตั้ง: `pip install google-generativeai`  
3. ตั้งตัวแปร: `GEMINI_API_KEY=AIza...`  
4. รัน `python backend\app.py` แล้วอัพโหลดรูปเช็คทดสอบ

เมื่อตั้งครบ ระบบจะใช้ AI Gemini ดูภาพแล้วแสดงเลขที่เช็คออกมาให้อัตโนมัติ
