@echo off
chcp 65001 >nul
title فوردنتست - تشغيل محلي
cd /d "%~dp0"

echo.
echo =============================
echo   تشغيل نظام العيادة محلياً
echo =============================
echo.

REM التأكد من وجود Node و npm
where node >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Node.js غير مثبت أو غير موجود في PATH.
    echo ثبّت Node.js من https://nodejs.org ثم أعد تشغيل الملف.
    pause
    exit /b 1
)
where npm >nul 2>&1
if errorlevel 1 (
    echo [خطأ] npm غير موجود. تأكد من تثبيت Node.js بشكل صحيح.
    pause
    exit /b 1
)

REM إذا لم تكن التبعيات مثبتة (vite غير موجود) نثبتها تلقائياً
if not exist "node_modules\.bin\vite.cmd" (
    if not exist "node_modules\.bin\vite" (
        echo التبعيات غير مثبتة. جاري تثبيتها الآن...
        echo.
        call npm install
        if errorlevel 1 (
            echo [خطأ] فشل تثبيت التبعيات. نفّذ يدوياً: npm install
            pause
            exit /b 1
        )
        echo.
        echo تم تثبيت التبعيات بنجاح.
        echo.
    )
)

REM إيقاف أي عملية تستخدم المنفذ 8080 فقط (بدون قتل كل Node)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo تشغيل الخادم في نافذة جديدة...
echo إذا ظهرت أخطاء ستظهر هناك.
echo.
start "Udent Dev Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo انتظار استعداد الخادم (حتى 45 ثانية)...
set /a count=0
:wait_loop
timeout /t 3 /nobreak >nul
netstat -an | findstr ":8080.*LISTENING" >nul 2>&1
if not errorlevel 1 goto server_ready
set /a count+=3
if %count% geq 45 goto open_anyway
echo   لا يزال الخادم يبدأ... (%count% ث)
goto wait_loop

:server_ready
echo   الخادم جاهز.
goto open_browser

:open_anyway
echo   فتح المتصفح. إن لم يعمل الموقع انتظر قليلاً ثم حدّث الصفحة.

:open_browser
timeout /t 2 /nobreak >nul
start http://localhost:8080

echo.
echo =============================
echo   التطبيق: http://localhost:8080
echo   للإيقاف: شغّل stop.bat أو أغلق نافذة "Udent Dev Server"
echo =============================
echo.
pause
