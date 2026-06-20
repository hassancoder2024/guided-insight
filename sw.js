/**
 * Guided Insights — service worker.
 * Caches the static app shell (HTML/CSS/JS/icons) so the installed app
 * can open instantly and even offline. Live verse/search requests to the
 * AlQuran Cloud API always go to the network — they're not cached here,
 * since the app already has its own offline fallback (data.js) for those.
 */

const CACHE_NAME = "guided-insights-v1";
const SHELL_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./data.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls — always go live so verses/search stay fresh.
  if (url.hostname.includes("alquran.cloud")) return;

  // Cache-first for same-origin app-shell files; network fallback otherwise.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) =>
          cached ||
          fetch(event.request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
            return res;
          }).catch(() => caches.match("./index.html"))
      )
    );
  }
});
