import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(token)) return NextResponse.json({ valido: false }, { status: 400 });

  const { data: validacao } = await supabaseAdmin
    .from("ocorrencias_validacoes_pdf")
    .select("ocorrencia_id, municipio_id, protocolo, emitido_em, revogado_em")
    .eq("token", token)
    .maybeSingle();

  if (!validacao || validacao.revogado_em) return NextResponse.json({ valido: false }, { status: 404 });

  const [{ data: ocorrencia }, { data: municipio }] = await Promise.all([
    supabaseAdmin.from("ocorrencias").select("protocolo, tipo, status, data, hora").eq("id", validacao.ocorrencia_id).eq("municipio_id", validacao.municipio_id).maybeSingle(),
    supabaseAdmin.from("municipios").select("nome, estado, nome_guarda, nome_corporacao").eq("id", validacao.municipio_id).maybeSingle(),
  ]);

  if (!ocorrencia) return NextResponse.json({ valido: false }, { status: 404 });

  return NextResponse.json({
    valido: true,
    protocolo: ocorrencia.protocolo || validacao.protocolo,
    tipo: ocorrencia.tipo,
    status: ocorrencia.status,
    data: ocorrencia.data,
    hora: ocorrencia.hora,
    emitido_em: validacao.emitido_em,
    municipio: municipio?.nome || "Município não identificado",
    estado: municipio?.estado || null,
    corporacao: municipio?.nome_guarda || municipio?.nome_corporacao || "Guarda Civil Municipal",
  }, { headers: { "Cache-Control": "no-store" } });
}
