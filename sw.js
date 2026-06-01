const CACHE_NAME = 'crew-wallet-v39.1-offline';
const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// Install Event - Caches the core files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Wipes old V38 caches to prevent legacy conflicts
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
            console.log('Purging legacy cache:', key);
            return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Intercepts network calls to serve app offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }).catch(() => {
        // Fallback for offline if the fetch totally fails
        return caches.match('./index.html');
    })
  );
});
