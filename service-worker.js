/* PETATOE PWA Enterprise Service Worker — V10-P1 Update Engine */
'use strict';

const APP_VERSION = '10.0.7-mobile-redesign-m1';
const CACHE_PREFIX = 'petatoe-pwa-';
const STATIC_CACHE = `${CACHE_PREFIX}static-${APP_VERSION}`;
const RUNTIME_CACHE = `${CACHE_PREFIX}runtime-${APP_VERSION}`;
const OFFLINE_URL = './offline.html';
const APP_SHELL = [
  './',
  './index.html',
  './offline.html',
  './manifest.webmanifest',
  './favicon.ico',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-512x512.png',
  './assets/icons/icon-maskable-192.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/petatoe-app-icon.svg',
  './css/pwa/pwa-enterprise.css',
  './css/mobile/mobile-enterprise-m1.css',
  './css/mobile/mobile-enterprise-m2.css',
  './css/mobile/mobile-enterprise-v10-shell.css',
  './css/mobile/mobile-about-app.css',
  './css/mobile/mobile-enterprise-v10-dashboard.css',
  './css/mobile/mobile-enterprise-v10-reports.css',
  './css/mobile/mobile-enterprise-v10-management.css',
  './css/mobile/mobile-enterprise-v10-experience.css',
  './css/mobile/mobile-enterprise-v10-redesign-m1.css',
  './mobile/mobile-enterprise-v10-shell.js',
  './mobile/about-app.js',
  './mobile/mobile-enterprise-v10-dashboard.js',
  './mobile/mobile-enterprise-v10-reports.js',
  './mobile/mobile-enterprise-v10-management.js',
  './mobile/mobile-enterprise-v10-experience.js',
  './pwa/mobile-runtime-layout-m1-2.js',
  './pwa/pwa-manager.js'
];

const NETWORK_FIRST_EXTENSIONS = /\.(?:html?|js|mjs|css|json|webmanifest)$/i;
const CACHE_FIRST_EXTENSIONS = /\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf)$/i;

function freshRequest(input) {
  const request = input instanceof Request ? input : new Request(input);
  return new Request(request, { cache: 'no-store' });
}

async function cacheShell() {
  const cache = await caches.open(STATIC_CACHE);
  await Promise.all(APP_SHELL.map(async (url) => {
    const response = await fetch(freshRequest(url));
    if (!response || !response.ok) throw new Error(`Unable to pre-cache ${url}`);
    await cache.put(url, response);
  }));
}

async function deleteLegacyCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
      .map((key) => caches.delete(key))
  );
}

async function broadcast(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function networkFirst(request, fallbackUrl) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await fetch(freshRequest(request));
    if (response && response.ok && response.type === 'basic') await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (fallbackUrl ? await caches.match(fallbackUrl) : undefined) || Response.error();
  }
}

async function cacheFirstWithRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await caches.match(request);
  const update = fetch(request)
    .then(async (response) => {
      if (response && response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await update) || Response.error();
}

self.addEventListener('install', (event) => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if ('navigationPreload' in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch (_) { /* optional */ }
    }
    await deleteLegacyCaches();
    await self.clients.claim();
    await broadcast({ type: 'PETATOE_SW_ACTIVATED', version: APP_VERSION });
  })());
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data.type === 'GET_VERSION' && event.source) {
    event.source.postMessage({ type: 'PETATOE_SW_VERSION', version: APP_VERSION });
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) {
          const cache = await caches.open(RUNTIME_CACHE);
          await cache.put(request, preload.clone());
          return preload;
        }
      } catch (_) { /* continue with network-first */ }
      return networkFirst(request, OFFLINE_URL);
    })());
    return;
  }

  if (url.pathname.endsWith('/service-worker.js') || NETWORK_FIRST_EXTENSIONS.test(url.pathname)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (CACHE_FIRST_EXTENSIONS.test(url.pathname)) {
    event.respondWith(cacheFirstWithRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request));
});
