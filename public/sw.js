const CACHE_NAME = "atlas-shell-v1";
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

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();
                        void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(async () => (await caches.match(request)) || (await caches.match("./index.html"))),
        );
        return;
    }

    if (url.pathname.includes("/rest/") || url.pathname.includes("/auth/")) return;

    event.respondWith(
        caches.match(request).then(cached => {
            const update = fetch(request)
                .then(response => {
                    if (response.ok) {
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
