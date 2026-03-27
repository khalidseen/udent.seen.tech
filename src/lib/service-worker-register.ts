/**
 * Service Worker Registration for Production
 * تسجيل Service Worker للتخزين المؤقت المتقدم
 */

export const registerServiceWorker = async () => {
  // Only register in production
  if (!import.meta.env.PROD) {
    return;
  }

  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Service Worker registered

    // Check for updates periodically
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // Check every hour

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available - prompt user
          
          // Optionally notify user
          if (confirm('يتوفر تحديث جديد. هل تريد تحديث الصفحة؟')) {
            window.location.reload();
          }
        }
      });
    });
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }
};

// Unregister service worker (for development/debugging)
export const unregisterServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    // Service workers unregistered
  }
};

// Check if service worker is active
export const isServiceWorkerActive = (): boolean => {
  return 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
};

// Clear all caches
export const clearAllCaches = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((cacheName) => caches.delete(cacheName))
    );
    // All caches cleared
  }
};

export default {
  registerServiceWorker,
  unregisterServiceWorker,
  isServiceWorkerActive,
  clearAllCaches,
};
