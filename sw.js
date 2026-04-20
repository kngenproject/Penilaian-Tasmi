const CACHE_NAME = 'tasmi-cache-v4'; // ubah versi jika ada update

// Daftar resource yang wajib di-cache saat install
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  
  // Library eksternal
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
];

// Event Install: cache semua asset penting
self.addEventListener('install', event => {
  self.skipWaiting(); // aktifkan SW baru segera
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url => cache.add(url).catch(err => console.warn('Gagal cache:', url)))
      ).catch(() => {});
    })
  );
});

// Event Activate: hapus cache lama dan claim client
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
      self.clients.claim() // mengambil kontrol semua client segera
    ])
  );
});

// Event Fetch: strategi Cache First, fallback ke network, lalu offline fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Abaikan request non-GET
  if (request.method !== 'GET') return;
  
  // Abaikan request ke extension atau chrome-extension
  if (request.url.startsWith('chrome-extension')) return;
  
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        // Jika ada di cache, kembalikan
        return cachedResponse;
      }
      
      // Jika tidak di cache, ambil dari jaringan
      return fetch(request.clone()).then(networkResponse => {
        // Hanya cache response yang sukses (status 200) dan bukan opaque
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          networkResponse.type !== 'opaque'
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Jika offline dan tidak ada di cache, berikan fallback untuk navigasi
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        // Untuk asset lain (font, gambar) yang tidak ada cache, kembalikan respons error
        return new Response('Offline - kontak tidak tersedia', { 
          status: 503, 
          statusText: 'Service Unavailable' 
        });
      });
    })
  );
});