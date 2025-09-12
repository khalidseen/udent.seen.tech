@echo off
chcp 65001 >nul
REM Stop Udent System
REM -----------------------------------

cd /d %~dp0

ECHO =============================
ECHO  🛑 Stopping Udent Dental System
ECHO =============================
ECHO.

ECHO Stopping all Node.js processes...
taskkill /IM node.exe /F >nul 2>&1

ECHO Stopping development server...
taskkill /F /FI "WINDOWTITLE eq Udent Dev Server*" >nul 2>&1

ECHO Stopping processes on ports...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8082') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1

ECHO.
ECHO =============================
ECHO System stopped successfully!
ECHO =============================
pause
