@echo off
chcp 65001 >nul
REM Udent System Control Script
REM -----------------------------------
REM Usage:
REM   Double-click to start, restart, or stop the Udent app
REM -----------------------------------

SETLOCAL ENABLEDELAYEDEXPANSION

REM Change directory to project root
cd /d %~dp0

REM Main menu
:MENU
cls
ECHO =============================
ECHO 🦷 Udent System Control
ECHO =============================
ECHO 1. Start Application 🚀
ECHO 2. Restart Application 🔄
ECHO 3. Stop Application 🛑
ECHO 4. Update Dependencies 📦
ECHO 5. Build Application 🏗️
ECHO 6. Run Tests 🧪
ECHO 7. Open Browser 🌐
ECHO 8. Clear Cache 🧹
ECHO 9. Show Running Processes 📊
ECHO 10. Exit ❌
ECHO.
ECHO Quick Files:
ECHO - start_udent.bat : Quick Start
ECHO - stop_udent.bat : Quick Stop
ECHO - update_udent.bat : Full Update
ECHO =============================
set /p choice=Select an option (1-10): 

if "%choice%"=="1" goto START
if "%choice%"=="2" goto RESTART
if "%choice%"=="3" goto STOP
if "%choice%"=="4" goto INSTALL
if "%choice%"=="5" goto BUILD
if "%choice%"=="6" goto TEST
if "%choice%"=="7" goto BROWSER
if "%choice%"=="8" goto CLEAN
if "%choice%"=="9" goto STATUS
if "%choice%"=="10" exit

REM Start Application
:START
ECHO Starting Udent application...
start "Udent Dev Server" cmd /k "npm run dev"
ECHO Application started.
pause
goto MENU

REM Restart Application
:RESTART
ECHO Restarting Udent application...
taskkill /IM node.exe /F >nul 2>&1
start "Udent Dev Server" cmd /k "npm run dev"
ECHO Application restarted.
pause
goto MENU

REM Stop Application
:STOP
ECHO Stopping Udent application...
taskkill /IM node.exe /F >nul 2>&1
ECHO Application stopped.
pause
goto MENU

REM Update Dependencies
:INSTALL
ECHO Updating dependencies...
npm install
ECHO Dependencies updated.
pause
goto MENU

REM Build Application
:BUILD
ECHO Building application...
npm run build
ECHO Build complete.
pause
goto MENU

REM Run Tests
:TEST
ECHO Running tests...
npm test
ECHO Tests finished.
pause
goto MENU

REM Open Browser
:BROWSER
ECHO Opening application in browser...
start http://localhost:8082
start http://localhost:5173
start http://localhost:3000
ECHO Browser opened.
pause
goto MENU

REM Clear Cache
:CLEAN
ECHO Clearing cache and temporary files...
rmdir /s /q node_modules 2>nul
rmdir /s /q dist 2>nul
rmdir /s /q build 2>nul
del package-lock.json 2>nul
npm cache clean --force
ECHO Cache cleared.
pause
goto MENU

REM Show Running Processes
:STATUS
ECHO Displaying running processes...
ECHO =============================
tasklist | findstr node.exe
ECHO =============================
netstat -an | findstr :8082
netstat -an | findstr :5173
netstat -an | findstr :3000
ECHO =============================
pause
goto MENU
