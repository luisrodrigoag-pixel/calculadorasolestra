/* Service worker: deja la calculadora disponible sin conexión.
   Sube VERSION cada vez que cambies archivos para forzar la actualización. */
const VERSION = "v1";
const CACHE = "solestra-finiquito-" + VERSION;
const ARCHIVOS = [
  "./", "./index.html",
  "./assets/app.css", "./assets/app.js", "./assets/cedula-pdf.js",
  "./assets/logo.png", "./assets/logo-dark.png",
  "./data/parametros.js",
  "./vendor/jspdf.umd.min.js", "./vendor/jspdf.plugin.autotable.min.js",
  "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
        return r;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
