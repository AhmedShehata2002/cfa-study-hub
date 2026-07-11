const CACHE = "cfa-hub-v2";
const STATIC = ["./manifest.json", "./icons/icon.svg"];

self.addEventListener("install", e =>
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
);

self.addEventListener("activate", e =>
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener("fetch", e => {
  // Skip non-GET and API calls entirely
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("workers.dev") || e.request.url.includes("anthropic.com")) return;

  const isHTML = e.request.mode === "navigate" || e.request.destination === "document";

  if (isHTML) {
    // Network-first for HTML so deploys are always picked up
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for static assets (icons, manifest)
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }))
    );
  }
});
