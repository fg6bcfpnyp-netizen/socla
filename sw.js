// SoCla Offline-Speicher (Version 20261110-193623). Holt Dateien aus dem Internet, wenn möglich, sonst aus dem Speicher des Tablets.
const SPEICHER = "socla-20261110-193623";
const DATEIEN = ["./", "index.html", "js/daten.js", "js/grafik.js", "js/spiel.js", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png"];
self.addEventListener("install", e => {   // jede Datei einzeln, damit eine fehlende Datei nicht alles verhindert
  e.waitUntil(caches.open(SPEICHER).then(c => Promise.all(DATEIEN.map(d => c.add(d).catch(() => null)))));
  self.skipWaiting();
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(alle => Promise.all(alle.filter(k => k.startsWith("socla-") && k !== SPEICHER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(fetch(e.request).then(antwort => {
    const kopie = antwort.clone(); caches.open(SPEICHER).then(c => c.put(e.request, kopie)); return antwort;
  }).catch(() => caches.match(e.request, {ignoreSearch: true})));
});
