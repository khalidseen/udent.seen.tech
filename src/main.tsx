import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enable concurrent features for better performance
const container = document.getElementById("root")!;
const root = createRoot(container);

// Register service worker for PWA with better error handling
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
        
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
}

// Only use StrictMode in development
const AppWrapper = process.env.NODE_ENV === 'development' 
  ? React.StrictMode 
  : React.Fragment;

root.render(
  <AppWrapper>
    <App />
  </AppWrapper>
);
