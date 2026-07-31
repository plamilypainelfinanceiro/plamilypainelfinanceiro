// Service worker do Plamily — cuida só do "shell" do app (pra poder abrir
// mesmo sem internet) e da instalação. Não interfere no login do Firebase
// nem nos dados, que continuam sempre buscados direto da rede.

const CACHE_NAME = "plamily-shell-v2";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: tenta a rede primeiro (pra sempre pegar a versão mais nova
// do app e evitar login com dados antigos); se não tiver internet, cai
// pro que estiver em cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // não mexe em CDN externa (React, Firebase, fontes)

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
