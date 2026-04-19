const CACHE_NAME = 'tasmi-cache-v3';

// Resource yang di-cache saat install
const urlsToCache = [
  './',
  './index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // addAll diganti add satu-satu agar satu gagal tidak blokir semua
      return Promise.allSettled(
        urlsToCache.map(url => cache.add(url).catch(err => console.warn('Cache miss:', url, err)))
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => Promise.all(
        keys.map(key => { if (key !== CACHE_NAME) return caches.delete(key); })
      )),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  // Hanya tangani GET request
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request.clone()).then(networkResponse => {
        // Hanya cache response valid dan bukan opaque (cross-origin tanpa CORS)
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type !== 'opaque'
        ) {
          const toCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, toCache));
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback: kembalikan index.html untuk navigasi
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // Untuk aset lain, kembalikan cached jika ada
        return cached || new Response('Offline', { status: 503 });
      });
    })
  );
});
