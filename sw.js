// Kistenkrawall service worker: makes the game installable and playable offline.
// VERSION is replaced with the commit hash by the deploy workflow, so every deploy
// gets a fresh cache automatically. Locally it stays 'kk-dev'.
const VERSION = 'kk-dev';

// Everything the game needs. tests/smoke.mjs checks that this list matches the files
// that index.html actually loads, so a new file cannot be forgotten here.
const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './fonts/fonts.css',
  './fonts/atkinson-hyperlegible-400.woff2',
  './fonts/atkinson-hyperlegible-700.woff2',
  './fonts/bowlby-one-sc-400.woff2',
  './vendor/three.r128.min.js',
  './js/core.js',
  './js/render.js',
  './js/world.js',
  './js/content.js',
  './js/sounds.js',
  './js/music.js',
  './js/audio.js',
  './js/units.js',
  './js/combat.js',
  './js/ai.js',
  './js/input.js',
  './js/hud.js',
  './js/mountain.js',
  './js/game.js',
  './js/save.js',
  './js/xmas.js',
  './js/net.js',
  './vendor/peerjs-1.5.4.min.js',
  './js/update.js',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/favicon-16.png',
  './tonstudio.html'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // cache: 'reload' bypasses the browser's HTTP cache, so a new version never stores old files
    await cache.addAll(PRECACHE.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

// The page asks which version this worker holds, to know when an update is fully downloaded.
self.addEventListener('message', event => {
  if (event.data === 'version' && event.ports[0]) event.ports[0].postMessage(VERSION);
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

// Rarely changing, larger files: straight from the cache.
const CACHE_FIRST = /\/(vendor|fonts|icons)\//;

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith('/version.json')) return;   // always straight from the server

  if (CACHE_FIRST.test(url.pathname)) {
    event.respondWith((async () => {
      const hit = await caches.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
      return res;
    })());
    return;
  }

  // Page, code and styles: network first so updates arrive right away, cache when offline.
  event.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) (await caches.open(VERSION)).put(req, res.clone());
      return res;
    } catch (e) {
      const hit = await caches.match(req, { ignoreSearch: req.mode === 'navigate' }) ||
        (req.mode === 'navigate' ? await caches.match('./index.html') : null);
      return hit || Response.error();
    }
  })());
});
