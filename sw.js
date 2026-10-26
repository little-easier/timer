// Little Easier Timer: keep working with no connection after the first visit.
const CACHE = 'le-timer-v2';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('le-timer-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Show the saved copy straight away, then refresh it in the background,
// so the app opens instantly offline and picks up updates next time.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const ours = url.origin === location.origin && url.pathname.startsWith(new URL('./', location).pathname);
  if (!ours) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const page = url.pathname.split('/').pop();
      const key = req.mode === 'navigate' ? (page && page.endsWith('.html') ? page : 'index.html') : req;
      const hit = await cache.match(key);
      const fresh = fetch(req).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(key, res.clone());
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});
