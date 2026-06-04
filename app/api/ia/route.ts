import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { pergunta } = await req.json();

    if (!pergunta) {
      return NextResponse.json(
        { erro: "Digite uma pergunta." },
        { status: 400 }
      );
    }

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Você é uma IA auxiliar do Sistema da Guarda Civil Municipal de Biritinga.

Responda de forma profissional, clara e objetiva.
Ajude com relatórios, ocorrências, patrulhamento, chamados, estatísticas e textos oficiais.

Pergunta:
${pergunta}
      `,
    });

    return NextResponse.json({
      resposta: resposta.text || "Não consegui gerar uma resposta.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { erro: "Erro ao consultar a IA." },
      { status: 500 }
    );
  }
}