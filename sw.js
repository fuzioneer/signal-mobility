/* Signal Mobility service worker: app shell offline, pose model cached after first use. */
const VER = "sm-1.20.0";
const SHELL = ["./", "index.html", "styles.css", "app.js", "data.js", "figure.js", "pose.js", "music.js", "clips.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "photos.js", "i18n.js", "strava.js", "lang-es.js", "lang-fr.js", "lang-de.js", "lang-it.js", "lang-pt.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER && k !== "sm-cdn" && k !== "sm-photos").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  /* Stretch photos (Higgsfield CDN): keep a copy after first view so they work offline. */
  if (u.hostname.endsWith(".cloudfront.net")) {
    e.respondWith(caches.open("sm-photos").then(async c => { const hit = await c.match(e.request.url, { ignoreVary: true }); if (hit) return hit; const r = await fetch(e.request); if (r.ok || r.type === "opaque") c.put(e.request.url, r.clone()); return r; }));
    return;
  }
  if (u.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.open("sm-cdn").then(async c => { const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }));
    return;
  }
  if (u.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(h => h || caches.match("index.html"))));
  }
});
/* Tapping a reminder notification opens the app on that routine. */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { for (const c of cs) { if ("focus" in c) { c.navigate(url).catch(() => {}); return c.focus(); } } return self.clients.openWindow(url); }));
});
