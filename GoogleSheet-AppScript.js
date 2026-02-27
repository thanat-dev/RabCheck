/**
 * RabCheck - สคริปต์สำหรับ Google Apps Script (Web App)
 * ใช้รับข้อมูลจากระบบ RabCheck แล้วเขียนลง Google Sheet
 *
 * พฤติกรรม:
 * - ถ้าแถวที่มี เล่มที่/เลขที่ + เลขที่ IV + เช็คเลขที่ ตรงกันมีอยู่ใน Sheet แล้ว จะอัปเดตแถวนั้นทั้งแถว (รวม I,J,K)
 * - ถ้าไม่พบแถวตรงกัน จะเพิ่มเป็นแถวใหม่ต่อท้าย
 * ดังนั้นแถวเก่าที่คอลัมน์ I,J,K ว่าง จะถูกเติมเมื่อส่งจาก RabCheck อีกครั้ง (หลังแก้ชื่อผู้ซื้อ/สถานที่ในแอป)
 *
 * วิธีใช้:
 * 1. เปิด Google Sheet → ส่วนขยาย (Extensions) → Apps Script
 * 2. ลบโค้ดเดิมในไฟล์ Code.gs แล้ววางโค้ดนี้ทั้งหมด
 * 3. แก้ชื่อแท็บใน getSheetByName('69') ถ้าชื่อแท็บไม่ใช่ '69'
 * 4. บันทึก แล้ว Deploy → New deployment → Web app → Who has access: Anyone → Deploy
 * 5. คัดลอก Web app URL ไปใส่ใน RabCheck (ปุ่ม ส่งไป Google Sheet → ตั้งค่า URL)
 *
 * คอลัมน์: A=วันที่, B=เวลานำฝาก, C=เล่มที่/เลขที่, D=เลขที่ IV, E=เช็คเลขที่,
 * F=เข้าบัญชี, G=จำนวนเงิน, H=รวมจำนวนเงิน, I=ชื่อผู้ซื้อ/สถานที่, J=ที่มาเช็ค, K=สถานะ
 */
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
    // หาแถวสุดท้ายที่มีข้อมูล (คอลัมน์ A)
    var colA = sheet.getRange('A1:A').getValues();
    var lastRow = 0;
    for (var i = colA.length - 1; i >= 0; i--) {
      if (colA[i][0] !== '' && colA[i][0] !== null && String(colA[i][0]).trim() !== '') {
        lastRow = i + 1;
        break;
      }
    }
    // สร้าง map: key = เล่มที่|เลขที่ IV|เช็คเลขที่ -> หมายเลขแถวใน Sheet (สำหรับอัปเดตแถวเดิม)
    // getRange(row, column, numRows, numColumns) — แถว 2 ถึง lastRow = lastRow-1 แถว, คอลัมน์ C,D,E = 3 คอลัมน์
    var existingKeys = {};
    if (lastRow >= 2) {
      var numDataRows = lastRow - 1;
      var rangeCDE = sheet.getRange(2, 3, numDataRows, 3).getValues();
      for (var i = 0; i < rangeCDE.length; i++) {
        var c = rangeCDE[i][0], d = rangeCDE[i][1], e = rangeCDE[i][2];
        var key = (c != null ? String(c).trim() : '') + '|' + (d != null ? String(d).trim() : '') + '|' + (e != null ? String(e).trim() : '');
        if (key !== '||') existingKeys[key] = i + 2;
      }
    }
    var startRow = (lastRow > 0) ? lastRow + 1 : 1;
    var toAppend = [];
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      var key = (row.book_no != null ? String(row.book_no).trim() : '') + '|' + (row.iv_no != null ? String(row.iv_no).trim() : '') + '|' + (row.cheque_no != null ? String(row.cheque_no).trim() : '');
      var rowData = [
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
      if (existingKeys[key]) {
        sheet.getRange(existingKeys[key], 1, 1, 11).setValues([rowData]);
      } else {
        toAppend.push(rowData);
      }
    }
    if (toAppend.length > 0) {
      sheet.getRange(startRow, 1, toAppend.length, 11).setValues(toAppend);
    }
    return ContentService.createTextOutput(JSON.stringify({ ok: true, count: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
