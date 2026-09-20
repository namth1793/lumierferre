@echo off
echo ============================================
echo   LUMIE FERRE - Khoi dong
echo ============================================
echo.
echo Backend : http://localhost:5033
echo Frontend: http://localhost:5174
echo.

start "LF Backend" cmd /k "cd /d "%~dp0backend" && node server.js"
timeout /t 2 /nobreak >nul
start "LF Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Dang khoi dong... Mo trinh duyet sau 3 giay.
timeout /t 3 /nobreak >nul
start http://localhost:5174
