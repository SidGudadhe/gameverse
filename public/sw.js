// GameVerse Service Worker Unregister & Purge Handler
// Cleans up any legacy service workers or caches previously registered on localhost:3000
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key.includes('agency') || key.includes('agencypilot')) {
              return caches.delete(key);
            }
          })
        );
      }),
      self.registration.unregister(),
    ])
  );
});
