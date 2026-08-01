// Service worker do Plamily — cuida do "shell" do app (pra poder abrir mesmo
// sem internet) e da instalação como aplicativo. Não interfere no login do
// Firebase nem nos dados, que continuam sempre buscados direto da rede.

const CACHE_NAME = "plamily-shell-v3";
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

// Estratégia: tenta a rede primeiro (pra sempre pegar a versão mais nova do app
// e evitar login com dados antigos); se não tiver internet, cai pro cache.
//
// IMPORTANTE: este handler NUNCA pode devolver "undefined". Se devolver, o
// Chrome no Android considera que o app não funciona offline e se recusa a
// oferecer a instalação como aplicativo. Por isso todo caminho aqui termina
// em uma resposta de verdade.
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
      .catch(async () => {
        // 1) tenta o próprio recurso no cache
        const cached = await caches.match(event.request);
        if (cached) return cached;

        // 2) se for uma navegação (abrir o app), devolve o index do cache
        if (event.request.mode === "navigate") {
          const shell =
            (await caches.match("./index.html")) ||
            (await caches.match("./")) ||
            (await caches.match(new URL("./index.html", self.location.href).href));
          if (shell) return shell;
        }

        // 3) último recurso: uma resposta válida, nunca "undefined"
        return new Response(
          "<!doctype html><meta charset='utf-8'><title>Plamily</title><p>Sem conexão no momento. Abra novamente quando estiver online.</p>",
          { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      })
  );
});
