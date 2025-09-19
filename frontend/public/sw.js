// Property Review Editor - Service Worker with Network Optimization
const CACHE_NAME = 'property-review-v1.1.0';
const OFFLINE_URL = '/offline.html';
const CRITICAL_CACHE = 'critical-v1.1.0';
const API_CACHE = 'api-cache-v1.1.0';

// Critical resources for fast startup (highest priority)
const CRITICAL_URLS = [
  '/',
  '/manifest.json',
  '/offline.html'
];

// App resources (cache but not critical)
const CACHE_URLS = [
  '/home',
  '/editor',
  '/session',
  '/NeitClemLogo.png'
];

// API endpoints to cache with different strategies
const API_PATTERNS = [
  /\/api\/projects\/\?/,  // Project lists
  /\/api\/auth\/status/,  // Auth status
  /\/api\/forms\//        // Forms data
];

// Install event - cache critical resources first for mobile performance
self.addEventListener('install', event => {
  console.log('[SW] Install event - optimized for mobile');
  
  event.waitUntil(
    Promise.all([
      // Cache critical resources first (blocking)
      caches.open(CRITICAL_CACHE)
        .then(cache => {
          console.log('[SW] Caching critical assets');
          return cache.addAll(CRITICAL_URLS.map(url => new Request(url, { cache: 'reload' })));
        }),
      // Cache non-critical resources (non-blocking)
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('[SW] Caching app assets');
          return cache.addAll(CACHE_URLS.map(url => 
            new Request(url, { cache: 'reload' })
          )).catch(error => {
            console.warn('[SW] Some assets failed to cache:', error);
            return Promise.resolve(); // Don't fail installation
          });
        })
    ])
    .then(() => {
      console.log('[SW] Installation complete - mobile optimized');
      return self.skipWaiting();
    })
    .catch(error => {
      console.error('[SW] Installation failed:', error);
      return self.skipWaiting(); // Continue anyway
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim();
      })
  );
});

// Mobile-optimized fetch handler with smart caching strategies
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  const url = new URL(event.request.url);
  
  // Strategy 1: API Requests - Smart caching for mobile performance
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }
  
  // Strategy 2: Critical resources - Cache first (fastest)
  if (CRITICAL_URLS.includes(url.pathname)) {
    event.respondWith(handleCriticalRequest(event.request));
    return;
  }
  
  // Strategy 3: Static assets - Cache with network fallback
  if (isStaticAsset(event.request.url)) {
    event.respondWith(handleStaticAsset(event.request));
    return;
  }
  
  // Strategy 4: App pages - Network first with cache fallback
  event.respondWith(handleAppPage(event.request));
});

// Handle API requests with smart caching for mobile
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // For project lists, use cache-first (they change infrequently)
  if (API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    try {
      const cache = await caches.open(API_CACHE);
      const cached = await cache.match(request);
      
      if (cached) {
        console.log('[SW] API cache hit:', request.url);
        // Serve cached while updating in background
        fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
          })
          .catch(() => {}); // Silent fail for background update
        
        return cached;
      }
    } catch (error) {
      console.warn('[SW] API cache error:', error);
    }
  }
  
  // For all other APIs, try network first
  try {
    const response = await fetch(request, {
      // Mobile optimization: shorter timeout
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok && API_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] API network failed, trying cache:', error);
    const cache = await caches.open(API_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Handle critical resources - cache first for instant loading
async function handleCriticalRequest(request) {
  try {
    const cache = await caches.open(CRITICAL_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
  } catch (error) {
    console.warn('[SW] Critical cache error:', error);
  }
  
  return fetch(request);
}

// Handle static assets with efficient caching
async function handleStaticAsset(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('[SW] Static asset cache hit:', request.url);
      return cached;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
    
  } catch (error) {
    console.error('[SW] Static asset failed:', error);
    throw error;
  }
}

// Handle app pages - network first with offline fallback
async function handleAppPage(request) {
  try {
    const response = await fetch(request, {
      // Mobile optimization: shorter timeout
      signal: AbortSignal.timeout(8000)
    });
    return response;
  } catch (error) {
    console.log('[SW] Page network failed, serving offline page:', error);
    const cache = await caches.open(CRITICAL_CACHE);
    return cache.match(OFFLINE_URL) || new Response('Offline', { status: 503 });
  }
}

// Utility function to check if request is for static asset
function isStaticAsset(url) {
  return url.includes('/static/') || 
         url.includes('/assets/') ||
         url.endsWith('.js') ||
         url.endsWith('.css') ||
         url.endsWith('.png') ||
         url.endsWith('.jpg') ||
         url.endsWith('.svg') ||
         url.endsWith('.woff') ||
         url.endsWith('.woff2');
}

// Background sync for when connection is restored
self.addEventListener('sync', event => {
  if (event.tag === 'property-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(syncPropertyData());
  }
});

// Push notification handler
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Property Review notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'property-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icons/icon-48x48.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-48x48.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Property Review', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Helper function for syncing data when connection is restored
async function syncPropertyData() {
  try {
    // Get all pending sync data from IndexedDB
    // This would integrate with your existing data storage
    console.log('[SW] Syncing property data...');
    
    // Example: Send pending form data to server
    const pendingData = await getPendingSyncData();
    if (pendingData && pendingData.length > 0) {
      for (const item of pendingData) {
        await fetch('/api/sync', {
          method: 'POST',
          body: JSON.stringify(item),
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      await clearSyncData();
      console.log('[SW] Sync completed successfully');
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// Helper functions for IndexedDB operations
async function getPendingSyncData() {
  // This would integrate with your existing storage system
  return [];
}

async function clearSyncData() {
  // This would integrate with your existing storage system
  return Promise.resolve();
}

// Handle service worker updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received skip waiting message');
    self.skipWaiting();
  }
});

// Log service worker installation
console.log('[SW] Service Worker script loaded');