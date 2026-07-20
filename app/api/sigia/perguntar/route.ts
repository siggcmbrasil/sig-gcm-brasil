import { NextRequest, NextResponse } from "next/server";

import { autenticarUsuarioApi } from "@/lib/seguranca/autenticacaoApi";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const autenticacao = await autenticarUsuarioApi(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const { pergunta } = (await request.json()) as {
      pergunta?: unknown;
    };

    const perguntaTexto = String(pergunta || "").trim();

    if (!perguntaTexto) {
      return NextResponse.json(
        { erro: "Pergunta obrigatória." },
        { status: 400 }
      );
    }

    if (perguntaTexto.length > 5000) {
      return NextResponse.json(
        { erro: "A pergunta ultrapassa o limite permitido." },
        { status: 413 }
      );
    }

    const { usuario } = autenticacao;

    if (!usuario.municipio_id && usuario.perfil !== "DESENVOLVEDOR") {
      return NextResponse.json(
        { erro: "Município não identificado." },
        { status: 422 }
      );
    }

    const palavras = perguntaTexto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((palavra) => palavra.length > 3)
      .slice(0, 8);

    if (palavras.length === 0) {
      return NextResponse.json(
        {
          sucesso: true,
          pergunta: perguntaTexto,
          encontrados: 0,
          trechos: [],
        },
        { headers: { "Cache-Control": "no-store" } }
      );
    }

    let consulta = supabaseAdmin
      .from("sigia_conhecimento")
      .select(
        "titulo,conteudo,categoria,pagina,numero_trecho,municipio_id,visibilidade,nivel_acesso"
      )
      .eq("status", "ATIVO")
      .lte("nivel_acesso", usuario.nivel_acesso)
      .textSearch("conteudo", palavras.join(" | "))
      .limit(5);

    if (usuario.perfil !== "DESENVOLVEDOR") {
      consulta = consulta.eq("municipio_id", usuario.municipio_id);
    }

    const { data: trechos, error } = await consulta;

    if (error) {
      console.error("Erro SIGIA /perguntar:", error.message);
      return NextResponse.json(
        { erro: "Erro ao consultar a base de conhecimento." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        sucesso: true,
        pergunta: perguntaTexto,
        encontrados: trechos?.length || 0,
        trechos: trechos || [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro interno SIGIA /perguntar:", error);
    return NextResponse.json(
      { erro: "Erro interno ao consultar a base de conhecimento." },
      { status: 500 }
    );
  }
}
