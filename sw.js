const CACHE_NAME = 'aquaflow-v4';
const ASSETS = [
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.error('Install Cache Error:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Strategy: Network First for index.tsx and index.html to avoid "Old Code" white screens
  if (event.request.mode === 'navigate' || url.pathname.includes('index.tsx')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request) || caches.match('./index.html'))
    );
  } else {
    // Strategy: Cache First for assets like Tailwind or Manifest
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});