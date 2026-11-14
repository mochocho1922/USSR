// オフラインでも開けるようにするための仕組み
const CACHE = "gakushu-sensen-v4";
const CORE = ["./", "index.html", "firebase-config.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "apple-touch-icon.png"];
// 保存してよい外部の場所（フォントとFirebaseの部品だけ。データ通信はさわらない）
const STATIC_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com", "www.gstatic.com"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const same = url.origin === self.location.origin;
  if (!same && !STATIC_HOSTS.includes(url.hostname)) return;
  // 自分のファイルは新しい版を優先し、つながらなければ保存した版を使う
  if (same) {
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request.mode === "navigate" ? "index.html" : e.request, c)); }
      return r;
    }).catch(() => caches.match(e.request.mode === "navigate" ? "index.html" : e.request, { ignoreSearch: true })));
    return;
  }
  // フォントとFirebaseの部品は一度保存したらそれを使う
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); }
    return r;
  })));
});
