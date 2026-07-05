import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { pergunta, usuario } = await req.json();

    if (!pergunta || String(pergunta).trim() === "") {
      return NextResponse.json(
        { erro: "Pergunta obrigatória" },
        { status: 400 }
      );
    }

    if (!usuario?.id || !usuario?.municipio_id || !usuario?.perfil) {
      return NextResponse.json(
        { erro: "Usuário inválido. Faça login novamente." },
        { status: 401 }
      );
    }

    const nivelAcesso = Number(usuario.nivel_acesso || usuario.nivel || 40);

    const palavras = String(pergunta)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((p: string) => p.length > 3)
      .slice(0, 6);

    if (palavras.length === 0) {
      return NextResponse.json({
        sucesso: true,
        pergunta,
        encontrados: 0,
        trechos: [],
      });
    }

    const termoBusca = palavras.join(" | ");

    const { data: trechos, error } = await supabaseAdmin
      .from("sigia_conhecimento")
      .select(
        "titulo, conteudo, categoria, pagina, numero_trecho, municipio_id, visibilidade, nivel_acesso"
      )
      .eq("status", "ATIVO")
      .eq("municipio_id", usuario.municipio_id)
      .lte("nivel_acesso", nivelAcesso)
      .textSearch("conteudo", termoBusca)
      .limit(5);

    if (error) {
      return NextResponse.json(
        { erro: "Erro ao buscar conhecimento", detalhe: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      pergunta,
      encontrados: trechos?.length || 0,
      trechos: trechos || [],
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        erro: "Erro interno",
        detalhe: error.message,
      },
      { status: 500 }
    );
  }
}