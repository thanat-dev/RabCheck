@echo off
chcp 65001 >nul
title ngrok - RabCheck

REM เปลี่ยน path นี้ให้ชี้ไปที่โฟลเดอร์ที่มีไฟล์ ngrok.exe (ถ้าไม่ใช่โฟลเดอร์ Downloads)
set "NGROK_DIR=%USERPROFILE%\Downloads"
cd /d "%NGROK_DIR%"

if not exist "ngrok.exe" (
    echo ไม่พบไฟล์ ngrok.exe ในโฟลเดอร์: %NGROK_DIR%
    echo.
    echo กรุณาแก้ไข path ในไฟล์ run_ngrok.bat บรรทัด set NGROK_DIR
    echo เช่น ถ้า ngrok อยู่ในโฟลเดอร์ย่อย: set "NGROK_DIR=%%USERPROFILE%%\Downloads\ngrok-v3"
    echo.
    pause
    exit /b 1
)

echo กำลังตั้งค่า authtoken...
ngrok config add-authtoken 2ZF2Oio8cOTZqrXKtLKjNeKXJHq_3s7cNuQ68HVudMjEUyQf8
echo.
echo กำลังเปิด tunnel (ngrok http 5000)...
echo เปิด URL ที่แสดงด้านล่างบนมือถือเพื่อเข้าใช้งาน
echo ปิดหน้าต่างนี้เมื่อไม่ใช้งาน
echo.
ngrok http 5000
