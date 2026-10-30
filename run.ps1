Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  KHỞI ĐỘNG SỔ CHỦ NHIỆM ĐIỆN TỬ THPT" -ForegroundColor Green
Write-Host "  Chuẩn Thông tư 15/2026/TT-BGDĐT & Thông tư 22" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\backend"
Write-Host "`n[1/2] Đang kiểm tra dữ liệu mẫu..." -ForegroundColor Gray
& ".\.venv\Scripts\python.exe" -m app.db.seed

Write-Host "`n[2/2] Đang khởi chạy máy chủ tại http://127.0.0.1:8000 ..." -ForegroundColor Green
Write-Host "Tài khoản trải nghiệm:" -ForegroundColor Cyan
Write-Host "  - GVCN: gvcn / Demo@12345" -ForegroundColor Yellow
Write-Host "  - Cán bộ lớp: canbo / Demo@12345" -ForegroundColor Yellow

Start-Process "http://127.0.0.1:8000"
& ".\.venv\Scripts\python.exe" -m uvicorn app.main:app --host 127.0.0.1 --port 8000

