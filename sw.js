const CACHE = 'flexflow-v15';
const ICON_PATHS = [
  '/FlexFlow/icons/icon-192.png',
  '/FlexFlow/icons/icon-512.png',
  '/FlexFlow/icons/apple-touch-icon.png',
];
const PRECACHE = [
  '/FlexFlow/',
  '/FlexFlow/index.html',
  '/FlexFlow/manifest.json',
  '/FlexFlow/icons/icon-192.png',
  '/FlexFlow/icons/icon-512.png',
  '/FlexFlow/icons/apple-touch-icon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Recebe logo do app e substitui os ícones em cache
self.addEventListener('message', async e => {
  if (!e.data || e.data.type !== 'UPDATE_ICON') return;
  const cache = await caches.open(CACHE);
  if (e.data.logo) {
    try {
      const blob = await fetch(e.data.logo).then(r => r.blob());
      for (const path of ICON_PATHS) {
        await cache.put(path, new Response(blob, {headers: {'Content-Type': 'image/png'}}));
      }
    } catch(err) {}
  } else {
    // Logo removida — apaga do cache para volcar ao ícone padrão
    for (const path of ICON_PATHS) await cache.delete(path);
  }
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
