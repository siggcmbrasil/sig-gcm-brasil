import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { pergunta } = await req.json();

    if (!pergunta) {
      return NextResponse.json(
        { erro: "Pergunta obrigatória" },
        { status: 400 }
      );
    }

    const palavras = pergunta
      .toLowerCase()
      .split(" ")
      .filter((p: string) => p.length > 3)
      .slice(0, 5);

    const termoBusca = palavras.join(" | ");

    const { data: trechos, error } = await supabaseAdmin
      .from("sigia_conhecimento")
      .select("titulo, conteudo, categoria, pagina, numero_trecho")
      .eq("status", "ATIVO")
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
      trechos,
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