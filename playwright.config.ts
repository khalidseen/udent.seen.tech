import { defineConfig, devices } from '@playwright/test';

/**
 * إعداد Playwright للاختبارات الشاملة (E2E)
 * Playwright Configuration for End-to-End Testing
 * 
 * يوفر إعدادات لاختبار التطبيق على متصفحات مختلفة وأجهزة متعددة
 */

export default defineConfig({
  // مجلد الاختبارات
  testDir: './tests/e2e',
  
  // المدة القصوى لكل اختبار (30 ثانية)
  timeout: 30 * 1000,
  
  // عدد مرات إعادة المحاولة عند الفشل
  retries: process.env.CI ? 2 : 0,
  
  // عدد العمال (Workers) - 1 في CI، متوازي في التطوير
  workers: process.env.CI ? 1 : undefined,
  
  // المراسل (Reporter) - HTML في التطوير، list في CI
  reporter: process.env.CI ? 'list' : 'html',
  
  // الإعدادات المشتركة لجميع الاختبارات
  use: {
    // URL الأساسي للتطبيق
    baseURL: 'http://localhost:8084',
    
    // تتبع العمليات عند الفشل فقط
    trace: 'on-first-retry',
    
    // لقطات شاشة عند الفشل
    screenshot: 'only-on-failure',
    
    // فيديو عند الفشل
    video: 'retain-on-failure',
    
    // إعدادات المتصفح
    viewport: { width: 1280, height: 720 },
    
    // تجاهل أخطاء HTTPS
    ignoreHTTPSErrors: true,
    
    // المهلة الزمنية للإجراءات
    actionTimeout: 10 * 1000,
    
    // المهلة الزمنية للتنقل
    navigationTimeout: 15 * 1000,
  },

  // إعداد الخادم المحلي
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8084',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // المشاريع (Projects) - متصفحات وأجهزة مختلفة
  projects: [
    // ====================================================================
    // Desktop Browsers
    // ====================================================================
    
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // ====================================================================
    // Mobile Browsers
    // ====================================================================
    
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // ====================================================================
    // Tablet
    // ====================================================================
    
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },

    // ====================================================================
    // Edge (Chromium)
    // ====================================================================
    
    {
      name: 'Microsoft Edge',
      use: {
        ...devices['Desktop Edge'],
        channel: 'msedge',
      },
    },
  ],
});
