const CACHE = "cfa-hub-v1";
const PRECACHE = ["/", "/index.html", "/manifest.json", "/icons/icon.svg"];

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)))
);

self.addEventListener("activate", e =>
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
);

self.addEventListener("fetch", e => {
  // Network-first for API calls; cache-first for everything else
  if (e.request.url.includes("workers.dev") || e.request.url.includes("anthropic.com")) {
    return; // let API calls pass through uncached
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.status === 200 && e.request.method === "GET") {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
