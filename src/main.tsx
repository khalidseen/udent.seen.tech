import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import * as Sentry from '@sentry/react'
import { setupGlobalErrorHandling } from './lib/error-handler'

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });
}

setupGlobalErrorHandling();

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Defer non-critical initialization
window.addEventListener('load', () => {
  // Lazy load image optimization
  import('./lib/image-optimizer').then(m => m.setupLazyLoading());
  
  // Initialize offline DB
  import('./lib/offline-db').then(m => m.offlineDB.init().catch(() => {}));
  
  // Database schema init (delay for auth)
  setTimeout(() => {
    import('./lib/database-init').then(m => 
      m.initializeDatabaseSchema().catch(() => {})
    );
  }, 2000);
}, { once: true });

// Service Worker - production only
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    import('./lib/service-worker-register').then(m => 
      m.registerServiceWorker().catch(() => {})
    );
  }, { once: true });
}

// Suppress Chrome extension errors
window.addEventListener('error', (event) => {
  if (event.message?.includes('Extension context') || 
      event.message?.includes('chrome-extension') ||
      event.message?.includes('disconnected port')) {
    event.preventDefault();
    return false;
  }
});
