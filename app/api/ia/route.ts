import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { pergunta } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { erro: "Chave GEMINI_API_KEY não encontrada na Vercel." },
        { status: 500 }
      );
    }

    if (!pergunta) {
      return NextResponse.json(
        { erro: "Digite uma pergunta." },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Você é uma IA auxiliar do Sistema da Guarda Civil Municipal de Biritinga.
Responda de forma profissional, clara e objetiva.

Pergunta:
${pergunta}
      `,
    });

    return NextResponse.json({
      resposta: resposta.text || "Não consegui gerar uma resposta.",
    });
  } catch (error: any) {
    console.error("ERRO GEMINI:", error);

    return NextResponse.json(
      {
        erro: error?.message || "Erro ao consultar a IA.",
      },
      { status: 500 }
    );
  }
}