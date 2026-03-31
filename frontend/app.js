(function () {
  'use strict';

  const API = window.location.origin;

  var BUYER_PLACE_LIST = [
    'โรงพยาบาลพระมงกุฎเกล้า',
    'โรงพยาบาลทหารเรือกรุงเทพ',
    'มูลนิธิราชประชานุเคราะห์ ในพระบรมราชูปถัมภ์',
    'โรงพยาบาลสมเด็จพระปิ่นเกล้า',
    'กลุ่มงานเวชภัณฑ์ กองเภสัชกรรม สำนักอนามัย',
    'ศูนย์รักษาความปลอดภัย กองบัญชาการกองทัพไทย',
    'กองคลังแพทย์ กรมแพทย์ทหารบก',
    'สถาบันพยาธิวิทยา ศูนย์อำนวยการแพทย์พระมงกุฎเกล้า',
    'ทัณฑสถานโรงพยาบาลราชทัณฑ์',
    'สถาบันเวชศาสตร์การบิน กองทัพอากาศ',
    'กรมแพทย์ทหารอากาศ',
    'โรงพยาบาลภูมิพลอดุลยเดช',
    'องค์การเภสัชกรรม สำนักงานใหญ่',
    'กรมแพทย์ทหารเรือ',
    'แผนกแพทย์ กองบริหาร กรมช่างอากาศ',
    'โรงพยาบาลทหารผ่านศึก',
    'การกีฬาแห่งประเทศไทย',
    'กรมแผนที่ทหาร',
    'โรงพยาบาลวิภาวดี (กรุงเทพฯ)',
    'การไฟฟ้าฝ่ายผลิตแห่งประเทศไทย',
    'มูลนิธิโรงพยาบาลตำรวจในพระบรมราชินูปถัมภ์ (โครงการร้านยา)',
    'สถาบันวิจัยวิทยาศาสตร์การแพท์ทหาร',
    'โรงพยาบาลทหารอากาศ (สีคัน) กรมแพทย์ทหารอากาศ',
    'สสน.นทพ.',
    'บริษัท พีเอ็มเควิทยาเวช จำกัด (ร้านยาสิรินธโรสถ รพ.พระมงกุฎ)',
    'โรงเรียนช่างฝีมือทหาร สถาบันวิชาการป้องกันประเทศ',
    'บริษัท สินแพทย์ เทพารักษ์ จำกัด',
    'บริษัท กรุงเทพดรักสโตร์ จำกัด (สำนักงานใหญ่)',
    'กองงานในพระองค์สมเด็จพระกนิษฐาธิราชเจ้ากรมสมเด็จพระเทพรัตนราชสุดาฯ สยามบรมราชกุมารี'
  ];

  function getBuyerPlaceRemovedList() {
    try {
      return JSON.parse(localStorage.getItem('rabcheck_buyer_place_removed') || '[]');
    } catch (e) { return []; }
  }

  function loadBuyerPlaceList() {
    var extra = [];
    try {
      extra = JSON.parse(localStorage.getItem('rabcheck_buyer_place') || '[]');
    } catch (e) { }
    var removed = getBuyerPlaceRemovedList();
    var list = BUYER_PLACE_LIST.filter(function (v) { return removed.indexOf(v) === -1; }).concat(extra);
    var datalist = document.getElementById('buyerPlaceList');
    datalist.innerHTML = list.map(function (v) { return '<option value="' + escapeHtml(v) + '">'; }).join('');
  }

  function numberToThaiWords(n) {
    var num = parseFloat(String(n).replace(/,/g, ''));
    if (isNaN(num) || num < 0) return '';
    var v = Math.round(num * 100) / 100;
    if (v === 0) return 'ศูนย์บาทถ้วน';
    var intPart = Math.floor(v);
    var decPart = Math.round((v - intPart) * 100);
    var t = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    var d = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    function toText(numStr, suffix) {
      var text = '', len = numStr.length, i, digit;
      for (i = 0; i < len; i++) {
        digit = parseInt(numStr.charAt(i), 10);
        if (digit > 0) {
          if (len > 2 && i === len - 1 && digit === 1 && suffix !== 'สตางค์') text += 'เอ็ด' + t[len - 1 - i];
          else text += d[digit] + t[len - 1 - i];
        }
      }
      text = text.replace(/หนึ่งสิบ/g, 'สิบ').replace(/สองสิบ/g, 'ยี่สิบ').replace(/สิบหนึ่ง/g, 'สิบเอ็ด');
      return text + suffix;
    }
    var s = intPart > 0 ? toText(String(intPart), 'บาท') : '';
    if (decPart === 0) s += s ? 'ถ้วน' : 'ศูนย์บาทถ้วน';
    else s += toText(('0' + decPart).slice(-2), 'สตางค์');
    return s;
  }

  function formatAmountDisplay(n) {
    var num = parseFloat(String(n).replace(/,/g, ''));
    if (isNaN(num)) return '';
    var s = num.toFixed(2);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  }

  function dateToIso(val) {
    if (!val || !val.trim()) return '';
    var s = String(val).trim();
    var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      var y = parseInt(m[1], 10);
      if (y >= 2500) y -= 543;
      return y + '-' + m[2] + '-' + m[3];
    }
    var thaiMonths = { 'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6, 'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12 };
    m = s.match(/(\d{1,2})\s+([ก-ฮ.]+)\s+(\d{4})/);
    if (m) {
      var d = parseInt(m[1], 10), mon = thaiMonths[m[2].trim()], y = parseInt(m[3], 10) - 543;
      if (mon && d >= 1 && d <= 31 && y > 1900 && y < 2100) {
        return y + '-' + String(mon).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      }
    }
    return '';
  }

  function normalizeDateForDb(val) {
    var iso = dateToIso(val);
    if (iso) return iso;
    if (!val || !String(val).trim()) return null;
    var s = String(val).trim().replace(/\s+/g, ' ').slice(0, 20);
    iso = dateToIso(s);
    return iso || null;
  }

  function saveBuyerPlaceExtra(val) {
    if (!val || !val.trim()) return;
    var set = {};
    BUYER_PLACE_LIST.forEach(function (v) { set[v] = true; });
    try {
      var extra = JSON.parse(localStorage.getItem('rabcheck_buyer_place') || '[]');
      extra.forEach(function (v) { set[v] = true; });
      if (!set[val.trim()]) {
        extra.push(val.trim());
        localStorage.setItem('rabcheck_buyer_place', JSON.stringify(extra));
        loadBuyerPlaceList();
      }
    } catch (e) { }
  }

  var ACCOUNT_PREDEFINED = ['192-0-15683-6', '192-0-07030-3', '017-0-05633-3', 'โอนเงิน', '017-6-02728-9'];

  /** บัญชีที่ใช้รับเช็ค — สำหรับแสดงเป็นเตือนความจำ (เลขที่บัญชี, ประเภท, ชื่อบัญชี, ธนาคาร, สาขา) */
  var ACCOUNT_REFERENCE = [
    { accountNo: '017-0-05633-3', type: 'ออมทรัพย์', name: 'เงินทุนหมุนเวียนโรงงานเภสัชกรรมทหาร ศอพท.', bank: 'KTB', branch: 'สุขุมวิท 93' },
    { accountNo: '017-6-02728-9', type: 'กระแสรายวัน', name: 'เงินทุนหมุนเวียนโรงงานเภสัชกรรมทหาร ศอพท.', bank: 'KTB', branch: 'สุขุมวิท 93' },
    { accountNo: '192-0-07030-3', type: 'ออมทรัพย์', name: 'โรงงานเภสัชกรรมทหาร', bank: 'KTB', branch: 'กรมศุลกากร' },
    { accountNo: '192-0-15683-6', type: 'ออมทรัพย์', name: 'เงินทุนหมุนเวียนโรงงานเภสัชกรรมทหาร (เงินทดรองจ่าย)', bank: 'KTB', branch: 'กรมศุลกากร' }
  ];

  function getAccountRemovedList() {
    try {
      return JSON.parse(localStorage.getItem('rabcheck_account_removed') || '[]');
    } catch (e) { return []; }
  }

  function getAccountExtraList() {
    try {
      return JSON.parse(localStorage.getItem('rabcheck_account_list') || '[]');
    } catch (e) { return []; }
  }

  function saveAccountExtra(val) {
    if (!val || !val.trim()) return;
    var list = getAccountExtraList();
    var v = val.trim();
    if (list.indexOf(v) === -1) {
      list.push(v);
      localStorage.setItem('rabcheck_account_list', JSON.stringify(list));
      loadAccountOptions();
    }
  }

  function getAccountOtherLabel() {
    return localStorage.getItem('rabcheck_account_other_label') || 'อื่นๆ (กรอกเอง)';
  }

  function setAccountOtherLabel(label) {
    if (label && label.trim()) localStorage.setItem('rabcheck_account_other_label', label.trim());
  }

  function loadAccountOptions() {
    var removed = getAccountRemovedList();
    var html = '<option value="">-- เลือก --</option>';
    ACCOUNT_PREDEFINED.filter(function (v) { return removed.indexOf(v) === -1; }).forEach(function (v) { html += '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>'; });
    getAccountExtraList().forEach(function (v) { html += '<option value="' + escapeHtml(v) + '">' + escapeHtml(v) + '</option>'; });
    if (removed.indexOf('__other__') === -1) {
      html += '<option value="__other__">' + escapeHtml(getAccountOtherLabel()) + '</option>';
    }
    var fAcc = document.getElementById('fAccount');
    if (fAcc) fAcc.innerHTML = html;
    var rfAcc = document.getElementById('rfAccount');
    if (rfAcc) rfAcc.innerHTML = html;
  }

  const uploadZone = document.getElementById('uploadZone');
  const fileInput = document.getElementById('fileInput');
  const uploadResult = document.getElementById('uploadResult');
  const entriesTableBody = document.getElementById('entriesTableBody');
  const collectTableBody = document.getElementById('collectTableBody');
  const pageUpload = document.getElementById('page-upload');
  const pageList = document.getElementById('page-list');
  const pageReport = document.getElementById('page-report');
  const reportContent = document.getElementById('reportContent');
  const entryModal = document.getElementById('entryModal');
  const entryForm = document.getElementById('entryForm');
  const modalClose = document.getElementById('modalClose');
  const btnDeleteEntry = document.getElementById('btnDeleteEntry');
  const btnPrintReport = document.getElementById('btnPrintReport');
  const receiptFormPanel = document.getElementById('receiptFormPanel');
  const receiptForm = document.getElementById('receiptForm');
  const receiptFormBackdrop = document.getElementById('receiptFormBackdrop');
  const btnCloseReceiptDrawer = document.getElementById('btnCloseReceiptDrawer');
  const btnCancelReceiptForm = document.getElementById('btnCancelReceiptForm');
  const btnSaveAndAdd = document.getElementById('btnSaveAndAdd');
  const receiptTableWrap = document.getElementById('receiptTableWrap');
  const receiptEmptyState = document.getElementById('receiptEmptyState');
  var lastListRows = [];
  var lastCollectRows = [];
  var receiptFormDatePicker = null;
  var listDatePicker = null;

  const fieldIds = [
    'entryId', 'fDate', 'fDepositTime', 'fBookNo', 'fIvNo', 'fChequeNo',
    'fAccount', 'fAmount', 'fTotalAmount', 'fBuyerPlace', 'fChequeSource',
    'fStatus', 'fAmountWords', 'fMemo'
  ];

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const page = this.getAttribute('data-page');
      document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
      this.classList.add('active');
      document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
      const target = document.getElementById('page-' + page);
      if (target) target.classList.add('active');
      if (page === 'upload') { loadUploadSummaryPlaces(); loadUploadAccountReference(); }
      if (page === 'list') loadEntries();
      if (page === 'collect') {
        var collectDateEl = document.getElementById('collectDate');
        if (!collectDateEl.value || !collectDateEl.value.trim()) {
          var today = new Date();
          var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
          if (typeof collectDatePicker !== 'undefined' && collectDatePicker) {
            collectDatePicker.setDate(todayStr, false);
          } else {
            collectDateEl.value = todayStr;
          }
        }
        loadCollect();
      }
      if (page === 'report') {
        initReportDatePickerIfNeeded();
        renderReport();
      }
    });
  });

  // Upload
  uploadZone.addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () {
    if (this.files.length) handleFile(this.files[0]);
  });
  uploadZone.addEventListener('dragover', function (e) {
    e.preventDefault();
    uploadZone.classList.add('dragover');
  });
  uploadZone.addEventListener('dragleave', function () {
    uploadZone.classList.remove('dragover');
  });
  uploadZone.addEventListener('drop', function (e) {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });
  var accountRefOnlyUsed = document.getElementById('accountRefOnlyUsed');
  if (accountRefOnlyUsed) accountRefOnlyUsed.addEventListener('change', loadUploadAccountReference);

  function handleFile(file) {
    if (!file.type.match(/^image\//)) {
      showUploadResult('กรุณาเลือกไฟล์รูปภาพเท่านั้น', true);
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    uploadResult.classList.remove('hidden');
    uploadResult.classList.remove('error');
    uploadResult.innerHTML = 'กำลังอัพโหลด...';
    fetch(API + '/api/upload', { method: 'POST', body: fd })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          showUploadResult(data.error, true);
          return;
        }
        let html = '<p><strong>อัพโหลดสำเร็จ</strong></p>';
        if (data.image_url) html += '<p><a href="' + API + data.image_url + '" target="_blank">ดูรูป</a></p>';
        html += '<p>ไปที่ <strong>รายการใบเสร็จ</strong> เพื่อกรอกข้อมูล</p>';
        html += '<p class="upload-actions">';
        html += '<button type="button" class="btn-primary" id="btnGoToList">ไปรายการใบเสร็จ</button> ';
        html += '<button type="button" class="btn-secondary" id="btnCancelUpload" data-upload-id="' + (data.upload_id || '') + '">ยกเลิกอัพโหลด</button>';
        html += '</p>';
        showUploadResult(html, false);
        fileInput.value = '';
        loadUploadSummaryPlaces();
        loadUploadAccountReference();
        if (data.current_upload_id) {
          sessionStorage.setItem('rabcheck_current_upload', String(data.current_upload_id));
          sessionStorage.setItem('rabcheck_current_upload_image', data.image_url || '');
        }
        // ปุ่มไปรายการใบเสร็จ
        document.getElementById('btnGoToList').addEventListener('click', function () {
          document.querySelector('.nav-btn[data-page="list"]').click();
          loadEntries();
          openEdit(null);
        });
        // ปุ่มยกเลิกอัพโหลด
        document.getElementById('btnCancelUpload').addEventListener('click', function () {
          var uid = this.getAttribute('data-upload-id');
          if (!uid || !confirm('ต้องการยกเลิกอัพโหลดนี้? รูปและรายการที่ผูกกับชุดนี้จะถูกลบ')) return;
          fetch(API + '/api/upload/' + uid, { method: 'DELETE' })
            .then(function (r) { return r.json(); })
            .then(function (res) {
              if (res.error) { alert(res.error); return; }
              sessionStorage.removeItem('rabcheck_current_upload');
              sessionStorage.removeItem('rabcheck_current_upload_image');
              sessionStorage.removeItem('rabcheck_ocr_fields');
              uploadResult.classList.add('hidden');
              if (document.querySelector('.nav-btn.active').getAttribute('data-page') === 'list') loadEntries();
            })
            .catch(function () { alert('ยกเลิกไม่สำเร็จ'); });
        });
      })
      .catch(function (err) {
        showUploadResult('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์'), true);
      });
  }

  function showUploadResult(html, isError) {
    uploadResult.innerHTML = html;
    uploadResult.classList.toggle('error', isError);
    uploadResult.classList.remove('hidden');
  }

  function loadUploadSummaryPlaces() {
    var listEl = document.getElementById('uploadSummaryPlacesList');
    if (!listEl) return;
    listEl.innerHTML = '<p class="upload-summary-places-loading">กำลังโหลด...</p>';
    fetch(API + '/api/entries')
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        var seen = {};
        var items = [];
        (rows || []).forEach(function (row) {
          var date = (row.date || '').toString().trim();
          var place = (row.buyer_place || '').toString().trim();
          if (!place) return;
          var key = date + '|' + place;
          if (seen[key]) return;
          seen[key] = true;
          items.push({ date: date, place: place });
        });
        items.sort(function (a, b) {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return b.date.localeCompare(a.date);
        });
        items = items.slice(0, 30);
        if (!items.length) {
          listEl.innerHTML = '<p class="upload-summary-places-empty">ยังไม่มีรายการที่ไปเก็บเช็ค</p>';
          return;
        }
        var html = '<ul>';
        items.forEach(function (item) {
          var dateStr = typeof formatDateThai === 'function' ? formatDateThai(item.date) : item.date;
          if (!dateStr) dateStr = item.date || '-';
          html += '<li><span class="place-date">' + escapeHtml(dateStr) + '</span><span class="place-name">' + escapeHtml(item.place) + '</span></li>';
        });
        html += '</ul>';
        listEl.innerHTML = html;
      })
      .catch(function () {
        listEl.innerHTML = '<p class="upload-summary-places-empty">โหลดไม่สำเร็จ</p>';
      });
  }

  function loadUploadAccountReference() {
    var container = document.getElementById('uploadAccountRefBody');
    var onlyUsedCb = document.getElementById('accountRefOnlyUsed');
    if (!container) return;
    var onlyUsed = onlyUsedCb ? onlyUsedCb.checked : false;
    var rows = ACCOUNT_REFERENCE.slice();
    if (onlyUsed) {
      fetch(API + '/api/entries')
        .then(function (r) { return r.json(); })
        .then(function (entries) {
          var used = {};
          (entries || []).forEach(function (row) {
            var acc = (row.account || '').toString().trim();
            if (acc) used[acc] = true;
          });
          var filtered = rows.filter(function (r) { return used[r.accountNo]; });
          renderAccountRefBody(filtered.length ? filtered : rows, false);
        })
        .catch(function () { renderAccountRefBody(rows); });
    } else {
      renderAccountRefBody(rows);
    }
  }

  function renderAccountRefBody(rows) {
    var tbody = document.getElementById('uploadAccountRefBody');
    if (!tbody) return;
    tbody.innerHTML = rows.map(function (r) {
      return '<tr><td>' + escapeHtml(r.accountNo) + '</td><td>' + escapeHtml(r.type) + '</td><td>' + escapeHtml(r.name) + '</td><td>' + escapeHtml(r.bank) + '</td><td>' + escapeHtml(r.branch) + '</td></tr>';
    }).join('');
  }

  function sortByBookNo(rows) {
    return rows.slice().sort(function (a, b) {
      var ka = (a.book_no || '').split('/').pop();
      var kb = (b.book_no || '').split('/').pop();
      var na = parseInt(ka, 10);
      var nb = parseInt(kb, 10);
      if (isNaN(na) && isNaN(nb)) return 0;
      if (isNaN(na)) return 1;
      if (isNaN(nb)) return -1;
      return na - nb;
    });
  }

  var DATE_SORT_STORAGE = 'rabcheck_date_sort_order';
  function getDateSortOrder() {
    return (sessionStorage.getItem(DATE_SORT_STORAGE) || 'asc'); // 'asc' = เก่าไปใหม่, 'desc' = ใหม่ไปเก่า
  }
  function setDateSortOrder(order) {
    sessionStorage.setItem(DATE_SORT_STORAGE, order);
  }
  function toggleDateSortOrder() {
    var next = getDateSortOrder() === 'asc' ? 'desc' : 'asc';
    setDateSortOrder(next);
    return next;
  }

  function sortByDate(rows, order) {
    var dir = order === 'desc' ? -1 : 1;
    return rows.slice().sort(function (a, b) {
      var isoA = dateToIso(a.date || '') || '';
      var isoB = dateToIso(b.date || '') || '';
      var c = isoA.localeCompare(isoB);
      if (c !== 0) return c * dir;
      var ka = (a.book_no || '').split('/').pop();
      var kb = (b.book_no || '').split('/').pop();
      var na = parseInt(ka, 10);
      var nb = parseInt(kb, 10);
      if (isNaN(na) && isNaN(nb)) return 0;
      if (isNaN(na)) return 1 * dir;
      if (isNaN(nb)) return -1 * dir;
      return (na - nb) * dir;
    });
  }

  function getListSearchQuery() {
    var el = document.getElementById('listSearch');
    return (el && el.value) ? String(el.value).trim().toLowerCase() : '';
  }

  function filterRowsBySearch(rows) {
    var q = getListSearchQuery();
    if (!q) return rows;
    return rows.filter(function (row) {
      var text = [
        row.book_no,
        row.iv_no,
        row.cheque_no,
        row.account,
        row.buyer_place,
        row.cheque_source,
        row.status
      ].join(' ').toLowerCase();
      return text.indexOf(q) !== -1;
    });
  }

  function renderEntriesTable(rows) {
    var filtered = filterRowsBySearch(rows);
    if (!filtered.length) {
      var msg = rows.length ? 'ไม่พบรายการที่ตรงกับคำค้น' : '';
      if (!rows.length) return;
      entriesTableBody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-muted);">' + msg + '</td></tr>';
      return;
    }
    entriesTableBody.innerHTML = filtered.map(function (row) {
      var amt = row.amount != null ? formatNumber(row.amount) : '-';
      var total = row.total_amount != null ? formatNumber(row.total_amount) : '-';
      return (
        '<tr data-id="' + row.id + '">' +
        '<td class="actions">' +
        '<button type="button" class="edit" data-id="' + row.id + '">แก้ไข</button> ' +
        '<button type="button" class="delete" data-id="' + row.id + '">ลบ</button>' +
        '</td>' +
        '<td>' + escapeHtml(formatDateThai(row.date || '') || '-') + '</td>' +
        '<td>' + escapeHtml(row.deposit_time || '-') + '</td>' +
        '<td>' + escapeHtml(row.book_no || '-') + '</td>' +
        '<td>' + escapeHtml(row.iv_no || '-') + '</td>' +
        '<td>' + escapeHtml(row.cheque_no || '-') + '</td>' +
        '<td>' + escapeHtml(row.account || '-') + '</td>' +
        '<td class="amount">' + amt + '</td>' +
        '<td class="amount">' + total + '</td>' +
        '<td>' + escapeHtml(row.buyer_place || '-') + '</td>' +
        '<td>' + escapeHtml(row.cheque_source || '-') + '</td>' +
        '<td>' + escapeHtml(row.status || '-') + '</td></tr>'
      );
    }).join('');
    entriesTableBody.querySelectorAll('button.edit').forEach(function (btn) {
      btn.addEventListener('click', function (e) { e.stopPropagation(); openEdit(this.getAttribute('data-id')); });
    });
    entriesTableBody.querySelectorAll('button.delete').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var id = this.getAttribute('data-id');
        if (!id || !confirm('ต้องการลบรายการนี้?')) return;
        fetch(API + '/api/entries/' + id, { method: 'DELETE' })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.error) { alert(res.error); return; }
            loadEntries();
          })
          .catch(function () { alert('ลบไม่สำเร็จ'); });
      });
    });
    entriesTableBody.querySelectorAll('tr[data-id]').forEach(function (tr) {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', function (e) {
        if (e.target.closest('.actions')) return;
        openEdit(tr.getAttribute('data-id'));
      });
    });
  }

  // Load entries — ถ้ามี current_upload_id จะแสดงเฉพาะรายการของชุดอัพโหลดนั้น หรือถ้ามี date filter (ช่องกรองวันที่หรือจากหน้ารวบรวมข้อมูล)
  function loadEntries() {
    var uploadId = sessionStorage.getItem('rabcheck_current_upload');
    var dateFilter = sessionStorage.getItem('rabcheck_list_date_filter');
    if (listDatePicker && listDatePicker.selectedDates && listDatePicker.selectedDates[0]) {
      var d = listDatePicker.selectedDates[0];
      dateFilter = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    } else {
      var listDateEl = document.getElementById('listDateFilter');
      if (listDateEl && listDateEl.value && listDateEl.value.trim()) {
        var raw = listDateEl.value.trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(raw)) dateFilter = raw.slice(0, 10);
        else { var iso = dateToIso(raw); if (iso) dateFilter = iso.slice(0, 10); }
      }
    }
    var url = API + '/api/entries';
    var params = [];
    if (uploadId) params.push('upload_id=' + encodeURIComponent(uploadId));
    if (dateFilter) params.push('date=' + encodeURIComponent(dateFilter));
    if (params.length) url += '?' + params.join('&');
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        lastListRows = sortByDate(sortByBookNo(rows || []), getDateSortOrder());
        if (!lastListRows.length) {
          receiptTableWrap.classList.add('hidden');
          var tablePanelActions = document.getElementById('tablePanelActions');
          if (tablePanelActions) tablePanelActions.classList.add('hidden');
          receiptEmptyState.classList.remove('hidden');
          receiptEmptyState.innerHTML = '<p class="empty-state-text">ยังไม่มีรายการใบเสร็จ</p>' +
            '<button type="button" id="btnAddNewEmpty" class="btn-primary">+ เพิ่มรายการใบเสร็จ</button>';
          var addBtn = document.getElementById('btnAddNewEmpty');
          if (addBtn) addBtn.addEventListener('click', function () { openEdit(null); });
          return;
        }
        receiptTableWrap.classList.remove('hidden');
        var tablePanelActions = document.getElementById('tablePanelActions');
        if (tablePanelActions) {
          tablePanelActions.classList.remove('hidden');
          var btnAddAbove = document.getElementById('btnAddNewAboveTable');
          if (btnAddAbove && !btnAddAbove._bound) {
            btnAddAbove._bound = true;
            btnAddAbove.addEventListener('click', function () { openEdit(null); });
          }
        }
        receiptEmptyState.classList.add('hidden');
        renderEntriesTable(lastListRows);
      })
      .catch(function () {
        receiptTableWrap.classList.remove('hidden');
        var tablePanelActions = document.getElementById('tablePanelActions');
        if (tablePanelActions) tablePanelActions.classList.add('hidden');
        receiptEmptyState.classList.add('hidden');
        entriesTableBody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:24px;color:red;">โหลดข้อมูลไม่สำเร็จ</td></tr>';
      })
      .finally(function () { updateShowAllButton(); });
  }

  function formatNumber(n) {
    if (n == null) return '-';
    return formatAmountDisplay(Number(n)) || '-';
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function applyOcrToForm(fields) {
    if (!fields || typeof fields !== 'object') return;
    if (fields.cheque_no) document.getElementById('fChequeNo').value = String(fields.cheque_no).trim();
    if (fields.date) {
      var d = dateToIso(fields.date);
      if (d) {
        if (datePickerInstance) datePickerInstance.setDate(d, false);
        else document.getElementById('fDate').value = d;
      }
    }
    // จำนวนเงิน (ยอดในใบเสร็จ) และรวมจำนวนเงิน: ไม่ดึงจากภาพ ปล่อยว่างให้กรอกเอง
    if (fields.iv_no) document.getElementById('fIvNo').value = String(fields.iv_no).trim();
    if (fields.book_no) document.getElementById('fBookNo').value = String(fields.book_no).trim();
  }

  function openEdit(id) {
    if (!id) {
      clearForm();
      document.getElementById('modalTitle').textContent = 'เพิ่มรายการ (กรอกเอง)';
      var img = document.getElementById('modalImage');
      var imgUrl = sessionStorage.getItem('rabcheck_current_upload_image');
      if (imgUrl) img.innerHTML = '<img src="' + API + imgUrl + '" alt="">';
      else img.innerHTML = '';
      document.getElementById('entryId').value = '';
      var uploadId = sessionStorage.getItem('rabcheck_current_upload');
      if (uploadId) {
        // ดึงผล OCR ใหม่จากเซิร์ฟเวอร์ทุกครั้ง (ให้ได้ cheque_no ล่าสุดหลังแก้ logic แล้ว)
        fetch(API + '/api/upload/' + uploadId + '/ocr')
          .then(function (r) { return r.json(); })
          .then(function (ocr) {
            var f = (ocr && ocr.fields) ? ocr.fields : {};
            applyOcrToForm(f);
            sessionStorage.setItem('rabcheck_ocr_fields', JSON.stringify(f));
          })
          .catch(function () {
            var stored = sessionStorage.getItem('rabcheck_ocr_fields');
            if (stored) try { applyOcrToForm(JSON.parse(stored)); } catch (e) { }
          });
      }
      entryModal.classList.remove('hidden');
      return;
    }
    fetch(API + '/api/entries/' + id)
      .then(function (r) { return r.json(); })
      .then(function (row) {
        document.getElementById('entryId').value = row.id;
        var dateVal = dateToIso(row.date || '') || '';
        if (datePickerInstance) { datePickerInstance.setDate(dateVal, false); } else { document.getElementById('fDate').value = dateVal; }
        document.getElementById('fDepositTime').value = row.deposit_time || '';
        document.getElementById('fBookNo').value = row.book_no || '';
        document.getElementById('fIvNo').value = row.iv_no || '';
        document.getElementById('fChequeNo').value = row.cheque_no || '';
        var acc = row.account || '';
        var fAcc = document.getElementById('fAccount');
        var fAccOther = document.getElementById('fAccountOther');
        var accRemoved = getAccountRemovedList();
        var predefined = ACCOUNT_PREDEFINED.filter(function (v) { return accRemoved.indexOf(v) === -1; }).concat(getAccountExtraList());
        if (acc && predefined.indexOf(acc) === -1) {
          fAcc.value = '__other__';
          fAccOther.value = acc;
          fAccOther.classList.remove('hidden');
        } else {
          fAcc.value = acc;
          fAccOther.value = '';
          fAccOther.classList.add('hidden');
        }
        document.getElementById('fAmount').value = row.amount != null ? formatAmountDisplay(row.amount) : '';
        syncFromAmount();
        document.getElementById('fBuyerPlace').value = row.buyer_place || '';
        document.getElementById('fChequeSource').value = row.cheque_source || '';
        document.getElementById('fStatus').value = row.status || '';
        document.getElementById('fMemo').value = row.memo || '';
        document.getElementById('modalTitle').textContent = 'แก้ไขรายการ';
        var img = document.getElementById('modalImage');
        if (row.image_path) {
          img.innerHTML = '<img src="' + API + '/api/uploads/' + escapeHtml(row.image_path) + '" alt="">';
        } else {
          img.innerHTML = '';
        }
        btnDeleteEntry.style.display = '';
        entryModal.classList.remove('hidden');
      })
      .catch(function () {
        alert('โหลดรายการไม่สำเร็จ');
      });
  }

  function clearForm() {
    fieldIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.type !== 'hidden') el.value = '';
    });
    document.getElementById('entryId').value = '';
    document.getElementById('fAmount').value = '';
    document.getElementById('fTotalAmount').value = '';
    document.getElementById('fAccount').value = '';
    document.getElementById('fAccountOther').value = '';
    document.getElementById('fAccountOther').classList.add('hidden');
    if (datePickerInstance) datePickerInstance.clear();
    btnDeleteEntry.style.display = 'none';
  }

  entryForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = document.getElementById('entryId').value;
    var uploadId = sessionStorage.getItem('rabcheck_current_upload');
    var payload = {
      upload_id: uploadId || null,
      date: document.getElementById('fDate').value || null,
      deposit_time: document.getElementById('fDepositTime').value || null,
      book_no: document.getElementById('fBookNo').value || null,
      iv_no: document.getElementById('fIvNo').value || null,
      cheque_no: document.getElementById('fChequeNo').value || null,
      account: (function () {
        var v = document.getElementById('fAccount').value;
        if (v === '__other__') return document.getElementById('fAccountOther').value || null;
        return v || null;
      })(),
      amount: (function () { var v = (document.getElementById('fAmount').value || '').replace(/,/g, ''); return v ? v : null; })(),
      total_amount: (function () { var v = (document.getElementById('fTotalAmount').value || '').replace(/,/g, ''); return v ? v : null; })(),
      buyer_place: document.getElementById('fBuyerPlace').value || null,
      cheque_source: document.getElementById('fChequeSource').value || null,
      status: document.getElementById('fStatus').value || null,
      amount_words: document.getElementById('fAmountWords').value || null,
      memo: document.getElementById('fMemo').value || null
    };
    var url = API + '/api/entries';
    var method = 'POST';
    if (id) {
      url += '/' + id;
      method = 'PUT';
    }
    fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.error) {
          alert(data.error);
          return;
        }
        entryModal.classList.add('hidden');
        saveBuyerPlaceExtra(payload.buyer_place);
        if (payload.account) saveAccountExtra(payload.account);
        loadEntries();
        if (typeof loadCollect === 'function') loadCollect();
      })
      .catch(function () { alert('บันทึกไม่สำเร็จ'); });
  });

  modalClose.addEventListener('click', function () { entryModal.classList.add('hidden'); });
  entryModal.addEventListener('click', function (e) {
    if (e.target === entryModal) entryModal.classList.add('hidden');
  });

  btnDeleteEntry.addEventListener('click', function () {
    var id = document.getElementById('entryId').value;
    if (!id || !confirm('ต้องการลบรายการนี้?')) return;
    fetch(API + '/api/entries/' + id, { method: 'DELETE' })
      .then(function (r) { return r.json(); })
      .then(function () {
        entryModal.classList.add('hidden');
        loadEntries();
        if (typeof loadCollect === 'function') loadCollect();
      })
      .catch(function () { alert('ลบไม่สำเร็จ'); });
  });

  if (receiptForm) {
    function openReceiptForm(mode, id) {
      var isCreate = mode === 'create' || !id;
      document.getElementById('receiptFormModeLabel').textContent = isCreate ? 'เพิ่ม' : 'แก้ไข';
      document.getElementById('receiptFormTitle').textContent = isCreate ? 'เพิ่มรายการใบเสร็จ' : 'แก้ไขรายการใบเสร็จ';
      var btnDel = document.getElementById('btnDeleteReceipt');
      if (btnDel) btnDel.style.display = isCreate ? 'none' : '';
      if (isCreate) {
        clearReceiptForm();
        var uploadId = sessionStorage.getItem('rabcheck_current_upload');
        if (uploadId) {
          fetch(API + '/api/upload/' + uploadId + '/ocr')
            .then(function (r) { return r.json(); })
            .then(function (ocr) {
              var f = (ocr && ocr.fields) ? ocr.fields : {};
              if (f.cheque_no) document.getElementById('rfChequeNo').value = String(f.cheque_no).trim();
              if (f.date) {
                var d = dateToIso(f.date);
                if (d && receiptFormDatePicker) receiptFormDatePicker.setDate(d, false);
              }
              if (f.iv_no) document.getElementById('rfIvNo').value = String(f.iv_no).trim();
              if (f.book_no) document.getElementById('rfBookNo').value = String(f.book_no).trim();
            })
            .catch(function () { });
        }
      } else {
        fetch(API + '/api/entries/' + id)
          .then(function (r) { return r.json(); })
          .then(function (row) {
            document.getElementById('rfId').value = row.id;
            var dateVal = dateToIso(row.date || '') || '';
            if (receiptFormDatePicker) receiptFormDatePicker.setDate(dateVal, false);
            document.getElementById('rfDepositTime').value = row.deposit_time || '';
            document.getElementById('rfBookNo').value = row.book_no || '';
            document.getElementById('rfIvNo').value = row.iv_no || '';
            document.getElementById('rfChequeNo').value = row.cheque_no || '';
            var acc = row.account || '';
            var fAcc = document.getElementById('rfAccount');
            var fAccOther = document.getElementById('rfAccountOther');
            var accRemoved = getAccountRemovedList();
            var predefined = ACCOUNT_PREDEFINED.filter(function (v) { return accRemoved.indexOf(v) === -1; }).concat(getAccountExtraList());
            if (acc && predefined.indexOf(acc) === -1) {
              fAcc.value = '__other__';
              fAccOther.value = acc;
              fAccOther.classList.remove('hidden');
            } else {
              fAcc.value = acc;
              fAccOther.value = '';
              fAccOther.classList.add('hidden');
            }
            document.getElementById('rfAmount').value = row.amount != null ? formatAmountDisplay(row.amount) : '';
            syncReceiptTotal();
            document.getElementById('rfBuyerPlace').value = row.buyer_place || '';
            document.getElementById('rfChequeSource').value = row.cheque_source || '';
            document.getElementById('rfStatus').value = row.status || '';
            document.getElementById('rfMemo').value = row.memo || '';
          })
          .catch(function () { alert('โหลดรายการไม่สำเร็จ'); });
      }
      openReceiptDrawer();
    }

    function clearReceiptForm() {
      document.getElementById('rfId').value = '';
      document.getElementById('rfDate').value = '';
      if (receiptFormDatePicker) receiptFormDatePicker.clear();
      document.getElementById('rfDepositTime').value = '';
      document.getElementById('rfBookNo').value = '';
      document.getElementById('rfIvNo').value = '';
      document.getElementById('rfChequeNo').value = '';
      document.getElementById('rfAccount').value = '';
      document.getElementById('rfAccountOther').value = '';
      document.getElementById('rfAccountOther').classList.add('hidden');
      document.getElementById('rfAmount').value = '';
      document.getElementById('rfVat').value = '';
      document.getElementById('rfTotalAmount').value = '';
      document.getElementById('rfBuyerPlace').value = '';
      document.getElementById('rfTaxId').value = '';
      document.getElementById('rfExpenseType').value = '';
      document.getElementById('rfChequeSource').value = '';
      document.getElementById('rfStatus').value = '';
      document.getElementById('rfMemo').value = '';
    }

    function syncReceiptTotal() {
      var v = (document.getElementById('rfAmount').value || '').replace(/,/g, '').trim();
      var vat = (document.getElementById('rfVat').value || '').replace(/,/g, '').trim();
      var n = parseFloat(v);
      var nVat = parseFloat(vat);
      if (!isNaN(n) && n >= 0) {
        var total = isNaN(nVat) ? n : n + nVat;
        document.getElementById('rfTotalAmount').value = formatAmountDisplay(total);
      } else {
        document.getElementById('rfTotalAmount').value = '';
      }
    }

    function openReceiptDrawer() {
      if (window.matchMedia('(max-width: 768px)').matches) {
        receiptFormPanel.classList.add('drawer-open');
        if (receiptFormBackdrop) {
          receiptFormBackdrop.classList.add('show');
          receiptFormBackdrop.setAttribute('aria-hidden', 'false');
        }
        if (btnCloseReceiptDrawer) btnCloseReceiptDrawer.style.display = 'block';
      }
    }

    function closeReceiptDrawer() {
      receiptFormPanel.classList.remove('drawer-open');
      if (receiptFormBackdrop) {
        receiptFormBackdrop.classList.remove('show');
        receiptFormBackdrop.setAttribute('aria-hidden', 'true');
      }
      if (btnCloseReceiptDrawer) btnCloseReceiptDrawer.style.display = 'none';
    }

    if (receiptFormBackdrop) {
      receiptFormBackdrop.addEventListener('click', function () {
        closeReceiptDrawer();
      });
    }
    if (btnCloseReceiptDrawer) {
      btnCloseReceiptDrawer.addEventListener('click', function () {
        closeReceiptDrawer();
      });
    }
    if (btnCancelReceiptForm) {
      btnCancelReceiptForm.addEventListener('click', function () {
        clearReceiptForm();
        document.getElementById('receiptFormModeLabel').textContent = 'เพิ่ม';
        document.getElementById('receiptFormTitle').textContent = 'เพิ่มรายการใบเสร็จ';
        closeReceiptDrawer();
      });
    }

    var saveAndAddNext = false;
    if (btnSaveAndAdd) {
      btnSaveAndAdd.addEventListener('click', function () {
        saveAndAddNext = true;
      });
    }

    receiptForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var id = document.getElementById('rfId').value;
      var uploadId = sessionStorage.getItem('rabcheck_current_upload');
      var payload = {
        upload_id: uploadId || null,
        date: (function () {
          if (receiptFormDatePicker && receiptFormDatePicker.selectedDates && receiptFormDatePicker.selectedDates[0]) {
            var d = receiptFormDatePicker.selectedDates[0];
            return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
          }
          return (document.getElementById('rfDate').value || '').trim() || null;
        })(),
        deposit_time: document.getElementById('rfDepositTime').value || null,
        book_no: document.getElementById('rfBookNo').value || null,
        iv_no: document.getElementById('rfIvNo').value || null,
        cheque_no: document.getElementById('rfChequeNo').value || null,
        account: (function () {
          var v = document.getElementById('rfAccount').value;
          if (v === '__other__') return document.getElementById('rfAccountOther').value || null;
          return v || null;
        })(),
        amount: (function () { var v = (document.getElementById('rfAmount').value || '').replace(/,/g, ''); return v ? v : null; })(),
        total_amount: (function () { var v = (document.getElementById('rfTotalAmount').value || '').replace(/,/g, ''); return v ? v : null; })(),
        buyer_place: document.getElementById('rfBuyerPlace').value || null,
        cheque_source: document.getElementById('rfChequeSource').value || null,
        status: document.getElementById('rfStatus').value || null,
        memo: document.getElementById('rfMemo').value || null
      };
      var url = API + '/api/entries';
      var method = 'POST';
      if (id) {
        url += '/' + id;
        method = 'PUT';
      }
      fetch(url, { method: method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) {
            alert(data.error);
            return;
          }
          saveBuyerPlaceExtra(payload.buyer_place);
          loadEntries();
          if (saveAndAddNext) {
            saveAndAddNext = false;
            clearReceiptForm();
            document.getElementById('receiptFormModeLabel').textContent = 'เพิ่ม';
            document.getElementById('receiptFormTitle').textContent = 'เพิ่มรายการใบเสร็จ';
            var uploadId = sessionStorage.getItem('rabcheck_current_upload');
            if (uploadId) {
              fetch(API + '/api/upload/' + uploadId + '/ocr')
                .then(function (r) { return r.json(); })
                .then(function (ocr) {
                  var f = (ocr && ocr.fields) ? ocr.fields : {};
                  if (f.cheque_no) document.getElementById('rfChequeNo').value = String(f.cheque_no).trim();
                })
                .catch(function () { });
            }
          } else {
            closeReceiptDrawer();
          }
        })
        .catch(function () { alert('บันทึกไม่สำเร็จ'); });
    });

    document.getElementById('rfAmount').addEventListener('blur', function () {
      var v = this.value.replace(/,/g, '').trim();
      if (!v) { syncReceiptTotal(); return; }
      var n = parseFloat(v);
      if (!isNaN(n)) {
        this.value = formatAmountDisplay(n);
        syncReceiptTotal();
      }
    });
    document.getElementById('rfAmount').addEventListener('input', syncReceiptTotal);
    document.getElementById('rfVat').addEventListener('input', syncReceiptTotal);
    document.getElementById('rfVat').addEventListener('blur', function () {
      var v = this.value.replace(/,/g, '').trim();
      if (v) {
        var n = parseFloat(v);
        if (!isNaN(n)) this.value = formatAmountDisplay(n);
      }
      syncReceiptTotal();
    });
    document.getElementById('rfAccount').addEventListener('change', function () {
      var other = document.getElementById('rfAccountOther');
      if (this.value === '__other__') {
        other.classList.remove('hidden');
        other.focus();
      } else {
        other.classList.add('hidden');
        other.value = '';
      }
    });

    var btnDeleteReceipt = document.getElementById('btnDeleteReceipt');
    if (btnDeleteReceipt) {
      btnDeleteReceipt.addEventListener('click', function () {
        var id = document.getElementById('rfId').value;
        if (!id || !confirm('ต้องการลบรายการนี้?')) return;
        fetch(API + '/api/entries/' + id, { method: 'DELETE' })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.error) { alert(res.error); return; }
            clearReceiptForm();
            document.getElementById('receiptFormModeLabel').textContent = 'เพิ่ม';
            document.getElementById('receiptFormTitle').textContent = 'เพิ่มรายการใบเสร็จ';
            if (btnDeleteReceipt) btnDeleteReceipt.style.display = 'none';
            loadEntries();
            closeReceiptDrawer();
          })
          .catch(function () { alert('ลบไม่สำเร็จ'); });
      });
    }

    function initReceiptFormDatePicker() {
      if (receiptFormDatePicker || typeof flatpickr === 'undefined' || !document.getElementById('rfDate')) return;
      var months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      receiptFormDatePicker = flatpickr('#rfDate', {
        locale: (flatpickr.l10ns && flatpickr.l10ns.th) ? flatpickr.l10ns.th : 'th',
        dateFormat: 'Y-m-d',
        altInput: true,
        altFormat: 'j M Y',
        formatDate: function (date) {
          return date.getDate() + ' ' + months[date.getMonth()] + ' ' + (date.getFullYear() + 543);
        },
        allowInput: false
      });
    }
    initReceiptFormDatePicker();
  }

  if (document.getElementById('listSearch')) {
    document.getElementById('listSearch').addEventListener('input', function () {
      if (lastListRows.length) renderEntriesTable(sortByDate(lastListRows, getDateSortOrder()));
    });
  }

  document.getElementById('btnShowAll').addEventListener('click', function () {
    sessionStorage.removeItem('rabcheck_current_upload');
    sessionStorage.removeItem('rabcheck_current_upload_image');
    loadEntries();
  });

  document.getElementById('btnBackToCollect').addEventListener('click', function () {
    sessionStorage.removeItem('rabcheck_list_date_filter');
    document.querySelector('.nav-btn[data-page="collect"]').click();
  });

  document.getElementById('btnCancelUploadToolbar').addEventListener('click', function () {
    var uploadId = sessionStorage.getItem('rabcheck_current_upload');
    if (!uploadId || !confirm('ต้องการยกเลิกอัพโหลด? รูปและรายการที่ผูกกับชุดนี้จะถูกลบ')) return;
    fetch(API + '/api/upload/' + uploadId, { method: 'DELETE' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.error) { alert(res.error); return; }
        sessionStorage.removeItem('rabcheck_current_upload');
        sessionStorage.removeItem('rabcheck_current_upload_image');
        sessionStorage.removeItem('rabcheck_ocr_fields');
        loadEntries();
      })
      .catch(function () { alert('ยกเลิกไม่สำเร็จ'); });
  });

  function updateShowAllButton() {
    var uploadId = sessionStorage.getItem('rabcheck_current_upload');
    var dateFilter = sessionStorage.getItem('rabcheck_list_date_filter');
    document.getElementById('btnShowAll').style.display = uploadId ? '' : 'none';
    document.getElementById('btnShowAll').title = uploadId ? 'แสดงทุกรายการทั้งหมด (รวมชุดเก่า)' : '';
    document.getElementById('btnCancelUploadToolbar').style.display = uploadId ? '' : 'none';
    document.getElementById('btnCancelUploadToolbar').title = uploadId ? 'ยกเลิกอัพโหลดชุดนี้ (รูปและรายการจะถูกลบ)' : '';
    document.getElementById('btnBackToCollect').style.display = dateFilter ? '' : 'none';
    document.getElementById('btnBackToCollect').title = dateFilter ? 'กลับไปหน้ารวบรวมข้อมูล' : '';
  }

  document.getElementById('fAmount').addEventListener('blur', function () {
    var v = this.value.replace(/,/g, '').trim();
    if (!v) { syncFromAmount(); return; }
    var n = parseFloat(v);
    if (!isNaN(n)) {
      this.value = formatAmountDisplay(n);
      syncFromAmount();
    }
  });
  document.getElementById('fAmount').addEventListener('input', function () {
    syncFromAmount();
  });
  function syncFromAmount() {
    var v = (document.getElementById('fAmount').value || '').replace(/,/g, '').trim();
    var n = parseFloat(v);
    if (!isNaN(n) && n >= 0) {
      document.getElementById('fTotalAmount').value = formatAmountDisplay(n);
      document.getElementById('fAmountWords').value = numberToThaiWords(n);
    } else {
      document.getElementById('fTotalAmount').value = '';
      document.getElementById('fAmountWords').value = '';
    }
  }

  document.getElementById('fAccount').addEventListener('change', function () {
    var other = document.getElementById('fAccountOther');
    if (this.value === '__other__') {
      other.classList.remove('hidden');
      other.focus();
    } else {
      other.classList.add('hidden');
      other.value = '';
    }
  });

  var BUYER_TO_ACCOUNT = { 'องค์การเภสัชกรรม สำนักงานใหญ่': '017-6-02728-9' };
  document.getElementById('fBuyerPlace').addEventListener('change', syncAccountFromBuyer);
  document.getElementById('fBuyerPlace').addEventListener('blur', syncAccountFromBuyer);
  function syncAccountFromBuyer() {
    var buyer = (document.getElementById('fBuyerPlace').value || '').trim();
    var acc = BUYER_TO_ACCOUNT[buyer];
    if (acc) {
      var fAcc = document.getElementById('fAccount');
      var fAccOther = document.getElementById('fAccountOther');
      fAcc.value = acc;
      fAccOther.classList.add('hidden');
      fAccOther.value = '';
    }
  }

  // Report: แสดงรายการล่าสุด 1 อัน หรือกรองตามวันที่ หรือแสดงทั้งหมด
  var reportMode = 'latest'; // 'latest' | 'date' | 'all'
  function getReportDateValue() {
    var raw = '';
    if (reportDatePicker) {
      var sel = reportDatePicker.selectedDates;
      if (sel && sel[0]) {
        var d = sel[0];
        raw = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      } else {
        var inp = reportDatePicker.input;
        if (inp && inp.value) raw = inp.value.trim();
      }
    }
    if (!raw) {
      var el = document.getElementById('reportDate');
      if (el && el.value) raw = el.value.trim();
    }
    if (!raw) {
      var wrapper = document.querySelector('#page-report .flatpickr-wrapper, #page-report [class*="flatpickr"]');
      if (wrapper) {
        var inputs = wrapper.querySelectorAll('input');
        for (var i = 0; i < inputs.length; i++) if (inputs[i].value) { raw = inputs[i].value.trim(); break; }
      }
    }
    return dateToIso(raw) || raw;
  }
  function renderReport() {
    var dateFilter = '';
    if (reportMode !== 'all') {
      dateFilter = getReportDateValue();
    }
    var url = API + '/api/entries';
    if (dateFilter) url += '?date=' + encodeURIComponent(dateFilter);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        var now = new Date();
        var metaDate = now.getDate() + ' ' + THAI_MONTHS[now.getMonth()] + ' ' + (now.getFullYear() + 543) + ' ' + now.toTimeString().slice(0, 8);
        var groups = {};
        rows.forEach(function (row) {
          var key = (row.cheque_no && row.cheque_no.trim()) ? row.cheque_no.trim() : (row.account === 'โอนเงิน' ? 'โอนเงิน' : 'ไม่ระบุเช็ค');
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        });
        var groupKeys = Object.keys(groups);
        if (reportMode === 'latest' && groupKeys.length > 0) {
          var latestKey = groupKeys.reduce(function (a, b) {
            var aMax = Math.max.apply(null, groups[a].map(function (r) { return new Date(r.created_at || 0).getTime(); }));
            var bMax = Math.max.apply(null, groups[b].map(function (r) { return new Date(r.created_at || 0).getTime(); }));
            return aMax >= bMax ? a : b;
          });
          groupKeys = [latestKey];
        }
        var html = '';
        var grandTotal = 0;
        groupKeys.forEach(function (key) {
          var groupRows = groups[key];
          var groupSum = 0;
          groupRows.forEach(function (r) {
            var n = parseFloat(r.amount || r.total_amount);
            if (!isNaN(n)) groupSum += n;
          });
          grandTotal += groupSum;
          var first = groupRows[0];
          var dateStr = formatDateThai(first.date || '') || '';
          var chequeNo = (key === 'โอนเงิน' || key === 'ไม่ระบุเช็ค') ? '-' : key;
          var location = first.buyer_place || '';
          var firstWithImage = groupRows.filter(function (r) { return r.image_path; })[0];
          var n = groupRows.length;
          var sizeClass = n > 20 ? 'report-group-items-many report-group-items-very-many' : (n > 12 ? 'report-group-items-many' : (n <= 6 ? 'report-group-items-few' : 'report-group-items-medium'));
          html += '<div class="report-group ' + sizeClass + '" data-rows="' + n + '">';
          html += '<div class="report-title">สรุปรายการเช็คที่ไปรับมา</div>';
          html += '<div class="report-meta">พิมพ์เมื่อ ' + metaDate + ' | จำนวน ' + groupRows.length + ' รายการ</div>';
          html += '<div class="report-slip">';
          html += '<div class="report-slip-body">';
          html += '<div class="report-slip-row"><span class="report-slip-value">' + escapeHtml(dateStr) + '</span></div>';
          if (firstWithImage) {
            var imgClass = (key === 'โอนเงิน' || key === 'ไม่ระบุเช็ค') ? 'report-images report-images-fill' : 'report-images report-images-check';
            var imgStyle = '';
            if (imgClass.indexOf('report-images-check') >= 0) {
              if (n > 20) imgStyle = ' style="height:320px!important;min-height:320px!important"';
              else if (n >= 13) imgStyle = ' style="height:420px!important;min-height:420px!important"';
            }
            html += '<div class="' + imgClass + '"' + imgStyle + '><img src="' + (API + '/api/uploads/' + escapeHtml(firstWithImage.image_path)) + '" alt="รูปใบ slip/เช็ค"></div>';
          }
          html += '</div></div>';
          html += '<div class="report-table-header">สถานที่ : ' + escapeHtml(location) + '</div>';
          html += '<div class="report-table-header">เช็คเลขที่ : ' + escapeHtml(chequeNo) + '</div>';
          html += '<table class="report-table"><colgroup><col style="width:8%"><col style="width:38%"><col style="width:18%"><col style="width:36%"></colgroup><thead><tr>';
          html += '<th>ลำดับ</th><th>เลขที่ ใบส่งของ/ใบกำกับภาษี/ใบแจ้งหนี้</th><th>จำนวนเงิน</th><th>เล่มที่ XX/YY เลขเล่ม XXXXX กง.1</th>';
          html += '</tr></thead><tbody>';
          groupRows = sortByBookNo(groupRows);
          groupRows.forEach(function (row, i) {
            html += '<tr>';
            html += '<td>' + (i + 1) + '</td>';
            html += '<td>' + escapeHtml(row.iv_no || '') + '</td>';
            html += '<td class="amount">' + formatNumber(row.amount) + '</td>';
            html += '<td>' + escapeHtml(row.book_no || '') + '</td>';
            html += '</tr>';
          });
          html += '</tbody><tfoot><tr><td colspan="2" style="text-align:right;font-weight:600;">รวมจำนวนเงินทั้งสิ้น</td>';
          html += '<td style="font-weight:600;">' + formatNumber(groupSum) + '</td><td></td></tr></tfoot></table>';
          html += '</div>';
        });
        if (!groupKeys.length) {
          var hint = dateFilter ? ' ในวันที่เลือก (ลองกด <strong>ล้าง (แสดงทั้งหมด)</strong> เพื่อดูว่ามีข้อมูลหรือไม่)' : '';
          reportContent.innerHTML = '<p style="text-align:center;padding:24px;">ไม่มีรายการ' + hint + '</p>';
          return;
        }
        reportContent.innerHTML = html;
      })
      .catch(function () {
        reportContent.innerHTML = '<p style="color:red;">โหลดข้อมูลไม่สำเร็จ</p>';
      });
  }

  document.getElementById('btnReportLatest').addEventListener('click', function () {
    reportMode = 'latest';
    if (reportDatePicker) reportDatePicker.clear();
    renderReport();
  });
  document.getElementById('btnReportRefresh').addEventListener('click', function () {
    var dateVal = getReportDateValue();
    if (dateVal) {
      reportMode = 'date';
      renderReport();
    } else {
      reportMode = 'latest';
      renderReport();
    }
  });
  document.getElementById('btnReportClear').addEventListener('click', function () {
    reportMode = 'all';
    if (reportDatePicker) reportDatePicker.clear();
    renderReport();
  });

  var reportDatePicker = null;
  function initReportDatePickerIfNeeded() {
    if (reportDatePicker || typeof flatpickr === 'undefined') return;
    if (!document.getElementById('reportDate')) return;
    reportDatePicker = flatpickr('#reportDate', {
      locale: (flatpickr.l10ns && flatpickr.l10ns.th) ? flatpickr.l10ns.th : 'th',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'j M Y',
      formatDate: function (date) {
        return date.getDate() + ' ' + THAI_MONTHS[date.getMonth()] + ' ' + (date.getFullYear() + 543);
      },
      allowInput: false
    });
  }

  btnPrintReport.addEventListener('click', function () {
    renderReport();
    setTimeout(function () {
      window.print();
    }, 300);
  });

  var datePickerInstance = null;
  var THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  function formatDateThai(val) {
    if (!val || !val.trim()) return '';
    var m = val.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return m[3] + ' ' + THAI_MONTHS[parseInt(m[2], 10) - 1] + ' ' + (parseInt(m[1], 10) + 543);
    return val;
  }
  if (typeof flatpickr !== 'undefined') {
    datePickerInstance = flatpickr('#fDate', {
      locale: (flatpickr.l10ns && flatpickr.l10ns.th) ? flatpickr.l10ns.th : 'th',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'j M Y',
      formatDate: function (date) {
        return date.getDate() + ' ' + THAI_MONTHS[date.getMonth()] + ' ' + (date.getFullYear() + 543);
      },
      allowInput: false
    });
  }
  loadBuyerPlaceList();
  loadAccountOptions();

  function getBuyerPlaceExtraList() {
    try {
      return JSON.parse(localStorage.getItem('rabcheck_buyer_place') || '[]');
    } catch (e) { return []; }
  }

  function removeBuyerPlaceExtra(val) {
    var extra = getBuyerPlaceExtraList();
    if (extra.indexOf(val) !== -1) {
      extra = extra.filter(function (x) { return x !== val; });
      localStorage.setItem('rabcheck_buyer_place', JSON.stringify(extra));
    } else {
      var removed = getBuyerPlaceRemovedList();
      if (removed.indexOf(val) === -1) {
        removed.push(val);
        localStorage.setItem('rabcheck_buyer_place_removed', JSON.stringify(removed));
      }
    }
    loadBuyerPlaceList();
  }

  function updateBuyerPlaceExtra(oldVal, newVal) {
    if (!newVal || !newVal.trim()) return;
    var extra = getBuyerPlaceExtraList();
    if (extra.indexOf(oldVal) !== -1) {
      extra = extra.map(function (x) { return x === oldVal ? newVal.trim() : x; });
      localStorage.setItem('rabcheck_buyer_place', JSON.stringify(extra));
    } else {
      var removed = getBuyerPlaceRemovedList();
      if (removed.indexOf(oldVal) === -1) {
        removed.push(oldVal);
        localStorage.setItem('rabcheck_buyer_place_removed', JSON.stringify(removed));
      }
      saveBuyerPlaceExtra(newVal);
    }
    loadBuyerPlaceList();
  }

  function removeAccountExtra(val) {
    var list = getAccountExtraList();
    if (list.indexOf(val) !== -1) {
      list = list.filter(function (x) { return x !== val; });
      localStorage.setItem('rabcheck_account_list', JSON.stringify(list));
    } else {
      var removed = getAccountRemovedList();
      if (removed.indexOf(val) === -1) {
        removed.push(val);
        localStorage.setItem('rabcheck_account_removed', JSON.stringify(removed));
      }
    }
    loadAccountOptions();
  }

  function updateAccountExtra(oldVal, newVal) {
    if (!newVal || !newVal.trim()) return;
    if (oldVal === '__other__') {
      setAccountOtherLabel(newVal);
      loadAccountOptions();
      return;
    }
    var list = getAccountExtraList();
    if (list.indexOf(oldVal) !== -1) {
      list = list.map(function (x) { return x === oldVal ? newVal.trim() : x; });
      localStorage.setItem('rabcheck_account_list', JSON.stringify(list));
    } else {
      var removed = getAccountRemovedList();
      if (removed.indexOf(oldVal) === -1) {
        removed.push(oldVal);
        localStorage.setItem('rabcheck_account_removed', JSON.stringify(removed));
      }
      saveAccountExtra(newVal);
    }
    loadAccountOptions();
  }

  function renderListSettingsModal() {
    var bpExtra = getBuyerPlaceExtraList();
    var accExtra = getAccountExtraList();
    var bpRemoved = getBuyerPlaceRemovedList();
    var accRemoved = getAccountRemovedList();
    var bpAll = BUYER_PLACE_LIST.filter(function (v) { return bpRemoved.indexOf(v) === -1; }).concat(bpExtra);
    var otherLabel = getAccountOtherLabel();
    var accAll = ACCOUNT_PREDEFINED.filter(function (v) { return accRemoved.indexOf(v) === -1; }).concat(accExtra).concat(accRemoved.indexOf('__other__') === -1 ? ['__other__'] : []);

    function buildBuyerPlaceLi(v) {
      var actions = '<button type="button" class="btn-edit-item" data-buyer="' + escapeHtml(v) + '" title="แก้ไข">แก้ไข</button> <button type="button" class="btn-remove-item" data-buyer="' + escapeHtml(v) + '" title="ลบ" aria-label="ลบ">&times;</button>';
      return '<li class="settings-dropdown-item" data-value="' + escapeHtml(v) + '"><span class="item-text">' + escapeHtml(v) + '</span><span class="item-actions">' + actions + '</span></li>';
    }
    function buildAccountLi(v) {
      var displayText = (v === '__other__') ? otherLabel : v;
      var dataVal = (v === '__other__') ? '__other__' : v;
      var actions = '<button type="button" class="btn-edit-item" data-account="' + escapeHtml(dataVal) + '" title="แก้ไข">แก้ไข</button> <button type="button" class="btn-remove-item" data-account="' + escapeHtml(dataVal) + '" title="ลบ" aria-label="ลบ">&times;</button>';
      return '<li class="settings-dropdown-item" data-value="' + escapeHtml(dataVal) + '"><span class="item-text">' + escapeHtml(displayText) + '</span><span class="item-actions">' + actions + '</span></li>';
    }

    var listBp = document.getElementById('settingsDropdownBuyerPlaceList');
    if (listBp) {
      listBp.innerHTML = bpAll.length ? bpAll.map(buildBuyerPlaceLi).join('') : '<li class="settings-dropdown-item settings-dropdown-empty">ยังไม่มีรายการ</li>';
      listBp.querySelectorAll('.btn-remove-item[data-buyer]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = this.getAttribute('data-buyer');
          if (val && confirm('ลบรายการ "' + val + '"?')) {
            removeBuyerPlaceExtra(val);
            renderListSettingsModal();
          }
        });
      });
      listBp.querySelectorAll('.btn-edit-item[data-buyer]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = this.getAttribute('data-buyer');
          var li = this.closest('li');
          if (!li || !val) return;
          li.innerHTML = '<span class="item-edit-wrap"><input type="text" class="item-edit-input" value="' + escapeHtml(val) + '"><button type="button" class="btn-save-edit" data-buyer="' + escapeHtml(val) + '">บันทึก</button><button type="button" class="btn-cancel-edit">ยกเลิก</button></span>';
          var inp = li.querySelector('.item-edit-input');
          var saveBtn = li.querySelector('.btn-save-edit');
          var cancelBtn = li.querySelector('.btn-cancel-edit');
          inp.focus();
          saveBtn.addEventListener('click', function () {
            var newVal = inp.value.trim();
            if (newVal) {
              updateBuyerPlaceExtra(val, newVal);
              renderListSettingsModal();
            }
          });
          cancelBtn.addEventListener('click', function () { renderListSettingsModal(); });
        });
      });
    }

    var listAcc = document.getElementById('settingsDropdownAccountList');
    if (listAcc) {
      listAcc.innerHTML = accAll.length ? accAll.map(buildAccountLi).join('') : '<li class="settings-dropdown-item settings-dropdown-empty">ยังไม่มีรายการ</li>';
      listAcc.querySelectorAll('.btn-remove-item[data-account]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = this.getAttribute('data-account');
          if (!val) return;
          var label = (val === '__other__') ? otherLabel : val;
          if (confirm('ลบรายการ "' + label + '"?')) {
            removeAccountExtra(val);
            renderListSettingsModal();
          }
        });
      });
      listAcc.querySelectorAll('.btn-edit-item[data-account]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var val = this.getAttribute('data-account');
          var li = this.closest('li');
          if (!li || !val) return;
          var currentDisplay = (val === '__other__') ? otherLabel : val;
          li.innerHTML = '<span class="item-edit-wrap"><input type="text" class="item-edit-input" value="' + escapeHtml(currentDisplay) + '" data-account="' + escapeHtml(val) + '"><button type="button" class="btn-save-edit">บันทึก</button><button type="button" class="btn-cancel-edit">ยกเลิก</button></span>';
          var inp = li.querySelector('.item-edit-input');
          var saveBtn = li.querySelector('.btn-save-edit');
          var cancelBtn = li.querySelector('.btn-cancel-edit');
          inp.focus();
          saveBtn.addEventListener('click', function () {
            var newVal = inp.value.trim();
            if (newVal) {
              updateAccountExtra(val, newVal);
              renderListSettingsModal();
            }
          });
          cancelBtn.addEventListener('click', function () { renderListSettingsModal(); });
        });
      });
    }

    var restoreOtherEl = document.getElementById('settingsAccountRestoreOther');
    if (restoreOtherEl) {
      if (accRemoved.indexOf('__other__') !== -1) {
        restoreOtherEl.classList.remove('hidden');
        var btnRestore = document.getElementById('btnRestoreAccountOther');
        if (btnRestore && !btnRestore._bound) {
          btnRestore._bound = true;
          btnRestore.addEventListener('click', function () {
            var removed = getAccountRemovedList().filter(function (x) { return x !== '__other__'; });
            localStorage.setItem('rabcheck_account_removed', JSON.stringify(removed));
            loadAccountOptions();
            renderListSettingsModal();
          });
        }
      } else {
        restoreOtherEl.classList.add('hidden');
      }
    }
  }

  document.getElementById('btnOpenListSettings').addEventListener('click', function () {
    renderListSettingsModal();
    document.getElementById('listSettingsModal').classList.remove('hidden');
  });

  document.getElementById('listSettingsClose').addEventListener('click', function () {
    document.getElementById('listSettingsModal').classList.add('hidden');
  });

  document.getElementById('listSettingsModal').addEventListener('click', function (e) {
    if (e.target === document.getElementById('listSettingsModal')) document.getElementById('listSettingsModal').classList.add('hidden');
  });

  document.getElementById('btnAddBuyerPlace').addEventListener('click', function () {
    var inp = document.getElementById('settingsNewBuyerPlace');
    var val = (inp && inp.value) ? inp.value.trim() : '';
    if (!val) return;
    saveBuyerPlaceExtra(val);
    inp.value = '';
    renderListSettingsModal();
  });

  document.getElementById('btnAddAccount').addEventListener('click', function () {
    var inp = document.getElementById('settingsNewAccount');
    var val = (inp && inp.value) ? inp.value.trim() : '';
    if (!val) return;
    saveAccountExtra(val);
    inp.value = '';
    renderListSettingsModal();
  });

  /** อ่านค่าวันที่หน้ารวบรวมข้อมูล — ใช้จาก Flatpickr API หรือ parse จาก input (รองรับมือถือที่ input อาจเป็นรูปแบบไทย) */
  function getCollectDateValue() {
    if (collectDatePicker && collectDatePicker.selectedDates && collectDatePicker.selectedDates[0]) {
      var d = collectDatePicker.selectedDates[0];
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    var raw = (document.getElementById('collectDate') || {}).value || '';
    raw = String(raw).trim();
    if (!raw) return '';
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    var iso = dateToIso(raw);
    if (iso) return iso.slice(0, 10);
    return raw;
  }

  function getCollectSearchQuery() {
    var el = document.getElementById('collectSearch');
    return (el && el.value) ? String(el.value).trim().toLowerCase() : '';
  }

  function filterCollectRowsBySearch(rows) {
    var q = getCollectSearchQuery();
    if (!q) return rows;
    return rows.filter(function (row) {
      var text = [
        row.buyer_place,
        row.book_no,
        row.iv_no,
        row.cheque_no,
        row.account,
        row.cheque_source,
        row.status
      ].join(' ').toLowerCase();
      return text.indexOf(q) !== -1;
    });
  }

  function renderCollectTable(rows) {
    var filtered = filterCollectRowsBySearch(rows);
    if (!filtered.length) {
      var msg = rows.length ? 'ไม่พบรายการที่ตรงกับคำค้น' : 'ไม่มีรายการ';
      collectTableBody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:24px;color:var(--text-muted);">' + msg + '</td></tr>';
      return;
    }
    collectTableBody.innerHTML = filtered.map(function (row) {
      var amt = row.amount != null ? formatNumber(row.amount) : '-';
      var total = row.total_amount != null ? formatNumber(row.total_amount) : '-';
      return (
        '<tr>' +
        '<td class="actions"><button type="button" class="edit" data-id="' + row.id + '">แก้ไข</button></td>' +
        '<td>' + escapeHtml(formatDateThai(row.date || '') || '-') + '</td>' +
        '<td>' + escapeHtml(row.deposit_time || '-') + '</td>' +
        '<td>' + escapeHtml(row.book_no || '-') + '</td>' +
        '<td>' + escapeHtml(row.iv_no || '-') + '</td>' +
        '<td>' + escapeHtml(row.cheque_no || '-') + '</td>' +
        '<td>' + escapeHtml(row.account || '-') + '</td>' +
        '<td class="amount">' + amt + '</td>' +
        '<td class="amount">' + total + '</td>' +
        '<td>' + escapeHtml(row.buyer_place || '-') + '</td>' +
        '<td>' + escapeHtml(row.cheque_source || '-') + '</td>' +
        '<td>' + escapeHtml(row.status || '-') + '</td>' +
        '</tr>'
      );
    }).join('');
    collectTableBody.querySelectorAll('button.edit').forEach(function (btn) {
      btn.addEventListener('click', function () {
        openEdit(parseInt(this.getAttribute('data-id'), 10));
      });
    });
  }

  function loadCollect() {
    var dateFilter = getCollectDateValue();
    var url = API + '/api/entries';
    if (dateFilter) url += '?date=' + encodeURIComponent(dateFilter);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        lastCollectRows = sortByDate(sortByBookNo(rows), getDateSortOrder());
        renderCollectTable(lastCollectRows);
      })
      .catch(function () {
        collectTableBody.innerHTML = '<tr><td colspan="12" style="text-align:center;padding:24px;color:red;">โหลดข้อมูลไม่สำเร็จ</td></tr>';
      });
  }

  document.getElementById('btnCollectRefresh').addEventListener('click', loadCollect);

  if (document.getElementById('collectSearch')) {
    document.getElementById('collectSearch').addEventListener('input', function () {
      if (lastCollectRows.length) renderCollectTable(lastCollectRows);
    });
  }

  function getCollectData() {
    return new Promise(function (resolve) {
      var dateFilter = getCollectDateValue();
      var url = API + '/api/entries';
      if (dateFilter) url += '?date=' + encodeURIComponent(dateFilter);
      fetch(url)
        .then(function (r) { return r.json(); })
        .then(function (rows) {
          resolve(sortByDate(sortByBookNo(rows), getDateSortOrder()));
        })
        .catch(function () { resolve([]); });
    });
  }

  document.getElementById('btnExportCsv').addEventListener('click', function () {
    getCollectData().then(function (rows) {
      if (!rows.length) { alert('ไม่มีข้อมูลที่จะส่งออก'); return; }
      var headers = ['วัน/เดือน/ปี', 'เวลานำฝาก', 'เล่มที่/เลขที่', 'เลขที่ IV', 'เช็คเลขที่', 'เข้าบัญชี', 'จำนวนเงิน', 'รวมจำนวนเงิน', 'ชื่อผู้ซื้อ/สถานที่', 'ที่มาเช็ค', 'สถานะ'];
      var csv = headers.join(',') + '\n';
      rows.forEach(function (row) {
        var d = formatDateThai(row.date || '') || '';
        var r = [d, row.deposit_time || '', row.book_no || '', row.iv_no || '', row.cheque_no || '', row.account || '', row.amount || '', row.total_amount || '', (row.buyer_place || '').replace(/"/g, '""'), row.cheque_source || '', row.status || ''];
        csv += r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',') + '\n';
      });
      var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'rabcheck_' + new Date().toISOString().slice(0, 10) + '.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  });

  document.getElementById('btnSheetConfig').addEventListener('click', function () {
    document.getElementById('sheetWebAppUrl').value = localStorage.getItem('rabcheck_sheet_url') || '';
    document.getElementById('sheetConfigModal').classList.remove('hidden');
  });
  document.getElementById('btnSendToSheet').addEventListener('click', function () {
    var url = localStorage.getItem('rabcheck_sheet_url') || '';
    if (!url.trim()) {
      document.getElementById('sheetWebAppUrl').value = localStorage.getItem('rabcheck_sheet_url') || '';
      document.getElementById('sheetConfigModal').classList.remove('hidden');
      return;
    }
    sendToGoogleSheet(url);
  });

  document.getElementById('sheetConfigClose').addEventListener('click', function () {
    document.getElementById('sheetConfigModal').classList.add('hidden');
  });
  document.getElementById('btnSaveSheetUrl').addEventListener('click', function () {
    var url = (document.getElementById('sheetWebAppUrl').value || '').trim();
    if (!url) { alert('กรุณาใส่ URL'); return; }
    localStorage.setItem('rabcheck_sheet_url', url);
    document.getElementById('sheetConfigModal').classList.add('hidden');
    sendToGoogleSheet(url);
  });

  function sendToGoogleSheet(webAppUrl) {
    getCollectData().then(function (rows) {
      if (!rows.length) { alert('ไม่มีข้อมูลที่จะส่ง'); return; }
      var data = rows.map(function (row) {
        return {
          date: formatDateThai(row.date || '') || row.date || '',
          deposit_time: row.deposit_time || '',
          book_no: row.book_no || '',
          iv_no: row.iv_no || '',
          cheque_no: row.cheque_no || '',
          account: row.account || '',
          amount: row.amount,
          total_amount: row.total_amount,
          buyer_place: row.buyer_place || '',
          cheque_source: row.cheque_source || '',
          status: row.status || ''
        };
      });
      fetch(API + '/api/send-to-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webAppUrl, rows: data })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.error) alert('ส่งไม่สำเร็จ: ' + res.error);
          else alert('ส่งข้อมูลเรียบร้อย ตรวจสอบที่ Google Sheet');
        })
        .catch(function () { alert('ส่งไม่สำเร็จ กรุณาตรวจสอบการเชื่อมต่อและคู่มือ'); });
    });
  }

  var collectDatePicker = null;
  document.getElementById('btnCollectClear').addEventListener('click', function () {
    if (collectDatePicker) collectDatePicker.clear();
    document.getElementById('collectDate').value = '';
    loadCollect();
  });

  if (typeof flatpickr !== 'undefined') {
    collectDatePicker = flatpickr('#collectDate', {
      locale: (flatpickr.l10ns && flatpickr.l10ns.th) ? flatpickr.l10ns.th : 'th',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'j M Y',
      formatDate: function (date) {
        return date.getDate() + ' ' + THAI_MONTHS[date.getMonth()] + ' ' + (date.getFullYear() + 543);
      },
      allowInput: false,
      onChange: function () {
        setTimeout(function () { loadCollect(); }, 80);
      }
    });
  }

  if (typeof flatpickr !== 'undefined' && document.getElementById('listDateFilter')) {
    listDatePicker = flatpickr('#listDateFilter', {
      locale: (flatpickr.l10ns && flatpickr.l10ns.th) ? flatpickr.l10ns.th : 'th',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'j M Y',
      formatDate: function (date) {
        return date.getDate() + ' ' + THAI_MONTHS[date.getMonth()] + ' ' + (date.getFullYear() + 543);
      },
      allowInput: false,
      onChange: function () {
        loadEntries();
      }
    });
  }

  var btnListClearDate = document.getElementById('btnListClearDate');
  if (btnListClearDate) {
    btnListClearDate.addEventListener('click', function () {
      if (listDatePicker) listDatePicker.clear();
      loadEntries();
    });
  }
  function updateDateSortButtonLabels() {
    var order = getDateSortOrder();
    var listBtn = document.getElementById('btnListDateSort');
    var collectBtn = document.getElementById('btnCollectDateSort');
    var text = order === 'asc' ? 'เรียง: เก่า → ใหม่' : 'เรียง: ใหม่ → เก่า';
    if (listBtn) listBtn.textContent = text;
    if (collectBtn) collectBtn.textContent = text;
  }
  var btnListDateSort = document.getElementById('btnListDateSort');
  if (btnListDateSort) {
    btnListDateSort.addEventListener('click', function () {
      toggleDateSortOrder();
      if (lastListRows.length) {
        lastListRows = sortByDate(lastListRows, getDateSortOrder());
        renderEntriesTable(lastListRows);
      }
      updateDateSortButtonLabels();
    });
  }
  var btnCollectDateSort = document.getElementById('btnCollectDateSort');
  if (btnCollectDateSort) {
    btnCollectDateSort.addEventListener('click', function () {
      toggleDateSortOrder();
      loadCollect();
      updateDateSortButtonLabels();
    });
  }
  updateDateSortButtonLabels();

  loadEntries();
  loadUploadSummaryPlaces();
  loadUploadAccountReference();
})();
