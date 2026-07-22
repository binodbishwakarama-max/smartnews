// Service Worker for PWA (Stale-While-Revalidate & Offline Article Caching)
const CACHE_NAME = "smartnews-v3";
const urlsToCache = [
  "/",
  "/saved",
  "/manifest.json",
];

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event (Network-First with Cache Fallback for Article API & Pages)
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip Clerk Auth & External non-API URLs
  if (url.pathname.includes("clerk") || (url.hostname !== self.location.hostname && !url.hostname.includes("onrender.com"))) {
    return;
  }

  // Article API Request Caching Strategy: Network-First with Fallback to Cache
  if (url.pathname.includes("/api/v1/articles")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Serve cached article JSON when offline
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(JSON.stringify({ error: "Offline mode. Showing cached data." }), {
              status: 200,
              headers: { "Content-Type": "application/json" }
            });
          });
        })
    );
    return;
  }

  // HTML Page Navigation Strategy: Network-First with Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return caches.match("/");
        });
      })
  );
});
