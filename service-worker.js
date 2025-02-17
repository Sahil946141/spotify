const CACHE_NAME = 'music-app-cache-v1'; // Cache versioning
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/scripts/app.js',
  '/images/logo.png',
  '/songs/song1.mp3', // Add music files
  '/songs/song2.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache)
          .then(() => console.log("All resources added to cache"))
          .catch((error) => {
            console.error('Failed to add all to cache:', error);
            urlsToCache.forEach((url) => {
              fetch(url).catch((e) => console.error(`Could not fetch: ${url}`));
            });
          });
      })
      .catch((error) => console.error("Could not open cache:", error))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
      .catch(() => {
        if (event.request.destination === 'audio') {
          return caches.match('/songs/offline-placeholder.mp3'); // Fallback song
        }
      })
  );
});
