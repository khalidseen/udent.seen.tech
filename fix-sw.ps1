#!/usr/bin/env pwsh
# Fix Service Worker Dev Server Issues
# This script helps resolve Service Worker interference with Vite HMR

Write-Host "🔧 Udent - Service Worker Fix Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$devServerUrl = "http://localhost:8084"
$unregisterPage = "$devServerUrl/unregister-sw.html"

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        $connection = New-Object System.Net.Sockets.TcpClient("localhost", $Port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

# Step 1: Instructions
Write-Host "📋 خطوات الإصلاح:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  تم تعطيل Service Worker في بيئة التطوير (main.tsx)" -ForegroundColor Green
Write-Host "2️⃣  تم تحديث sw.js لتجاهل ملفات Vite" -ForegroundColor Green
Write-Host "3️⃣  جاري التحقق من خادم التطوير..." -ForegroundColor Yellow
Write-Host ""

# Step 2: Check if dev server is running
if (Test-Port -Port 8084) {
    Write-Host "✅ خادم التطوير يعمل على المنفذ 8084" -ForegroundColor Green
    Write-Host ""
    Write-Host "📍 افتح الرابط التالي لإلغاء تسجيل Service Worker:" -ForegroundColor Cyan
    Write-Host "   $unregisterPage" -ForegroundColor White
    Write-Host ""
    
    $openBrowser = Read-Host "هل تريد فتح الصفحة الآن؟ (y/n)"
    if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y' -or $openBrowser -eq 'yes') {
        Start-Process $unregisterPage
        Write-Host "✅ تم فتح الصفحة في المتصفح" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  خادم التطوير غير مشغل" -ForegroundColor Yellow
    Write-Host ""
    
    $startServer = Read-Host "هل تريد تشغيل خادم التطوير الآن؟ (y/n)"
    if ($startServer -eq 'y' -or $startServer -eq 'Y' -or $startServer -eq 'yes') {
        Write-Host ""
        Write-Host "🚀 جاري تشغيل خادم التطوير..." -ForegroundColor Cyan
        Write-Host ""
        
        # Start dev server in new window
        Start-Process pwsh -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"
        
        Write-Host "✅ تم تشغيل خادم التطوير في نافذة جديدة" -ForegroundColor Green
        Write-Host ""
        Write-Host "⏳ انتظر 5 ثوانٍ ثم افتح:" -ForegroundColor Yellow
        Write-Host "   $unregisterPage" -ForegroundColor White
        Write-Host ""
        
        Start-Sleep -Seconds 5
        Start-Process $unregisterPage
    }
}

Write-Host ""
Write-Host "📖 تعليمات إضافية:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "إذا استمرت المشكلة، قم بالتالي يدوياً:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. افتح DevTools (F12)" -ForegroundColor White
Write-Host "2. اذهب إلى: Application > Service Workers" -ForegroundColor White
Write-Host "3. اضغط على 'Unregister' لكل service worker" -ForegroundColor White
Write-Host "4. اذهب إلى: Application > Cache Storage" -ForegroundColor White
Write-Host "5. احذف جميع الـ caches (زر الفأرة الأيمن > Delete)" -ForegroundColor White
Write-Host "6. أغلق جميع علامات التبويب للتطبيق" -ForegroundColor White
Write-Host "7. أعد تشغيل خادم التطوير: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✨ بعد الإصلاح، Service Worker سيعمل فقط في الإنتاج (PROD)" -ForegroundColor Green
Write-Host ""

Read-Host "اضغط Enter للإنهاء"
