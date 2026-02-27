@echo off
cd /d "%~dp0"
echo.
echo RabCheck - กำลังเริ่มเซิร์ฟเวอร์...
echo เบราว์เซอร์จะเปิดอัตโนมัติภายใน 2-3 วินาที
echo.
echo ใช้ Offline ได้ครบ - ส่งไป Google Sheet ได้เมื่อเชื่อมเน็ต
echo ปิดหน้าต่างนี้เมื่อใช้งานเสร็จ
echo.
start /b cmd /c "ping 127.0.0.1 -n 3 > nul && start http://127.0.0.1:5000/"
py -3.12 backend\app.py 2>nul
if errorlevel 1 py -3.11 backend\app.py 2>nul
if errorlevel 1 python backend\app.py
if errorlevel 1 (
  echo.
  echo ERROR: ไม่พบ Python กรุณาติดตั้งจาก https://www.python.org/downloads/
  echo.
  pause
)
