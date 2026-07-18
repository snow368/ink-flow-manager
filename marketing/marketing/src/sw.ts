// Custom service worker for InkFlow PWA
// Workbox injects precache manifest at build time
/// <reference lib="webworker" />

declare let self: any;

// Workbox injects the precache manifest here at build time
const manifest = self.__WB_MANIFEST;
if (manifest) {
  self.__precacheManifest = manifest;
}

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event: any) => {
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', (event: any) => {
  let data: { title: string; body: string; tag: string; url: string } | null = null;
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    data = null;
  }

  const title = data?.title || 'Ink Flow';
  const options: NotificationOptions = {
    body: data?.body || 'New notification',
    tag: data?.tag || 'inkflow',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: data?.url || '/' },
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click → open PWA and navigate to booking
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList: any[]) => {
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
