import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabase } from "@/lib/supabase";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET() {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("*")
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({
      erro: "Nenhuma inscrição encontrada",
    });
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: data.endpoint,
        keys: {
          p256dh: data.p256dh,
          auth: data.auth,
        },
      },
      JSON.stringify({
        titulo: "SIG-GCM Brasil",
        mensagem: "🚓 Teste de notificação push funcionando!",
      })
    );

    return NextResponse.json({
      sucesso: true,
    });
  } catch (e: any) {
    return NextResponse.json({
      erro: e.message,
    });
  }
}