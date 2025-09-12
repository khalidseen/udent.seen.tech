@echo off
chcp 65001 >nul
REM Udent Quick Start
REM -----------------------------------

cd /d %~dp0

ECHO =============================
ECHO  🦷 Starting Udent Dental System
ECHO =============================
ECHO.

ECHO Stopping previous processes...
taskkill /IM node.exe /F >nul 2>&1

ECHO Starting server...
start "Udent Dev Server" cmd /k "npm run dev"

ECHO Waiting for server to load...
timeout /t 5 /nobreak >nul

ECHO Opening browser...
start http://localhost:8082

ECHO.
ECHO =============================
ECHO System started successfully!
ECHO You can access the app at:
ECHO http://localhost:8082
ECHO =============================
pause
