@echo off
cd /d "%~dp0"
echo Starting RabCheck server at http://localhost:5000
echo.
echo To open on mobile: Use same WiFi, run ipconfig to find IP, open http://[YOUR_IP]:5000
echo.
py -3.12 backend\app.py 2>nul
if errorlevel 1 py -3.11 backend\app.py 2>nul
if errorlevel 1 python backend\app.py
if errorlevel 1 (
  echo.
  echo ERROR: Python not found. Please install from https://www.python.org/downloads/
  echo Recommend Python 3.12 for OCR. When installing, check Add python.exe to PATH
  echo.
  pause
)
