const CACHE_NAME = 'starbridge-pwa-cache-v2';
const API_CACHE_NAME = 'starbridge-api-cache-v2';

const swUrl = new URL(self.location.href);
const supabaseUrlParam = swUrl.searchParams.get('supabaseUrl');
const SUPABASE_ORIGIN = supabaseUrlParam ? new URL(supabaseUrlParam).origin : 'https://acrzypzzbbkdisietjlf.supabase.co';

const STATIC_ASSETS = [
  '/',
  '/index.html'
];

// Install Event - Pre-cache shell
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor - Cache API data & Static assets
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Intercept Supabase database calls (slides, lessons data)
  if (url.origin === SUPABASE_ORIGIN) {
    // Only cache GET/SELECT requests
    if (e.request.method === 'GET') {
      e.respondWith(
        caches.open(API_CACHE_NAME).then((cache) => {
          return fetch(e.request)
            .then((response) => {
              if (response.status === 200) {
                cache.put(e.request, response.clone());
              }
              return response;
            })
            .catch(() => {
              // Return from cache if offline
              return cache.match(e.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;
                return new Response(JSON.stringify({ error: "Offline: cached data not found" }), {
                  status: 503,
                  headers: { 'Content-Type': 'application/json' }
                });
              });
            });
        })
      );
      return;
    }
  }

  // Intercept static assets & scripts (Cache-First with Network Fallback)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        // Cache new local static assets dynamically
        if (response.status === 200 && (url.origin === self.location.origin)) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, response.clone());
            return response;
          });
        }
        return response;
      });
    }).catch(() => {
      // Fallback to index.html for navigation requests (SPA support)
      if (e.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    })
  );
});
