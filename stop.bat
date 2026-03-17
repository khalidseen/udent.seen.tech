@echo off
chcp 65001 >nul
title فوردنتست - إيقاف التشغيل
cd /d "%~dp0"

echo.
echo =============================
echo   إيقاف نظام العيادة
echo =============================
echo.

echo إيقاف عمليات Node...
taskkill /IM node.exe /F >nul 2>&1

echo إيقاف نافذة خادم التطوير...
taskkill /F /FI "WINDOWTITLE eq Udent Dev Server*" >nul 2>&1

echo تحرير المنافذ...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8082') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1

echo.
echo =============================
echo   تم إيقاف التشغيل بنجاح
echo =============================
echo.
pause
