/// <reference types="vite-plugin-pwa/client" />
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Activate new SW immediately (paired with registerType: 'autoUpdate').
self.skipWaiting();
self.addEventListener('activate', () => {
  self.clients.claim();
});

// Precache the app shell injected by vite-plugin-pwa's injectManifest strategy.
precacheAndRoute(self.__WB_MANIFEST);
