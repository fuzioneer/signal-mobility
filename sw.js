/* Signal Mobility service worker: app shell offline, pose model cached after first use. */
const VER = "sm-1.10.1";
const SHELL = ["./", "index.html", "styles.css", "app.js", "data.js", "figure.js", "pose.js", "music.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "audio/cd-f-3.wav", "audio/cd-f-2.wav", "audio/cd-f-1.wav", "audio/cd-m-3.wav", "audio/cd-m-2.wav", "audio/cd-m-1.wav"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER && k !== "sm-cdn").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (u.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.open("sm-cdn").then(async c => { const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(h => h || caches.match("index.html"))));
  }
});
