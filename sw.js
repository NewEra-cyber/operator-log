/* OPERATOR LOG // TACTICAL SUITE PRO — Service Worker */
// IMPORTANT: Bump this version number every time you push a major update
const VERSION = "v4.3.0";
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(
        CORE_ASSETS.map((url) =>
          cache.add(url).catch((e) => console.warn("[SW] precache miss:", url, e))
        )
      )
    ).then(() => self.skipWaiting()) // Force new SW to take over immediately
  );
});

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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // API calls: Network only
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(
          JSON.stringify({ is_food: false, name: "Offline", p: 0, cal: 0, breakdown: "Offline: vision service unavailable.", error: "offline" }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  // Navigations (HTML): Network First, fallback to cache
  // This ensures you ALWAYS get the newest UI when you have internet
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", clone));
          return res;
        })
        .catch(() => caches.match("/index.html").then((hit) => hit || caches.match("/")))
    );
    return;
  }

  // Assets (Images/Fonts): Cache First, fallback to network
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => { });
        }
        return res;
      }).catch(() => new Response("", { status: 504, statusText: "Offline" }));
    })
  );
});