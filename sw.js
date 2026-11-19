/* 給与カレンダー service worker
 * アセットを更新したら CACHE_VERSION を上げてください。
 * キャッシュ名は localStorage キー (kyuyo-calendar-v1) とは別です。
 */
const CACHE_VERSION = "v1";
const CACHE_NAME = "kyuyo-cal-pwa-" + CACHE_VERSION;
const PRECACHE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.ico",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-512-maskable.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
  "./icons/favicon-16.png",
  "./icons/favicon.svg"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key.indexOf("kyuyo-cal-pwa-") === 0 && key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;
  var url;
  try { url = new URL(event.request.url); } catch (e) { return; }
  if (url.origin !== self.location.origin) return;

  var isDoc = event.request.mode === "navigate" ||
    (event.request.destination === "document") ||
    /(?:\/|index\.html)$/.test(url.pathname);

  if (isDoc) {
    event.respondWith(
      fetch(event.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, copy);
            cache.put("./index.html", res.clone());
            cache.put("./", res.clone());
          });
        }
        return res;
      }).catch(function () {
        return caches.match(event.request).then(function (cached) {
          return cached || caches.match("./index.html") || caches.match("./");
        });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, copy); });
        }
        return res;
      });
    })
  );
});
