const CACHE_NAME = 'tasmi-cache-v7';

// Resource lokal yang PASTI ada - cache wajib
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Resource eksternal - cache optional (tidak gagalkan install jika error)
const OPTIONAL_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];


self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // 1. Cache core assets (wajib berhasil)
      try {
        await cache.addAll(CORE_ASSETS);
      } catch (err) {
        console.warn('Gagal cache core assets:', err);
      }

      // 2. Cache optional assets (boleh gagal satu-satu)
      await Promise.allSettled(
        OPTIONAL_ASSETS.map(url =>
          cache.add(url).catch(err => console.warn('Gagal cache optional:', url, err))
        )
      );

      // Font Google Fonts di-handle langsung oleh browser (tidak perlu cache manual)
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              console.log('Menghapus cache lama:', key);
              return caches.delete(key);
            }
          })
        )
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (request.url.startsWith('chrome-extension')) return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Strategi khusus untuk Google Fonts: cache-first, fallback network
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(response => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached || new Response('', { status: 503 }));
        })
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request.clone()).then(networkResponse => {
        // Hanya cache response yang benar-benar valid (status 200, bukan opaque)
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Offline - konten tidak tersedia', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});
