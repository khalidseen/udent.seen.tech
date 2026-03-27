import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandling } from './lib/error-handler'
import { initializeMonitoring } from './services/monitoring'
import { initializeDatabaseSchema } from './lib/database-init'

// Setup error handling immediately
setupGlobalErrorHandling();

// Initialize Sentry monitoring (no-ops gracefully when DSN is absent)
initializeMonitoring();

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
    initializeDatabaseSchema().catch(() => {});
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
