const CACHE_NAME = "atlas-shell-v2";
const SHELL_INDEX = new URL("./index.html", self.registration.scope).href;
const APP_SHELL = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./atlas-icon.svg",
    "./pwa-192.png",
    "./pwa-512.png",
    "./apple-touch-icon.png",
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key.startsWith("atlas-shell-") && key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;
    const url = new URL(request.url);
    if (request.method !== "GET" || url.origin !== self.location.origin) return;
    // Never persist authenticated or user-specific responses in the offline cache.
    if (url.pathname.startsWith("/api/") || request.headers.has("authorization")) return;

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok && response.headers.get("Cache-Control")?.includes("no-store") !== true) {
                        const copy = response.clone();
                        void caches.open(CACHE_NAME).then(cache => cache.put(SHELL_INDEX, copy));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(SHELL_INDEX))),
        );
        return;
    }

    // Cache only app assets; skip APIs and dynamic content even if same-origin.
    if (!/\.(?:css|js|mjs|svg|png|jpe?g|webp|ico|woff2?|ttf|webmanifest|geojson)$/i.test(url.pathname)) return;

    event.respondWith(
        caches.match(request).then(cached => {
            const update = fetch(request)
                .then(response => {
                    if (response.ok && response.headers.get("Cache-Control")?.includes("no-store") !== true) {
                        const copy = response.clone();
                        void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(error => {
                    if (cached) return cached;
                    throw error;
                });
            return cached || update;
        }),
    );
});
