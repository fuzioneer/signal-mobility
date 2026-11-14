/* Movage service worker: app shell offline, pose model cached after first use. */
const VER = "sm-1.47.6";
const SHELL = ["./", "index.html", "styles.css", "app.js", "data.js", "figure.js", "pose.js", "music.js", "clips.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "img/logo-h-light.png", "img/logo-h-dark.png", "img/logo-h-dark-hd.png", "img/logo-s-light.png", "img/logo-s-dark.png", "img/logo-s-white.png", "photos.js", "videos.js", "i18n.js", "strava.js", "cloud-config.js", "cloud.js", "lang-es.js", "lang-fr.js", "lang-de.js", "lang-it.js", "lang-pt.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER && k !== "sm-cdn" && k !== "sm-photos").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  /* Stretch photos (Higgsfield CDN): keep a copy after first view so they work offline. */
  /* Demo clips go straight to the network (iPhones need range requests for video); the app plays saved copies itself. */
  if (/\.mp4$/i.test(u.pathname)) return;
  if (u.hostname.endsWith(".cloudfront.net")) {
    e.respondWith(caches.open("sm-photos").then(async c => { const hit = await c.match(e.request.url, { ignoreVary: true }); if (hit) return hit; const r = await fetch(e.request); if (r.ok || r.type === "opaque") c.put(e.request.url, r.clone()); return r; }));
    return;
  }
  if (u.hostname === "cdn.jsdelivr.net") {
    e.respondWith(caches.open("sm-cdn").then(async c => { const hit = await c.match(e.request); if (hit) return hit; const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }));
    return;
  }
  if (u.origin === location.origin) {
    /* Always check GitHub Pages for a newer copy (it lets browsers reuse files for 10 minutes otherwise); unchanged files come back as a quick 304. */
    e.respondWith(fetch(new Request(e.request.url, { cache: "no-cache", credentials: "same-origin" })).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request).then(h => h || caches.match("index.html"))));
  }
});
/* Tapping a reminder notification opens the app on that routine. */
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || "./", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(cs => { for (const c of cs) { if ("focus" in c) { c.navigate(url).catch(() => {}); return c.focus(); } } return self.clients.openWindow(url); }));
});
