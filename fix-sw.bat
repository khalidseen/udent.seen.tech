@echo off
chcp 65001 >nul
title إصلاح Service Worker - UDent System
color 0B

echo.
echo ════════════════════════════════════════════════════════════
echo            🔧 إصلاح مشكلة Service Worker 🔧
echo ════════════════════════════════════════════════════════════
echo.
echo 📋 الخطوات:
echo.
echo 1️⃣  افتح المتصفح واضغط F12
echo.
echo 2️⃣  اكتب في Console:
echo     navigator.serviceWorker.getRegistrations().then(r =^> r.forEach(reg =^> reg.unregister()))
echo.
echo 3️⃣  ثم اكتب:
echo     caches.keys().then(k =^> k.forEach(c =^> caches.delete(c)))
echo.
echo 4️⃣  اعمل Refresh بـ Ctrl+Shift+R
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo ✅ أو افتح الرابط التالي في المتصفح:
echo    http://localhost:8082/unregister-sw.html
echo.
echo    👉 الصفحة ستقوم بإلغاء التسجيل تلقائياً
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause
