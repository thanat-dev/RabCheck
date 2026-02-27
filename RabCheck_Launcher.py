# -*- coding: utf-8 -*-
"""
RabCheck Launcher - เปิดเซิร์ฟเวอร์และเบราว์เซอร์อัตโนมัติ
ใช้สำหรับสร้าง Shortcut ให้กดเข้าใช้งานได้ทันที
"""
import os
import sys
import time
import subprocess
import webbrowser

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)

def main():
    # ใช้ Python เวอร์ชันที่ติดตั้ง (pythonw = ไม่แสดงหน้าต่าง console)
    py_cmd = None
    for cmd in [['pythonw'], ['py', '-3.12'], ['py', '-3.11'], ['py', '-3'], ['python']]:
        try:
            r = subprocess.run(cmd + ['-c', 'print(1)'], capture_output=True, cwd=BASE)
            if r.returncode == 0:
                py_cmd = cmd
                break
        except Exception:
            pass
    if not py_cmd:
        input('ไม่พบ Python กรุณาติดตั้งจาก https://www.python.org/downloads/ แล้วลองใหม่\nกด Enter เพื่อปิด...')
        return

    # รัน backend แล้วเปิดเบราว์เซอร์หลัง 2 วินาที
    backend_script = os.path.join(BASE, 'backend', 'app.py')
    proc = subprocess.Popen(py_cmd + [backend_script], cwd=BASE)
    time.sleep(2)
    webbrowser.open('http://127.0.0.1:5000/')
    proc.wait()

if __name__ == '__main__':
    main()
