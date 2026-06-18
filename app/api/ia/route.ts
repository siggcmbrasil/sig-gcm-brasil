import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { pergunta, usuario, modo } = await req.json();

    if (!pergunta) {
      return NextResponse.json(
        { erro: "Digite uma pergunta." },
        { status: 400 }
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

    const { data: creditoAtual, error: erroCredito } =
      await supabaseAdmin
        .from("ia_creditos_municipio")
        .select("*")
        .eq("municipio_id", municipioId)
        .single();

    if (erroCredito || !creditoAtual) {
      return NextResponse.json(
        {
          erro: "Município sem configuração de créditos de IA.",
        },
        { status: 400 }
      );
    }

    if (creditoAtual.saldo < custo) {
      return NextResponse.json(
        {
          erro: "Créditos de IA insuficientes.",
        },
        { status: 400 }
      );
    }

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Você é a IA do SIG-GCM Brasil.

Modo da consulta:
${modo || "geral"}

Usuário:
Nome: ${usuario?.nome || "Não informado"}
Perfil: ${usuario?.perfil || "Não informado"}

Responda de forma profissional.
Não invente dados do sistema.
Quando for modo operacional, auxilie na elaboração de ocorrências.
Quando for modo jurídica, responda de forma orientativa.

Pergunta:
${pergunta}
      `,
    });

    const saldoAntes = creditoAtual.saldo;
    const saldoDepois = saldoAntes - custo;

    await supabaseAdmin
      .from("ia_creditos_municipio")
      .update({
        saldo: saldoDepois,
        atualizado_em: new Date().toISOString(),
      })
      .eq("municipio_id", municipioId);

    await supabaseAdmin
      .from("ia_creditos_historico")
      .insert({
        municipio_id: municipioId,
        usuario_id: usuario?.id || null,
        tipo_acao: modo || "geral",
        creditos_usados: custo,
        saldo_antes: saldoAntes,
        saldo_depois: saldoDepois,
      });

    return NextResponse.json({
      resposta:
        resposta.text || "Não consegui gerar uma resposta.",
      creditos_restantes: saldoDepois,
      creditos_usados: custo,
    });
  } catch (error) {
    console.error("ERRO IA:", error);

    return NextResponse.json(
      {
        erro: "A IA demorou ou falhou. Tente novamente.",
      },
      { status: 500 }
    );
  }
}