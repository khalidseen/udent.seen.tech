/**
 * اختبارات شاملة لتدفق المريض
 * Patient Flow E2E Tests
 * 
 * اختبار رحلة المريض الكاملة من التسجيل حتى الدفع
 */

import { test, expect } from '@playwright/test';

test.describe('Patient Flow - Complete Journey', () => {
  // ====================================================================
  // Setup & Teardown
  // ====================================================================
  
  test.beforeEach(async ({ page }) => {
    // الانتقال للصفحة الرئيسية
    await page.goto('/');
    
    // تسجيل الدخول (إذا لم يكن مسجلاً)
    const isLoggedIn = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    
    if (!isLoggedIn) {
      // الانتقال لصفحة تسجيل الدخول
      await page.goto('/login');
      
      // ملء النموذج
      await page.fill('input[name="email"]', 'test@clinic.com');
      await page.fill('input[name="password"]', 'test123456');
      
      // النقر على زر تسجيل الدخول
      await page.click('button[type="submit"]');
      
      // انتظار حتى يتم التحميل
      await page.waitForURL('/', { timeout: 5000 });
    }
  });

  // ====================================================================
  // Test 1: إضافة مريض جديد
  // ====================================================================
  
  test('should add a new patient successfully', async ({ page }) => {
    // الانتقال لصفحة المرضى
    await page.goto('/patients');
    
    // النقر على زر "إضافة مريض"
    await page.click('button:has-text("إضافة مريض"), button:has-text("Add Patient")');
    
    // ملء بيانات المريض
    await page.fill('input[name="name"]', 'أحمد محمد السعيد');
    await page.fill('input[name="phone"]', '0501234567');
    await page.fill('input[name="email"]', 'ahmed.test@example.com');
    await page.fill('input[name="national_id"]', '1012345678');
    
    // اختيار تاريخ الميلاد
    await page.fill('input[name="date_of_birth"]', '1990-01-01');
    
    // اختيار الجنس
    await page.selectOption('select[name="gender"]', 'male');
    
    // حفظ المريض
    await page.click('button[type="submit"]:has-text("حفظ"), button[type="submit"]:has-text("Save")');
    
    // التحقق من ظهور رسالة النجاح
    await expect(page.locator('text=/تم إضافة المريض|Patient added successfully/i')).toBeVisible({ timeout: 5000 });
    
    // التحقق من ظهور المريض في القائمة
    await expect(page.locator('text=أحمد محمد السعيد')).toBeVisible();
  });

  // ====================================================================
  // Test 2: البحث عن مريض
  // ====================================================================
  
  test('should search for a patient', async ({ page }) => {
    // الانتقال لصفحة المرضى
    await page.goto('/patients');
    
    // البحث عن مريض
    await page.fill('input[placeholder*="بحث"], input[placeholder*="Search"]', 'أحمد');
    
    // الانتظار قليلاً للبحث
    await page.waitForTimeout(1000);
    
    // التحقق من ظهور نتائج البحث
    const results = page.locator('[data-testid="patient-list"] > *');
    await expect(results).not.toHaveCount(0);
  });

  // ====================================================================
  // Test 3: عرض تفاصيل مريض
  // ====================================================================
  
  test('should view patient details', async ({ page }) => {
    // الانتقال لصفحة المرضى
    await page.goto('/patients');
    
    // النقر على أول مريض في القائمة
    await page.click('[data-testid="patient-list"] > *:first-child');
    
    // التحقق من عرض تفاصيل المريض
    await expect(page.locator('text=/تفاصيل المريض|Patient Details/i')).toBeVisible();
    
    // التحقق من وجود معلومات المريض
    await expect(page.locator('text=/رقم الجوال|Phone/i')).toBeVisible();
    await expect(page.locator('text=/البريد الإلكتروني|Email/i')).toBeVisible();
  });

  // ====================================================================
  // Test 4: حجز موعد لمريض
  // ====================================================================
  
  test('should book an appointment for a patient', async ({ page }) => {
    // الانتقال لصفحة المرضى
    await page.goto('/patients');
    
    // النقر على أول مريض
    await page.click('[data-testid="patient-list"] > *:first-child');
    
    // النقر على زر "حجز موعد"
    await page.click('button:has-text("حجز موعد"), button:has-text("Book Appointment")');
    
    // ملء بيانات الموعد
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split('T')[0];
    
    await page.fill('input[name="appointment_date"]', dateString);
    await page.fill('input[name="appointment_time"]', '10:00');
    
    // اختيار المدة
    await page.selectOption('select[name="duration"]', '30');
    
    // حفظ الموعد
    await page.click('button[type="submit"]:has-text("حفظ"), button[type="submit"]:has-text("Save")');
    
    // التحقق من رسالة النجاح
    await expect(page.locator('text=/تم حجز الموعد|Appointment booked/i')).toBeVisible({ timeout: 5000 });
  });

  // ====================================================================
  // Test 5: إنشاء فاتورة لمريض
  // ====================================================================
  
  test('should create an invoice for a patient', async ({ page }) => {
    // الانتقال لصفحة الفواتير
    await page.goto('/invoices');
    
    // النقر على زر "إنشاء فاتورة"
    await page.click('button:has-text("إنشاء فاتورة"), button:has-text("Create Invoice")');
    
    // اختيار مريض
    await page.click('input[placeholder*="اختر مريض"], input[placeholder*="Select Patient"]');
    await page.click('text=/أحمد محمد|patient/i:first-child');
    
    // إضافة عنصر للفاتورة
    await page.click('button:has-text("إضافة عنصر"), button:has-text("Add Item")');
    await page.fill('input[name="description"]', 'فحص عام');
    await page.fill('input[name="quantity"]', '1');
    await page.fill('input[name="unit_price"]', '500');
    
    // حفظ الفاتورة
    await page.click('button[type="submit"]:has-text("حفظ"), button[type="submit"]:has-text("Save")');
    
    // التحقق من رسالة النجاح
    await expect(page.locator('text=/تم إنشاء الفاتورة|Invoice created/i')).toBeVisible({ timeout: 5000 });
  });

  // ====================================================================
  // Test 6: إضافة دفعة لفاتورة
  // ====================================================================
  
  test('should add payment to an invoice', async ({ page }) => {
    // الانتقال لصفحة الفواتير
    await page.goto('/invoices');
    
    // النقر على أول فاتورة غير مدفوعة
    await page.click('[data-testid="invoice-list"] > *:first-child');
    
    // النقر على زر "إضافة دفعة"
    await page.click('button:has-text("إضافة دفعة"), button:has-text("Add Payment")');
    
    // ملء بيانات الدفعة
    await page.fill('input[name="amount"]', '500');
    await page.selectOption('select[name="payment_method"]', 'cash');
    
    // حفظ الدفعة
    await page.click('button[type="submit"]:has-text("حفظ"), button[type="submit"]:has-text("Save")');
    
    // التحقق من رسالة النجاح
    await expect(page.locator('text=/تم إضافة الدفعة|Payment added/i')).toBeVisible({ timeout: 5000 });
  });

  // ====================================================================
  // Test 7: التحقق من الأداء
  // ====================================================================
  
  test('should load pages within acceptable time', async ({ page }) => {
    const pages = [
      '/patients',
      '/appointments',
      '/invoices',
      '/treatments',
      '/reports',
    ];

    for (const url of pages) {
      const startTime = Date.now();
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // يجب أن تحمل الصفحة في أقل من 3 ثواني
      expect(loadTime).toBeLessThan(3000);
    }
  });

  // ====================================================================
  // Test 8: التحقق من Responsive Design
  // ====================================================================
  
  test('should be responsive on mobile', async ({ page }) => {
    // تغيير حجم الشاشة لموبايل
    await page.setViewportSize({ width: 375, height: 667 });
    
    // الانتقال للصفحة الرئيسية
    await page.goto('/');
    
    // التحقق من ظهور قائمة الموبايل
    const mobileMenu = page.locator('[data-testid="mobile-menu"]');
    await expect(mobileMenu).toBeVisible();
    
    // النقر على القائمة
    await mobileMenu.click();
    
    // التحقق من ظهور عناصر القائمة
    await expect(page.locator('text=/المرضى|Patients/i')).toBeVisible();
  });
});
