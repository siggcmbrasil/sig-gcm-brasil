self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};

  const titulo = data.titulo || "SIG-GCM Brasil";
  const opcoes = {
    body: data.mensagem || "Nova notificação do sistema.",
    icon: "/brasao-gcm-v2.png",
    badge: "/brasao-gcm-v2.png",
  };

  event.waitUntil(
    self.registration.showNotification(titulo, opcoes)
  );
});