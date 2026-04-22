const CACHE_NAME = 'tasmi-cache-v6';

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

// URL font yang akan di-cache dengan fetch manual (mode no-cors)
const FONT_URLS = [
  'https://cdn.jsdelivr.net/gh/mpcabd/quran-fonts@master/UthmanicHafs1/UthmanicHafs1.woff2'
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

      // 3. Cache font dengan fetch no-cors agar tidak kena CORS error
      await Promise.allSettled(
        FONT_URLS.map(async url => {
          try {
            const response = await fetch(url, { mode: 'no-cors' });
            // response.type === 'opaque' untuk no-cors, tetap simpan
            await cache.put(url, response);
            console.log('Font berhasil di-cache:', url);
          } catch (err) {
            console.warn('Gagal cache font (akan dimuat langsung):', url, err);
          }
        })
      );
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
  // Abaikan request analytics / non-http
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request.clone()).then(networkResponse => {
        // Simpan ke cache jika response valid (termasuk opaque dari no-cors)
        if (
          networkResponse &&
          (networkResponse.status === 200 || networkResponse.type === 'opaque')
        ) {
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
