import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const token = req.headers
      .get("authorization")
      ?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { erro: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { erro: "Sessão inválida." },
        { status: 401 }
      );
    }

    const { data: usuario, error: usuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, perfil, municipio_id, status")
        .eq("auth_id", authData.user.id)
        .single();

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { erro: "Usuário não encontrado no sistema." },
        { status: 403 }
      );
    }

    if (usuario.status !== "Ativo") {
      return NextResponse.json(
        { erro: "Usuário sem permissão de acesso." },
        { status: 403 }
      );
    }

    if (!usuario.municipio_id) {
      return NextResponse.json(
        { erro: "Usuário sem município vinculado." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { endpoint, keys } = body;

    if (
      !endpoint ||
      typeof endpoint !== "string" ||
      !keys?.p256dh ||
      !keys?.auth
    ) {
      return NextResponse.json(
        { erro: "Dados de inscrição incompletos." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("push_subscriptions")
      .upsert(
        {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
          perfil: usuario.perfil,
          ativo: true,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      await supabaseAdmin.from("auditoria_sistema").insert({
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        modulo: "PUSH",
        acao: "ERRO_SALVAR_INSCRICAO",
        detalhes: error.message,
      });

      return NextResponse.json(
        { erro: "Erro ao salvar inscrição push." },
        { status: 400 }
      );
    }

    await supabaseAdmin.from("auditoria_sistema").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario.id,
      modulo: "PUSH",
      acao: "SALVAR_INSCRICAO",
      detalhes: "Inscrição push salva/atualizada.",
    });

    return NextResponse.json({
      sucesso: true,
    });
  } catch (e) {
    console.error("Erro push subscribe:", e);

    return NextResponse.json(
      { erro: "Erro ao salvar inscrição." },
      { status: 500 }
    );
  }
}