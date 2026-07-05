const CACHE_NAME = "sig-gcm-offline-v1";

const URLS_TO_CACHE = [
  "/",
  "/login",
  "/sistema/offline",
  "/brasoes/sig-gcm-logo.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", function (event) {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(function () {
      return caches.match(event.request).then(function (resposta) {
        return resposta || caches.match("/sistema/offline");
      });
    })
  );
});

self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  const titulo = data.titulo || "SIG-GCM Brasil";
  const opcoes = {
    body: data.mensagem || "Nova notificação do sistema.",
    icon: "/brasoes/sig-gcm-logo.png",
    badge: "/brasoes/sig-gcm-logo.png",
  };

  event.waitUntil(
    self.registration.showNotification(titulo, opcoes)
  );
});