import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const CUSTOS_IA: Record<string, number> = {
  operacional: 2,
  juridica: 3,
  relatorio: 5,
  geral: 1,
};

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

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

    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .select("id, nome, perfil, municipio_id, status")
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

    const { pergunta, modo } = await req.json();

    if (!pergunta || String(pergunta).trim().length < 2) {
      return NextResponse.json(
        { erro: "Digite uma pergunta." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { erro: "GEMINI_API_KEY não configurada." },
        { status: 500 }
      );
    }

    const modoFinal = String(modo || "geral").toLowerCase();
    const custo = CUSTOS_IA[modoFinal] || 1;
    const municipioId = Number(usuario.municipio_id);

    const { data: creditoAtual, error: erroCredito } = await supabaseAdmin
      .from("ia_creditos_municipio")
      .select("municipio_id, saldo")
      .eq("municipio_id", municipioId)
      .single();

    if (erroCredito || !creditoAtual) {
      return NextResponse.json(
        { erro: "Município sem configuração de créditos de IA." },
        { status: 400 }
      );
    }

    if (Number(creditoAtual.saldo) < custo) {
      return NextResponse.json(
        { erro: "Créditos de IA insuficientes." },
        { status: 400 }
      );
    }

    const saldoAntes = Number(creditoAtual.saldo);
    const saldoDepois = saldoAntes - custo;

    const prompt = `
Você é a IA do SIG-GCM Brasil.

Modo da consulta:
${modoFinal}

Usuário:
Nome: ${usuario.nome || "Não informado"}
Perfil: ${usuario.perfil || "Não informado"}

REGRAS GERAIS:
- Responda de forma profissional, objetiva e útil.
- Não invente dados do sistema.
- Não substitua decisão do servidor responsável.
- Quando houver dúvida jurídica, deixe claro que é orientação operacional.

SE O MODO FOR "operacional":
Você deve auxiliar o guarda a preencher ocorrências.
Ajude a organizar relatos, corrigir texto, sugerir natureza e providências.
Use linguagem formal de relatório da Guarda Municipal.

SE O MODO FOR "juridica":
Você é a IA Jurídica Operacional da Guarda Municipal.
Seu público são Guardas Municipais, Comandantes, Diretores e Plantonistas.
Nunca responda como advogado particular para cidadão comum.
Nunca foque em seguradora, indenização ou processo particular.
Priorize a atuação da Guarda Municipal.

Sempre que possível, organize a resposta com:
1. Natureza da situação
2. Possível enquadramento legal
3. Competência da Guarda Municipal
4. Procedimentos operacionais recomendados
5. Cuidados legais
6. Observação final

Use como base:
- Constituição Federal, art. 144, §8º
- Lei Federal 13.022/2014
- Código Penal
- Código de Processo Penal
- CTB
- ECA
- Lei Maria da Penha
- Legislação municipal, quando aplicável

Pergunta:
${String(pergunta).trim()}
`;

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const geminiData = await geminiRes.json();

    if (!geminiRes.ok) {
      return NextResponse.json(
        {
          erro:
            geminiData?.error?.message ||
            "Erro ao consultar a IA do Gemini.",
        },
        { status: 500 }
      );
    }

    const textoResposta =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Não consegui gerar uma resposta.";

    const { data: saldoAtualizado, error: erroAtualizarSaldo } = await supabaseAdmin
  .from("ia_creditos_municipio")
  .update({
    saldo: saldoDepois,
    atualizado_em: new Date().toISOString(),
  })
  .eq("municipio_id", municipioId)
  .eq("saldo", saldoAntes)
  .select("saldo")
  .single();

if (erroAtualizarSaldo || !saldoAtualizado) {
  return NextResponse.json(
    { erro: "Não foi possível atualizar os créditos de IA." },
    { status: 409 }
  );
}

    await supabaseAdmin.from("ia_creditos_historico").insert({
      municipio_id: municipioId,
      usuario_id: usuario.id,
      tipo_acao: modoFinal,
      creditos_usados: custo,
      saldo_antes: saldoAntes,
      saldo_depois: saldoDepois,
    });

    return NextResponse.json({
      resposta: textoResposta,
      creditos_restantes: saldoDepois,
      creditos_usados: custo,
    });
  } catch (error: any) {
    console.error("ERRO IA:", error);

    return NextResponse.json(
      {
        erro: "Erro interno ao consultar a IA.",
      },
      { status: 500 }
    );
  }
}