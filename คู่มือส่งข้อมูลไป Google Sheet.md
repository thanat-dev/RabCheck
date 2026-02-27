# คู่มือส่งข้อมูลไป Google Sheet

คู่มือนี้จะอธิบายวิธีตั้งค่าให้ข้อมูลจากระบบ RabCheck ส่งไปยัง Google Sheet อัตโนมัติ

---

## สรุปขั้นตอน

1. สร้าง Google Apps Script ใน Google Sheet ของคุณ
2. Deploy เป็น Web App
3. คัดลอก URL แล้วใส่ในระบบ RabCheck
4. กดปุ่ม "ส่งไป Google Sheet" ในหน้ารวบรวมข้อมูล

---

## ขั้นตอนละเอียด

### 1. เปิด Google Sheet ของคุณ

เปิดไฟล์ Sheet "รายละเอียดเช็ค [รับมา]" หรือ Sheet ที่ต้องการเก็บข้อมูล

### 2. สร้าง Apps Script

1. ในเมนูของ Google Sheet คลิก **ส่วนขยาย (Extensions)** → **Apps Script**
2. จะเปิดแท็บใหม่ เป็นหน้าต่างแก้ไข Apps Script
3. ลบโค้ดเดิมทั้งหมด แล้ววางโค้ดด้านล่างนี้ (หรือเปิดไฟล์ **`GoogleSheet-AppScript.js`** ในโฟลเดอร์โปรเจกต์ RabCheck แล้วคัดลอกทั้งหมดไปวาง):

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var rows = data.rows || [];
    if (rows.length === 0) {
      return ContentService.createTextOutput(JSON.stringify({ ok: false, error: 'ไม่มีข้อมูล' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('69') || ss.getSheets()[0];
    // ใช้คอลัมน์ A (วัน/เดือน/ปี) หาแถวสุดท้ายที่มีข้อมูล เพื่อไม่ให้ข้ามแถวที่คอลัมน์ C มีค่าแต่คอลัมน์อื่นยังว่าง
    var colA = sheet.getRange('A1:A').getValues();
    var lastRow = 0;
    for (var i = colA.length - 1; i >= 0; i--) {
      if (colA[i][0] !== '' && colA[i][0] !== null && String(colA[i][0]).trim() !== '') {
        lastRow = i + 1;
        break;
      }
    }
    var startRow = (lastRow > 0) ? lastRow + 1 : 1;
    // เขียนทั้งแถว A–K ในครั้งเดียว (รวม I, J, K)
    var data = rows.map(function(row) {
      return [
        row.date || '',
        row.deposit_time || '',
        row.book_no || '',
        row.iv_no || '',
        row.cheque_no || '',
        row.account || '',
        row.amount != null && row.amount !== '' ? row.amount : '',
        row.total_amount != null && row.total_amount !== '' ? row.total_amount : '',
        row.buyer_place != null ? String(row.buyer_place) : '',
        row.cheque_source != null ? String(row.cheque_source) : '',
        row.status != null ? String(row.status) : ''
      ];
    });
    if (data.length > 0) {
      sheet.getRange(startRow, 1, data.length, 11).setValues(data);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, count: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

**หมายเหตุ:** บรรทัดที่เขียนคอลัมน์ 9, 10, 11 คือ I (ชื่อผู้ซื้อ/สถานที่), J (ที่มาเช็ค), K (สถานะ) — สคริปต์ต้องมีครบทั้งสามบรรทัด ถ้าใช้สคริปต์เก่าที่มีแค่คอลัมน์ A–H คอลัมน์ I, J, K จะว่างตลอด (ดูหัวข้อ "แก้ปัญหา → คอลัมน์ I, J, K ว่างทั้งหมด" ด้านล่าง)

4. **สำคัญ:** ถ้าชื่อแท็บไม่ใช่ `69` ให้แก้บรรทัด `getSheetByName('69')` เป็นชื่อแท็บของคุณ (เช่น `68`, `67`, `รายละเอียดเช็ค [รับมา]`)
5. คลิก **บันทึก (ไอคอนแผ่นดิสก์)**  
6. ตั้งชื่อโปรเจกต์ เช่น "RabCheck to Sheet"

### 3. Deploy เป็น Web App

1. คลิก **Deploy** → **New deployment**
2. คลิกไอคอนฟันเฟือง ⚙️ ข้าง "Select type" → เลือก **Web app**
3. กำหนดค่า:
   - **Description:** ใส่คำอธิบาย (เช่น "RabCheck")
   - **Execute as:** เลือก **Me** (อีเมลของคุณ)
   - **Who has access:** เลือก **Anyone** (ใครก็ได้ เพื่อให้ระบบ RabCheck ส่งข้อมูลได้)
4. คลิก **Deploy**
5. ระบบจะขออนุญาตครั้งแรก — คลิก **Authorize access** แล้วเลือกบัญชี Google ของคุณ
6. อนุมัติการเข้าถึง (คลิก **Advanced** → **Go to ... (unsafe)** ถ้ามี)
7. เมื่อเสร็จ จะมี **Web app URL** แสดง ให้คลิก **Copy** เพื่อคัดลอก URL (รูปแบบ `https://script.google.com/macros/s/xxxxx/exec`)

### 4. ตั้งค่าในระบบ RabCheck

1. เปิดระบบ RabCheck ที่ **http://localhost:5000**
2. ไปที่แท็บ **รวบรวมข้อมูล**
3. เลือกวันที่ต้องการ (หรือเว้นว่างเพื่อส่งทั้งหมด)
4. คลิกปุ่ม **ส่งไป Google Sheet**
5. ครั้งแรกจะเปิดหน้าต่างตั้งค่า — วาง URL ที่คัดลอกไว้ แล้วคลิก **บันทึก**
6. ระบบจะส่งข้อมูลไปยัง Google Sheet ทันที

### 5. ใช้งานครั้งถัดไป

- คลิก **ส่งไป Google Sheet** จะส่งข้อมูลตามวันที่ที่กรอง (หรือทั้งหมดถ้าไม่กรอง)
- สคริปต์จะ **อัปเดตแถวเดิม** ถ้าเจอแถวที่มี เล่มที่/เลขที่ + เลขที่ IV + เช็คเลขที่ ตรงกัน (รวมคอลัมน์ I, J, K) — ถ้าไม่พบจะเพิ่มเป็นแถวใหม่ต่อท้าย ดังนั้นแถวเก่าที่ I,J,K ว่าง ถ้าส่งจาก RabCheck อีกครั้ง (หลังแก้ชื่อผู้ซื้อ/สถานที่ในแอป) จะถูกเติมให้อัตโนมัติ

---

## การจัดคอลัมน์ (Column Mapping)

| คอลัมน์ใน Sheet | ข้อมูลจาก RabCheck |
|-----------------|---------------------|
| A: วัน/เดือน/ปี | วันที่ (รูปแบบไทย) |
| B: เวลานำฝาก | เวลานำฝาก |
| C: เล่มที่/เลขที่ | เล่มที่/เลขที่ |
| D: เลขที่ IV | เลขที่ IV |
| E: เช็คเลขที่ | เช็คเลขที่ |
| F: เข้าบัญชี | เข้าบัญชี |
| G: จำนวนเงิน | จำนวนเงิน |
| H: รวมจำนวนเงิน | รวมจำนวนเงิน |
| I: ชื่อผู้ซื้อ/สถานที่ | ชื่อผู้ซื้อ/สถานที่ |
| J: ที่มาเช็ค | ที่มาเช็ค |
| K: สถานะ | สถานะ |

สคริปต์ต้องมีคำสั่งเขียนครบทั้ง 11 คอลัมน์ (A–K) โดยคอลัมน์ I, J, K มาจาก `row.buyer_place`, `row.cheque_source`, `row.status` ตามลำดับ — ถ้าคอลัมน์ I, J, K ว่างใน Sheet ให้ดูหัวข้อ **แก้ปัญหา → คอลัมน์ I, J, K ว่างทั้งหมด** ด้านล่าง

---

## วิธีอื่น: ส่งออก CSV

ถ้าไม่ต้องการตั้งค่า Google Apps Script สามารถใช้ปุ่ม **ส่งออก CSV** เพื่อดาวน์โหลดไฟล์ CSV แล้วนำเข้า Google Sheet ด้วยมือ:

1. คลิก **ส่งออก CSV**
2. เปิด Google Sheet แล้วไปที่ **ไฟล์** → **นำเข้า** → **อัปโหลด**
3. เลือกไฟล์ CSV ที่ดาวน์โหลด

---

## แก้ปัญหา

### ส่งไม่สำเร็จ

ตรวจสอบว่า URL ถูกต้อง และ Web App ถูก Deploy โดยตั้ง **Who has access** เป็น **Anyone**

### ไม่เห็นข้อมูลเพิ่มใน Sheet

1. แก้ชื่อในโค้ด `getSheetByName('...')` ให้ตรงกับชื่อแท็บชีต (เช่น `'69'`)
2. **แก้โค้ดแล้วต้อง Deploy ใหม่:** Deploy → Manage deployments → ไอคอนแก้ไข → Version: New version → Deploy
3. ตรวจว่า Apps Script ถูกสร้างจากไฟล์ Sheet เดียวกับที่ต้องการรับข้อมูล (เปิดจาก **Extensions → Apps Script** ของไฟล์นั้น)
4. ลองเลื่อนลงไปดู — ถ้าคอลัมน์ C มีค่าล่วงหน้า ข้อมูลอาจถูกเขียนต่อจากแถวที่มีคอลัมน์ A ล่าสุด

### คอลัมน์ I, J, K ว่างทั้งหมด (ชื่อผู้ซื้อ/สถานที่, ที่มาเช็ค, สถานะ ไม่ขึ้นใน Sheet)

ถ้าใน Google Sheet **คอลัมน์ I, J, K ว่าง** (หรือมีแค่ A–H มีข้อมูล) แสดงว่าสคริปต์ที่คุณ Deploy อยู่ **ยังไม่มีการเขียนคอลัมน์ 9, 10, 11** — มักเกิดจากใช้สคริปต์เวอร์ชันเก่าที่เขียนแค่ 8 คอลัมน์แรก

**วิธีแก้ (ต้องทำทั้งสองขั้นตอน):**

1. เปิดไฟล์ Google Sheet นั้น → **ส่วนขยาย (Extensions)** → **Apps Script**
2. **ลบโค้ดในฟังก์ชัน `doPost` ทั้งหมด** แล้วคัดลอกโค้ดจากไฟล์ **`GoogleSheet-AppScript.js`** ในโฟลเดอร์โปรเจกต์ RabCheck (หรือจากหัวข้อ **"2. สร้าง Apps Script"** ในคู่มือนี้) ไปวางทับ — ใช้เวอร์ชันล่าสุดที่เขียนทั้งแถว A–K ด้วย `setValues()` ในครั้งเดียว จะได้คอลัมน์ I, J, K ครบ
3. ตรวจว่าในลูป `rows.forEach` มี **ครบ 11 บรรทัด** ดังนี้:
   - `sheet.getRange(r, 1)` ถึง `sheet.getRange(r, 8)` = คอลัมน์ A–H  
   - **`sheet.getRange(r, 9).setValue(row.buyer_place || '');`** = คอลัมน์ I (ชื่อผู้ซื้อ/สถานที่)  
   - **`sheet.getRange(r, 10).setValue(row.cheque_source || '');`** = คอลัมน์ J (ที่มาเช็ค)  
   - **`sheet.getRange(r, 11).setValue(row.status || '');`** = คอลัมน์ K (สถานะ)  
   ถ้าไม่มีบรรทัด 9, 10, 11 ให้ใช้โค้ดจากคู่มือซึ่งมีครบ
4. กด **บันทึก** (ไอคอนแผ่นดิสก์)
5. **Deploy ใหม่ (จำเป็น):** คลิก **Deploy** → **Manage deployments** → ไอคอนแก้ไข (ดินสอ) ที่ deployment ปัจจุบัน → ที่ **Version** เลือก **New version** → **Deploy**
6. กลับไปที่ RabCheck แล้วกด **ส่งไป Google Sheet** อีกครั้ง — จากการส่งครั้งถัดไป คอลัมน์ I, J, K จะมีข้อมูล

**หมายเหตุ:** แถวที่ส่งไปแล้วก่อน Deploy ใหม่ จะยังคงมี I, J, K ว่างอยู่ — หลังใช้สคริปต์ล่าสุด (ที่มีการอัปเดตแถวเดิม) ให้แก้ชื่อผู้ซื้อ/สถานที่ ในแอป RabCheck ให้ครบแล้วกด **ส่งไป Google Sheet** อีกครั้ง แถวเดิมจะถูกอัปเดต I, J, K ให้

---

### คอลัมน์ I (หรือ I, J, K) ว่างบางแถว

กรณีนี้มักเป็นแถวที่ส่งไปตอนที่ในแอปยังไม่ได้กรอกชื่อผู้ซื้อ/สถานที่ หรือใช้สคริปต์เก่าที่ยังไม่เขียน I,J,K

**วิธีแก้:** ใช้สคริปต์ล่าสุดจาก **`GoogleSheet-AppScript.js`** (มี logic อัปเดตแถวเดิม) แล้ว Deploy ใหม่ — จากนั้นในแอป RabCheck แก้ชื่อผู้ซื้อ/สถานที่ ที่มาเช็ค สถานะ ให้ครบแล้วกด **ส่งไป Google Sheet** อีกครั้ง แถวเดิมจะถูกอัปเดต I, J, K ให้อัตโนมัติ (หรือจะพิมพ์แก้ใน Sheet เองก็ได้)

### ต้องเปลี่ยน URL ของ Web App

ลบ URL เก่าในระบบ: เปิด Developer Tools (F12) → **Application** → **Local Storage** → ลบคีย์ `rabcheck_sheet_url` แล้วกด **ส่งไป Google Sheet** อีกครั้งเพื่อใส่ URL ใหม่
