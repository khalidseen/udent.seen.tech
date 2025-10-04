import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandling } from './lib/error-handler'
import { initializeMonitoring } from './services/monitoring'
import { initializeDatabaseSchema } from './lib/database-init'
import { registerServiceWorker } from './lib/service-worker-register'
import { setupLazyLoading } from './lib/image-optimizer'

// 🔍 Initialize Error Monitoring (Sentry)
initializeMonitoring();

// Setup global error handling for Chrome extensions and other errors
setupGlobalErrorHandling();

// Enable concurrent features for better performance
const container = document.getElementById("root")!;
const root = createRoot(container);

// Service Worker Registration - ONLY IN PRODUCTION
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Production: Register optimized Service Worker
    registerServiceWorker();
  } else {
    // Development: Force unregister ALL service workers
    window.addEventListener('load', async () => {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('🔴 DEV: SW unregistered:', registration.scope);
        }
        
        // Clear all caches
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log('🗑️ DEV: Cache deleted:', cacheName);
        }
        
        console.log('✅ DEV MODE: All SW and caches cleared');
      } catch (error) {
        console.error('❌ Error clearing SW:', error);
      }
    });
  }
}

// Setup lazy loading for images
window.addEventListener('load', () => {
  setupLazyLoading();
});

// Prevent Chrome extension port errors from affecting the app
window.addEventListener('error', (event) => {
  if (event.message && (
    event.message.includes('Extension context invalidated') ||
    event.message.includes('chrome-extension') ||
    event.message.includes('Attempting to use a disconnected port')
  )) {
    event.preventDefault();
    console.debug('Suppressed Chrome extension error:', event.message);
    return false;
  }
});

// تأخير تهيئة قاعدة البيانات حتى يتم التحقق من Auth
const delayedDatabaseInit = () => {
  // انتظر 1 ثانية للسماح لـ Auth بالتهيئة أولاً
  setTimeout(() => {
    initializeDatabaseSchema().catch(error => {
      console.error('Failed to initialize database schema:', error);
    });
  }, 1000);
};

// تهيئة قاعدة البيانات بعد تحميل الصفحة
window.addEventListener('load', delayedDatabaseInit);

// Only use StrictMode in development
const AppWrapper = process.env.NODE_ENV === 'development' 
  ? React.StrictMode 
  : React.Fragment;

root.render(
  <AppWrapper>
    <App />
  </AppWrapper>
);
