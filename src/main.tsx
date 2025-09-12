import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { setupGlobalErrorHandling } from './lib/error-handler'

// Setup global error handling for Chrome extensions and other errors
setupGlobalErrorHandling();

// Enable concurrent features for better performance
const container = document.getElementById("root")!;
const root = createRoot(container);

// Register service worker for PWA with better error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
        // Force check for updates immediately
        registration.update();
        
        // Check for updates immediately
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                console.log('New SW content available');
              }
            });
          }
        });
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });

  // Handle service worker messages and Chrome extension port errors
  navigator.serviceWorker.addEventListener('message', (event) => {
    // Ignore Chrome extension port errors
    if (event.data && typeof event.data === 'object') {
      try {
        if (event.data.type === 'SW_UPDATED') {
          console.log('Service worker updated');
        }
      } catch (err) {
        // Silently ignore Chrome extension communication errors
        console.debug('Ignoring extension communication error:', err);
      }
    }
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
}

// Only use StrictMode in development
const AppWrapper = import.meta.env.DEV 
  ? React.StrictMode 
  : React.Fragment;

root.render(
  <AppWrapper>
    <App />
  </AppWrapper>
);
