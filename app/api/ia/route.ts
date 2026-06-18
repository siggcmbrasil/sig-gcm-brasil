import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const { pergunta, usuario, modo } = await req.json();

    if (!pergunta) {
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

    const municipioId = usuario?.municipio_id || 1;

    let custo = 1;

    switch (modo) {
      case "operacional":
        custo = 2;
        break;
      case "juridica":
        custo = 3;
        break;
      case "relatorio":
        custo = 5;
        break;
      default:
        custo = 1;
    }

    const { data: creditoAtual, error: erroCredito } = await supabaseAdmin
      .from("ia_creditos_municipio")
      .select("*")
      .eq("municipio_id", municipioId)
      .single();

    if (erroCredito || !creditoAtual) {
      return NextResponse.json(
        { erro: "Município sem configuração de créditos de IA." },
        { status: 400 }
      );
    }

    if (creditoAtual.saldo < custo) {
      return NextResponse.json(
        { erro: "Créditos de IA insuficientes." },
        { status: 400 }
      );
    }

    const prompt = `
Você é a IA do SIG-GCM Brasil.

Modo da consulta:
${modo || "geral"}

Usuário:
Nome: ${usuario?.nome || "Não informado"}
Perfil: ${usuario?.perfil || "Não informado"}

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
${pergunta}
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

    const saldoAntes = creditoAtual.saldo;
    const saldoDepois = saldoAntes - custo;

    await supabaseAdmin
      .from("ia_creditos_municipio")
      .update({
        saldo: saldoDepois,
        atualizado_em: new Date().toISOString(),
      })
      .eq("municipio_id", municipioId);

    await supabaseAdmin.from("ia_creditos_historico").insert({
      municipio_id: municipioId,
      usuario_id: usuario?.id || null,
      tipo_acao: modo || "geral",
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
        erro: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}