/* OPERATOR LOG // TACTICAL SUITE PRO — Service Worker */
const VERSION = "v3.1.0"; // Version bumped for new assets
const CACHE = "operator-log-" + VERSION;

const CORE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon.svg",
  "/images/mon.jpg",
  "/images/tue.jpg",
  "/images/wed.jpg",
  "/images/thu.jpg",
  "/images/fri.jpg",
  "/images/weekend.jpg",
  "/images/overview.jpg"
];

/* ---------- install ---------- */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((e) => console.warn("[SW] precache miss:", url, e))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

/* ---------- activate ---------- */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k.startsWith("operator-log-") && k !== CACHE)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ---------- fetch ---------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (req.method !== "GET") return;

  const url = new URL(req.url);

  /* AI vision endpoint — never cached, always network */
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(
          JSON.stringify({
            is_food: false,
            name: "Offline",
            p: 0,
            cal: 0,
            breakdown: "Offline: vision service unavailable.",
            error: "offline"
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  /* cross-origin (fonts) — cache-first with network fallback */
  if (url.origin !== self.location.origin) {
    event.respondWith(
      caches.match(req).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && (res.ok || res.type === "opaque")) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
          }
          return res;
        }).catch(() => new Response("", { status: 504 }));
      })
    );
    return;
  }

  /* navigations — network first, offline shell fallback */
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", clone)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/index.html").then((hit) => hit || caches.match("/")))
    );
    return;
  }

  /* same-origin assets — cache first, then network (runtime cache) */
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => {
        if (req.destination === "document") return caches.match("/index.html");
        return new Response("", { status: 504, statusText: "Offline" });
      });
    })
  );
});

/* ---------- message channel ---------- */
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});