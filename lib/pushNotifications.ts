import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";

export async function iniciarPushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    console.log("Push Notifications funcionam apenas no app nativo.");
    return;
  }

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  if (!usuario?.id || !usuario?.municipio_id) {
    console.log("Usuário não identificado para push.");
    return;
  }

  let permissao = await PushNotifications.checkPermissions();

  if (permissao.receive !== "granted") {
    permissao = await PushNotifications.requestPermissions();
  }

  if (permissao.receive !== "granted") {
    console.log("Permissão de notificação negada.");
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    const { error } = await supabase.from("push_tokens").upsert(
      {
        municipio_id: usuario.municipio_id,
        usuario_id: String(usuario.id),
        token: token.value,
        plataforma: "android",
        ativo: true,
      },
      {
        onConflict: "usuario_id,token",
      }
    );

    if (error) {
      console.error("Erro ao salvar token push:", error);
      return;
    }

    console.log("Token push salvo com sucesso.");
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error("Erro ao registrar push:", error);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("Notificação recebida:", notification);
  });

  PushNotifications.addListener("pushNotificationActionPerformed", (notification) => {
    console.log("Notificação clicada:", notification);
  });
}