@echo off
echo ============================================
echo   LUMIERE FERRE - Cai dat lan dau
echo ============================================
echo.

echo [1/2] Cai dat Backend...
cd /d "%~dp0backend"
call npm install
if errorlevel 1 (echo LOI: Backend install that bai! & pause & exit /b 1)
echo Backend OK!
echo.

echo [2/2] Cai dat Frontend...
cd /d "%~dp0frontend"
call npm install
if errorlevel 1 (echo LOI: Frontend install that bai! & pause & exit /b 1)
echo Frontend OK!
echo.

echo ============================================
echo   Cai dat hoan thanh! Chay: start.bat
echo ============================================
pause
