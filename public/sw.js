// EduPositive Service Worker - Offline support + caching
const CACHE_NAME = 'edupositive-v1';
const STATIC_ASSETS = ['/', '/dashboard', '/learn', '/flashcards', '/exams'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // For API calls: network first, no cache
  if (url.pathname.startsWith('/api/')) return;

  // For pages: network first, fallback to cache
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'EduPositive', {
      body: data.body || 'Time to revise!',
      icon: '/favicon-256.png',
      badge: '/favicon-256.png',
      data: { url: data.url || '/dashboard' },
      actions: [{ action: 'open', title: 'Open EduPositive' }],
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = e.notification.data?.url || '/dashboard';
  e.waitUntil(clients.openWindow(url));
});
