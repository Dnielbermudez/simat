/* SIMAT · Service worker: deja la app disponible sin internet */
const CACHE = 'simat-v6';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'assets/icon.svg', 'css/styles.css',
  'js/config.js', 'js/state.js', 'js/sim.js', 'js/rules.js', 'js/charts.js', 'js/views.js', 'js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
