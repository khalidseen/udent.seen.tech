const VERSION = 'v' + Date.now();
const CACHE_NAME = 'fourdentist-' + VERSION;
const STATIC_CACHE = 'fourdentist-static-' + VERSION;

const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service worker installed');
        return self.skipWaiting();
      })
  );
});

// Fetch event - Network First strategy for main app, Cache First for static assets
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  
<<<<<<< HEAD
  // Skip Chrome extension requests to prevent port errors
  if (url.protocol === 'chrome-extension:' || url.hostname.includes('extension')) {
    return;
  }
  
  // API requests - Network First with fallback and better error handling
=======
  // API requests - Network First with fallback
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
  if (url.pathname.includes('/rest/v1/') || url.pathname.includes('/auth/v1/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
<<<<<<< HEAD
            }).catch(err => console.warn('Cache put failed:', err));
          }
          return response;
        })
        .catch(error => {
          console.warn('Network request failed, trying cache:', error);
          // Fallback to cache for offline with better error handling
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return appropriate error response for different endpoints
            if (url.pathname.includes('permissions') || url.pathname.includes('get_user_effective_permissions')) {
              return new Response(JSON.stringify({ 
                error: 'Service temporarily unavailable',
                fallback: true,
                data: []
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            }
            return new Response(JSON.stringify({ 
              error: 'Offline - cached data not available' 
            }), {
              status: 503,
=======
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for offline
          return caches.match(event.request).then(cachedResponse => {
            return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
>>>>>>> cbd682d36e862741c55b9e7b5d144f8de65c694a
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Static assets - Cache First
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
    );
    return;
  }

  // HTML pages - Network First with stale-while-revalidate
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Keep current cache versions
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && 
              cacheName.startsWith('fourdentist-')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service worker activated with version:', VERSION);
      // Take control of all clients immediately
      return self.clients.claim();
    }).then(() => {
      // Notify clients about update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'SW_UPDATED', version: VERSION });
        });
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(
      // This would trigger the sync service
      self.registration.showNotification('مزامنة البيانات', {
        body: 'جاري مزامنة البيانات المحفوظة محلياً...',
        icon: '/icon-192x192.png'
      })
    );
  }
});