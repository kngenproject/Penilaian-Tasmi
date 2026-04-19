const CACHE_NAME = 'tasmi-cache-v2';

// Hanya cache resource same-origin dan CDN yang mendukung CORS
// Google Fonts dihapus karena response opaque tidak bisa di-addAll (akan error)
const urlsToCache = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
  // skipWaiting agar SW langsung aktif tanpa menunggu tab lama ditutup
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;
      // Clone request karena fetch hanya bisa dikonsumsi sekali
      return fetch(event.request.clone()).then(networkResponse => {
        // Hanya cache response yang valid
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return networkResponse;
      }).catch(() => response); // fallback ke cache jika offline
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Hapus cache lama
      caches.keys().then(keys => Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )),
      // Langsung ambil kontrol semua tab yang terbuka
      self.clients.claim()
    ])
  );
});