@echo off
chcp 65001 >nul
setlocal Enabledelayedexpansion
title فوردنتست - لوحة التحكم
cd /d "%~dp0"

:MENU
cls
echo.
echo =============================
echo   فوردنتست - لوحة التحكم
echo =============================
echo.
echo   تشغيل وإيقاف:
echo   1. تشغيل التطبيق محلياً
echo   2. إيقاف التطبيق
echo   3. إعادة تشغيل التطبيق
echo.
echo   صيانة وتحديث:
echo   4. تثبيت/تحديث التبعيات
echo   5. بناء التطبيق للإنتاج
echo   6. تشغيل الاختبارات
echo   7. فحص النظام (Node، المنافذ، Lint)
echo.
echo   مساعدة:
echo   8. فتح التطبيق في المتصفح
echo   9. مسح الكاش وإعادة تثبيت التبعيات
echo  10. عرض العمليات والمنافذ
echo  11. تعليمات إصلاح Service Worker
echo.
echo   0. خروج
echo =============================
echo.
set /p choice=اختر رقم (0-11): 

if "%choice%"=="1" goto RUN
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto RESTART
if "%choice%"=="4" goto INSTALL
if "%choice%"=="5" goto BUILD
if "%choice%"=="6" goto TEST
if "%choice%"=="7" goto CHECK
if "%choice%"=="8" goto BROWSER
if "%choice%"=="9" goto CLEAN
if "%choice%"=="10" goto STATUS
if "%choice%"=="11" goto FIXSW
if "%choice%"=="0" exit
goto MENU

:RUN
echo.
echo تشغيل التطبيق...
taskkill /IM node.exe /F >nul 2>&1
timeout /t 2 /nobreak >nul
start "Udent Dev Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:8080
echo تم تشغيل التطبيق على http://localhost:8080
pause
goto MENU

:STOP
echo.
echo إيقاف التطبيق...
call "%~dp0stop.bat"
goto MENU

:RESTART
echo.
echo إعادة تشغيل التطبيق...
taskkill /IM node.exe /F >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Udent Dev Server*" >nul 2>&1
timeout /t 2 /nobreak >nul
start "Udent Dev Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
start http://localhost:8080
echo تم إعادة التشغيل.
pause
goto MENU

:INSTALL
echo.
echo تثبيت/تحديث التبعيات...
npm install
npm update
echo تم التحديث.
pause
goto MENU

:BUILD
echo.
echo بناء التطبيق...
npm run build
echo انتهى البناء.
pause
goto MENU

:TEST
echo.
echo تشغيل الاختبارات...
npm run test:run 2>nul || npm test 2>nul
echo انتهت الاختبارات.
pause
goto MENU

:CHECK
echo.
echo فحص النظام...
echo Node: & node --version
echo npm:  & npm --version
if not exist "node_modules" (echo تحذير: مجلد node_modules غير موجود. نفّذ الخيار 4 أولاً.) else (echo التبعيات: موجودة.)
echo.
echo حالة المنافذ:
netstat -an | findstr ":8080 :5173 :3000" 2>nul || echo لا استخدام للمنافذ حالياً.
echo.
echo فحص Lint...
npm run lint 2>nul || echo (Lint غير متوفر أو به أخطاء)
echo.
pause
goto MENU

:BROWSER
echo.
echo فتح المتصفح...
start http://localhost:8080
start http://localhost:5173
echo تم فتح المتصفح.
pause
goto MENU

:CLEAN
echo.
echo تحذير: سيتم حذف node_modules و dist و package-lock.json
set /p confirm=متابعة؟ (y/n): 
if /i not "!confirm!"=="y" goto MENU
rmdir /s /q node_modules 2>nul
rmdir /s /q dist 2>nul
del package-lock.json 2>nul
npm cache clean --force
echo تم المسح. نفّذ الخيار 4 لتثبيت التبعيات من جديد.
pause
goto MENU

:STATUS
echo.
echo عمليات Node:
tasklist | findstr node.exe
echo.
echo المنافذ 8080, 5173, 3000:
netstat -an | findstr ":8080 :5173 :3000"
echo.
pause
goto MENU

:FIXSW
echo.
echo ===== تعليمات إصلاح Service Worker =====
echo.
echo 1. افتح المتصفح واضغط F12
echo 2. في Console نفّذ:
echo    navigator.serviceWorker.getRegistrations().then(r =^> r.forEach(reg =^> reg.unregister()))
echo 3. ثم:
echo    caches.keys().then(k =^> k.forEach(c =^> caches.delete(c)))
echo 4. حدّث الصفحة بـ Ctrl+Shift+R
echo.
echo أو افتح: http://localhost:8080/unregister-sw.html
echo إن وُجدت الصفحة ستلغي التسجيل تلقائياً.
echo ========================================
echo.
pause
goto MENU
