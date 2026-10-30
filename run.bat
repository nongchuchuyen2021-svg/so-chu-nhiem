@echo off
chcp 65001 >nul
echo ========================================================
echo   KHỞI ĐỘNG SỔ CHỦ NHIỆM ĐIỆN TỬ THPT
echo   Chuẩn Thông tư 15/2026/TT-BGDĐT & Thông tư 22
echo ========================================================
echo.
cd /d "%~dp0backend"
echo [1/2] Đang kiểm tra cơ sở dữ liệu...
.venv\Scripts\python.exe -m app.db.seed

echo.
echo [2/2] Đang mở ứng dụng trên cổng 8000...
echo Truy cập trình duyệt: http://127.0.0.1:8000
echo.
echo Tài khoản trải nghiệm:
echo   - GVCN: gvcn / Demo@12345
echo   - Cán bộ lớp: canbo / Demo@12345
echo.
start http://127.0.0.1:8000
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
pause

