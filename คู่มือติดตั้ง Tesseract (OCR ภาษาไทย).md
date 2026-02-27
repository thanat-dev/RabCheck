# คู่มือติดตั้ง Tesseract และเลือกภาษา Thai

ใช้สำหรับให้ระบบ RabCheck **ดึงข้อความจากรูปเช็ค/ใบโอนเงินอัตโนมัติ** (รวมถึงเลขเช็ค 8 หลัก) — ถ้าไม่ติดตั้ง ระบบยังใช้ได้ แต่ต้องกรอกข้อมูลเอง

---

## สิ่งที่ต้องมี

- Windows 10 หรือใหม่กว่า
- สิทธิ์ติดตั้งโปรแกรม (ถ้าติดตั้งใน `C:\Program Files`)
- **Python 3.11 หรือ 3.12** (แนะนำ 3.12) — **Python 3.14 ยังไม่รองรับ pytesseract** (จะขึ้น error `cannot import name 'find_loader'`) ถ้าติดตั้งแค่ 3.14 ไว้ ให้ติดตั้ง Python 3.12 เพิ่มแล้วใช้รัน RabCheck ด้วย 3.12

---

## ขั้นที่ 1: ดาวน์โหลด Tesseract

1. เปิดเบราว์เซอร์ (Chrome, Edge ฯลฯ)
2. ไปที่ลิงก์:  
   **https://github.com/UB-Mannheim/tesseract/wiki**
3. เลื่อนลงหาหัวข้อ **"Tesseract at UB Mannheim"** แล้วดูรายการดาวน์โหลดสำหรับ Windows
4. คลิกดาวน์โหลดไฟล์ตัวติดตั้งล่าสุด เช่น:
   - **tesseract-ocr-w64-setup-5.5.0.exe** (64-bit)  
   หรือชื่อคล้ายกันที่มีคำว่า **w64-setup**
5. เลือกเก็บไฟล์ (Save) แล้วรอให้ดาวน์โหลดเสร็จ

> ถ้าเครื่องเป็น Windows 32-bit ให้เลือกไฟล์ที่ลงท้าย **w32-setup** แทน

---

## ขั้นที่ 2: รันตัวติดตั้ง

1. ไปที่โฟลเดอร์ที่เก็บไฟล์ที่ดาวน์โหลด (มักเป็น `Downloads`)
2. ดับเบิลคลิกไฟล์ **tesseract-ocr-w64-setup-5.x.x.exe**
3. ถ้ามีหน้าต่างถามสิทธิ์ (User Account Control) ให้คลิก **Yes**

---

## ขั้นที่ 3: เลือกภาษา Thai (สำคัญมาก)

1. หน้าต่างติดตั้งจะเปิดขึ้น
2. คลิก **Next** ไปจนถึงขั้น **"Choose Components"** (เลือกองค์ประกอบ)
3. ในรายการให้ทำดังนี้:
   - ติ๊กถูกที่ **"Additional language data (download)"**  
     (หรือ "Additional language data")
   - คลิกขยายรายการนั้น (ลูกศรหรือคลิกที่ข้อความ)
   - **ติ๊กถูกที่ "Thai"**  
     ถ้ามี **English** อยู่แล้วก็ปล่อยไว้ (ใช้ร่วมกับ Thai ได้)
4. ตรวจสอบอีกครั้งว่ามี **Thai** ถูกเลือกแล้ว
5. คลิก **Next** ต่อไป

- ถ้าหน้าจอมีรายการภาษาเป็นช่องติ๊ก ให้หา **Thai** แล้วติ๊กให้ถูก

---

## ขั้นที่ 4: ติดตั้งจนเสร็จ

1. ตรวจสอบ path การติดตั้ง (ปกติเป็น):  
   `C:\Program Files\Tesseract-OCR`  
   เปลี่ยนได้ถ้าต้องการ แต่อย่าลืม path ที่ใช้
2. คลิก **Install** (หรือ Next แล้ว Install)
3. รอจนติดตั้งเสร็จ
4. คลิก **Finish**

---

## ขั้นที่ 5: เพิ่ม Tesseract เข้า PATH (ทำเมื่อ OCR ยังไม่ทำงาน)

หลังติดตั้งแล้ว ถ้ารัน RabCheck แล้วอัพโหลดรูปแต่ **ไม่มีการดึงข้อความอัตโนมัติ** ให้เพิ่ม path ของ Tesseract เข้าไปในตัวแปร PATH ของ Windows:

1. กดปุ่ม **Win** บนคีย์บอร์ด แล้วพิมพ์คำว่า **environment**
2. เลือก **"Edit the system environment variables"**
3. ในหน้าต่างที่เปิดขึ้น คลิกปุ่ม **"Environment Variables..."**
4. ใต้ส่วน **"System variables"** (ตัวแปรของระบบ) เลือกแถว **Path** แล้วคลิก **"Edit..."**
5. คลิก **"New"** แล้วพิมพ์ path การติดตั้ง Tesseract เช่น:
   ```text
   C:\Program Files\Tesseract-OCR
   ```
   (ถ้าติดตั้งที่อื่น ให้ใส่ path จริงที่ใช้)
6. กด **OK** ทุกหน้าต่างจนปิด
7. **ปิด Command Prompt หรือ PowerShell เก่าทั้งหมด** แล้วเปิดใหม่ (หรือรีสตาร์ทเครื่อง) แล้วค่อยรัน RabCheck อีกครั้ง

---

## ขั้นที่ 6: ตรวจสอบว่าติดตั้งสำเร็จ

1. เปิด **Command Prompt** (กด Win + R พิมพ์ **cmd** แล้ว Enter)
2. พิมพ์คำสั่ง:
   ```text
   tesseract --version
   ```
3. ถ้าติดตั้งและตั้ง PATH ถูกต้อง จะเห็นข้อความประมาณ:
   ```text
   tesseract 5.x.x
   ```
4. ตรวจสอบว่ามีภาษา Thai:
   ```text
   tesseract --list-langs
   ```
   ในรายการควรมี **tha** (หรือ Thai) อยู่

---

## สรุปสั้นๆ

| ขั้น | ทำอะไร |
|------|--------|
| 1 | ดาวน์โหลดตัวติดตั้งจาก GitHub UB-Mannheim |
| 2 | รันไฟล์ .exe ที่ดาวน์โหลด |
| 3 | **ติ๊ก "Additional language data" แล้วเลือก Thai** |
| 4 | ติดตั้งจนเสร็จ (Next / Install / Finish) |
| 5 | ถ้า OCR ยังไม่ทำงาน → เพิ่ม `C:\Program Files\Tesseract-OCR` ใน PATH |
| 6 | ตรวจด้วยคำสั่ง `tesseract --version` และ `tesseract --list-langs` |

หลังติดตั้ง Tesseract และเลือก Thai แล้ว ระบบ RabCheck จะสามารถ:
- ดึงข้อความจากรูปเช็ค/ใบโอนเงินได้
- **กรอกเลขเช็ค (เช่น 88063930) ในช่อง "เช็คเลขที่" อัตโนมัติ** เมื่ออัพโหลดรูปแล้วไปกด "เพิ่มรายการ (กรอกเอง)"

---

## แก้ปัญหาเบื้องต้น

### อัพโหลดรูปแล้วไม่มีการดึงข้อความ (ช่อง "เช็คเลขที่" ไม่เติมอัตโนมัติ)

ระบบ RabCheck จะลองหา Tesseract ที่ตำแหน่งมาตรฐานของ Windows ให้เอง (`C:\Program Files\Tesseract-OCR\tesseract.exe`) แม้ยังไม่ได้เพิ่มเข้า PATH

**ลองตามลำดับ:**

1. **ตรวจว่าเลือกภาษา Thai ตอนติดตั้ง**  
   เปิด Command Prompt แล้วรัน:
   ```text
   "C:\Program Files\Tesseract-OCR\tesseract.exe" --list-langs
   ```
   ในรายการต้องมี **tha** ถ้าไม่มี ให้ติดตั้ง Tesseract ใหม่และติ๊กเลือก "Additional language data" → **Thai**

2. **ถ้าติดตั้ง Tesseract ไว้ที่โฟลเดอร์อื่น**  
   ต้องบอก path ให้ RabCheck โดยตั้งตัวแปรสภาพก่อนรันระบบ:
   - เปิด Command Prompt ไปที่โฟลเดอร์ RabCheck
   - รันคำสั่ง (แก้ path ให้ตรงกับที่ติดตั้ง):
   ```text
   set TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   python backend\app.py
   ```
   หรือถ้าใช้ `run.bat` ให้แก้ไฟล์ `run.bat` เพิ่มบรรทัด `set TESSERACT_CMD=...` ด้านบน

3. **ปิดแล้วเปิด RabCheck ใหม่**  
   ปิดหน้าต่างที่รัน `run.bat` หรือ `python backend\app.py` แล้วเปิดใหม่ จากนั้นลองอัพโหลดรูปอีกครั้ง

### คำสั่ง `tesseract` ไม่รู้จัก (ใน Command Prompt)

→ ยังไม่ได้เพิ่ม path ใน Environment Variables ให้ทำขั้นที่ 5 แล้วปิด/เปิด Command Prompt ใหม่ (RabCheck ยังทำงานได้ เพราะลองหา path มาตรฐานเอง)

### อัพโหลดรูปแล้วไม่มีข้อความเลย (OCR ไม่ดึงอะไร)

ใช้สคริปต์ตรวจสอบในโปรเจกต์เพื่อดูสาเหตุจริง:

1. **ปิด RabCheck** (ปิดหน้าต่างที่รัน `run.bat` หรือ Command Prompt ที่รันเซิร์ฟเวอร์)
2. เปิด **Command Prompt** แล้วไปที่โฟลเดอร์ RabCheck:
   ```text
   cd C:\Users\ชื่อคุณ\Documents\RabCheck
   ```
   (แก้ path ให้ตรงกับที่เก็บโปรเจกต์)
3. รันคำสั่ง:
   ```text
   python backend\check_ocr.py
   ```
4. อ่านผลที่ขึ้นบนจอ:
   - **ถ้าขึ้น "[!!] เรียก Tesseract ไม่ได้"** และมีข้อความ error → ตามแนวทางแก้ที่สคริปต์แนะนำ (ติดตั้ง Tesseract, ตั้ง path, หรือตั้งตัวแปร `TESSERACT_CMD`)
   - **ถ้าขึ้น "[!!] ไม่พบภาษา Thai (tha)"** → ติดตั้ง Tesseract ใหม่และติ๊กเลือก **Additional language data → Thai**
   - **ถ้าขึ้น "[OK] เวอร์ชัน Tesseract" และ "[OK] มีภาษา Thai"** แต่ตอนอัพโหลดในระบบยังไม่มีข้อความ → ลองรันสคริปต์พร้อม path รูปเช็ค:
     ```text
     python backend\check_ocr.py uploads\ชื่อไฟล์รูป.jpg
     ```
     (ใช้ชื่อไฟล์รูปที่อัพโหลดไว้ในโฟลเดอร์ `uploads`) แล้วดูว่าขึ้น "[!!] OCR เกิดข้อผิดพลาด" หรือไม่ และข้อความ error คืออะไร
5. หลังแก้ตามที่สคริปต์แนะนำแล้ว **เปิด RabCheck ใหม่** แล้วลองอัพโหลดรูปอีกครั้ง

นอกจากนี้ หลังอัพโหลดรูป ถ้า OCR ผิดพลาด ระบบจะแสดงข้อความ **"OCR ไม่ทำงาน: ..."** พร้อมข้อความ error บนหน้าเว็บ — ใช้ข้อความนั้นประกอบการแก้ไขหรือค้นหาวิธีแก้ในคู่มือนี้

### ขึ้นข้อความ "cannot import name 'find_loader' from 'pkgutil'"

เกิดจาก **Python 3.14** ที่ตัดฟังก์ชันเก่าออกแล้ว แต่ pytesseract ยังใช้อยู่

**วิธีแก้:** ใช้ **Python 3.12** สำหรับ RabCheck

1. ดาวน์โหลด Python 3.12 จาก https://www.python.org/downloads/release/python-3120/  
   เลือก **Windows installer (64-bit)** แล้วติดตั้ง (ติ๊ก "Add python.exe to PATH" ด้วย)
2. ติดตั้งแพ็กเกจใน Python 3.12:
   ```text
   py -3.12 -m pip install -r requirements.txt
   ```
3. รัน RabCheck ด้วย 3.12:
   - ดับเบิลคลิก **run.bat** (ไฟล์ run.bat จะลองใช้ `py -3.12` ก่อนอยู่แล้ว)
   - หรือเปิด Command Prompt ที่โฟลเดอร์ RabCheck แล้วรัน: `py -3.12 backend\app.py`
4. ตรวจสอบ OCR: `py -3.12 backend\check_ocr.py`

### ดึงได้แต่ผิดหรือไม่ครบ

→ รูปอาจเบลอหรือแสงไม่ดี ลองถ่าย/สแกนใหม่ หรือไปแก้ไขที่ "รายการทั้งหมด" แล้วคลิก "แก้ไข" เพื่อกรอก/แก้ด้วยมือ
