import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/lib/supabase";

export async function ativarPushMobile(usuario: any) {
  if (!usuario?.id || !usuario?.municipio_id) {
    alert("Usuário inválido.");
    return;
  }

  const permissao = await PushNotifications.requestPermissions();

  if (permissao.receive !== "granted") {
    alert("Permissão de notificação negada.");
    return;
  }

  await PushNotifications.register();

  PushNotifications.addListener("registration", async (token) => {
    await supabase.from("push_tokens").upsert(
      {
        usuario_id: String(usuario.id),
        municipio_id: usuario.municipio_id,
        token: token.value,
        perfil: usuario.perfil || null,
        plataforma: "ANDROID",
        atualizado_em: new Date().toISOString(),
      },
      {
        onConflict: "usuario_id,token",
      }
    );

    alert("Push do celular ativado com sucesso.");
  });

  PushNotifications.addListener("registrationError", (error) => {
    console.error(error);
    alert("Erro ao registrar push no celular.");
  });
}