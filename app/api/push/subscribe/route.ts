import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      endpoint,
      keys,
      municipio_id,
      usuario_id,
      perfil,
    } = body;

if (!endpoint || !keys?.p256dh || !keys?.auth || !municipio_id || !usuario_id) {
  return NextResponse.json(
    { erro: "Dados de inscrição incompletos." },
    { status: 400 }
  );
}

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        municipio_id,
        usuario_id,
        perfil,
        ativo: true,
atualizado_em: new Date().toISOString(),
      });

    if (error) {
      return NextResponse.json(
        { erro: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sucesso: true,
    });
  } catch (e) {
    return NextResponse.json(
      { erro: "Erro ao salvar inscrição" },
      { status: 500 }
    );
  }
}