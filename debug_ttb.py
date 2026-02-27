# -*- coding: utf-8 -*-
import sys, os
sys.path.insert(0, '.')
from backend.ocr_helper import run_ocr

# เช็ค ttb 4,500 บาท เลข 88006400
uploads = ['3f21667f4549489db1d795622fab29ff.jpg', '47e376f68125420ab006c8bd84bc533f.jpg', 
           '5335fda481e5431481e59c2696176b3a.jpg', '992ed2371d3d45d5baaf9fda5833c3bd.jpg', 'a1c61ae3f2cf4eba92a786531b49cb03.jpg']
for f in uploads:
    p = os.path.join('uploads', f)
    if os.path.isfile(p):
        r = run_ocr(p)
        fn = r.get('fields', {})
        amt = fn.get('amount')
        cn = fn.get('cheque_no')
        if amt == 4500.0 or cn in ('88006400', '68006400') or (amt and amt < 10000):
            with open('debug_out.txt', 'w', encoding='utf-8') as out:
                out.write('File: %s\n' % f)
                out.write('amount: %s\ncheque_no: %s\n' % (amt, cn))
                out.write('raw_bottom (first 500):\n%s\n' % (r.get('raw_bottom', '')[:500]))
                out.write('raw (last 800):\n%s\n' % (r.get('raw', '')[-800:]))
            print('Found:', f, 'amt=', amt, 'cheque_no=', cn)
            break
else:
    with open('debug_out.txt', 'w', encoding='utf-8') as out:
        out.write('No matching image found\n')
