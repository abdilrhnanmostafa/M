// Service Worker — الدوحة المحمدية (استقبال الإشعارات في الخلفية)
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = { title: 'الدوحة المحمدية', body: event.data ? event.data.text() : '' }; }
  const title = data.title || 'الدوحة المحمدية';
  const options = {
    body: data.body || '',
    lang: 'ar',
    dir: 'rtl',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'dawha-' + (data.ts || Date.now()),
    renotify: true,
    requireInteraction: false,
    silent: false,
    data: { url: data.url || self.registration.scope }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if ('focus' in c) { try { await c.focus(); return; } catch (e) {} }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
