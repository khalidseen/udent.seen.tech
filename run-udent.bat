@echo off
echo ======================================================
echo           تشغيل تطبيق UDent
echo ======================================================
echo.

:: الانتقال إلى مجلد المشروع
cd /d "%~dp0"
echo المجلد الحالي: %CD%
echo.

:: التحقق من وجود Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo خطأ: Node.js غير مثبت على جهازك
    echo الرجاء تثبيت Node.js من https://nodejs.org/
    pause
    exit /b 1
)

:: التحقق من وجود Bun
bun --version >nul 2>&1
if errorlevel 0 (
    echo تم العثور على Bun! سيتم استخدامه لتشغيل التطبيق...
    echo.
    echo جاري تشغيل التطبيق باستخدام Bun...
    echo.
    echo للخروج من التطبيق، اضغط Ctrl+C
    echo.
    bun run dev
) else (
    echo لم يتم العثور على Bun، سيتم استخدام NPM بدلاً من ذلك...
    echo.
    :: التحقق من تثبيت الحزم
    if not exist "node_modules" (
        echo لم يتم العثور على المكتبات اللازمة. جاري تثبيتها...
        npm install
    )
    
    echo جاري تشغيل التطبيق باستخدام NPM...
    echo.
    echo للخروج من التطبيق، اضغط Ctrl+C
    echo.
    npm run dev
)

pause
