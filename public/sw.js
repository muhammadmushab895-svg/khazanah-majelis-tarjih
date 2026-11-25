const SHELL_CACHE = "kmt-shell-v1";
const SHELL_ASSETS = ["/", "/icon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("/").then(
          (cached) =>
            cached ||
            new Response(
              "<!doctype html><html lang='id'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Sedang Offline — Khazanah Majelis Tarjih</title><body style='font-family:system-ui,sans-serif;background:#f7f9fc;color:#142230;display:grid;place-items:center;min-height:100vh;padding:24px;text-align:center'><div><h1 style='color:#0b4f8c;margin-bottom:8px'>Koneksi Internet Diperlukan</h1><p style='max-width:420px;line-height:1.6;color:#4f6072'>Khazanah Majelis Tarjih berjalan full online agar ringan di perangkat Anda. Silakan aktifkan koneksi internet lalu muat ulang halaman.</p></div></body></html>",
              { headers: { "Content-Type": "text/html; charset=utf-8" } }
            )
        )
      )
    );
    return;
  }

  if (
    url.origin === self.location.origin &&
    /\.(svg|png|ico|webmanifest)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
            }
            return res;
          })
      )
    );
  }
});
