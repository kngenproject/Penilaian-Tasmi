const CACHE_NAME = 'tasmi-cache-v5';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './fonts/UthmanicHafs1.woff2',
  'https://cdn.jsdelivr.net/gh/mpcabd/quran-fonts@master/UthmanicHafs1/UthmanicHafs1.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        urlsToCache.map(url => 
          cache.add(url).catch(err => console.warn('Gagal cache:', url, err))
        )
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
  
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(request.clone()).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseToCache));
        }
        return networkResponse;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Offline - kontak tidak tersedia', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});