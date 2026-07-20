import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!token) return json({ ok: false, erro: "Sessão não informada." }, 401);

  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authData.user) return json({ ok: false, erro: "Sessão inválida." }, 401);

  const { id: idTexto } = await context.params;
  const ocorrenciaId = Number(idTexto);
  if (!Number.isSafeInteger(ocorrenciaId) || ocorrenciaId <= 0) {
    return json({ ok: false, erro: "Ocorrência inválida." }, 400);
  }

  const { data: usuario } = await supabaseAdmin
    .from("usuarios")
    .select("id, perfil, status, municipio_id")
    .eq("auth_id", authData.user.id)
    .maybeSingle();

  if (!usuario || String(usuario.status || "").toUpperCase() !== "ATIVO") {
    return json({ ok: false, erro: "Usuário sem acesso ativo." }, 403);
  }

  const { data: ocorrencia, error: ocorrenciaError } = await supabaseAdmin
    .from("ocorrencias")
    .select("id, municipio_id, protocolo")
    .eq("id", ocorrenciaId)
    .maybeSingle();

  if (ocorrenciaError || !ocorrencia) return json({ ok: false, erro: "Ocorrência não encontrada." }, 404);

  const desenvolvedor = String(usuario.perfil || "").toUpperCase() === "DESENVOLVEDOR";
  if (!desenvolvedor && Number(usuario.municipio_id) !== Number(ocorrencia.municipio_id)) {
    return json({ ok: false, erro: "Ocorrência pertence a outro município." }, 403);
  }

  const { data: existente } = await supabaseAdmin
    .from("ocorrencias_validacoes_pdf")
    .select("token, emitido_em")
    .eq("ocorrencia_id", ocorrenciaId)
    .eq("municipio_id", ocorrencia.municipio_id)
    .is("revogado_em", null)
    .order("emitido_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  let validacao = existente;
  if (!validacao) {
    const { data, error } = await supabaseAdmin
      .from("ocorrencias_validacoes_pdf")
      .insert({
        municipio_id: ocorrencia.municipio_id,
        ocorrencia_id: ocorrencia.id,
        protocolo: ocorrencia.protocolo,
        emitido_por_auth_id: authData.user.id,
        emitido_por_usuario_id: usuario.id,
      })
      .select("token, emitido_em")
      .single();
    if (error || !data) return json({ ok: false, erro: "Não foi possível gerar a validação." }, 500);
    validacao = data;
  }

  const origem = new URL(request.url).origin;
  return json({ ok: true, token: validacao.token, emitido_em: validacao.emitido_em, url: `${origem}/validar/ocorrencia/${validacao.token}` });
}
