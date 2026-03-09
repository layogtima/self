/**
 * FERMENT — Service Worker
 * Offline-first caching strategy
 */

const CACHE_NAME = 'ferment-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/store.js',
  './js/recipes.js',
  './js/utils/formatting.js',
  './js/utils/search.js',
  './js/utils/matching.js',
  './js/components/SearchBar.js',
  './js/components/FilterPanel.js',
  './js/components/RecipeCard.js',
  './js/components/RecipeModal.js',
  './js/components/PantryManager.js',
  './js/components/JournalManager.js',
  './js/components/BrineCalculator.js',
  './js/components/BatchScaler.js',
  './js/components/TimerManager.js',
  './js/components/ToolsView.js',
  './manifest.json',
  './assets/icons/favicon.svg',
];

const CDN_ASSETS = [
  'https://unpkg.com/vue@3/dist/vue.global.prod.js',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300..700;1,9..40,300..700&family=JetBrains+Mono:wght@400;500&display=swap',
];

// Install — cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache static assets (don't fail install if some CDN assets fail)
      return cache.addAll(STATIC_ASSETS).then(() => {
        return Promise.allSettled(
          CDN_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn('SW: Failed to cache CDN asset:', url, err);
          }))
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for app shell, stale-while-revalidate for others
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // For same-origin requests: cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          // Offline fallback for HTML
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });
      })
    );
    return;
  }

  // For CDN/external: stale-while-revalidate
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
