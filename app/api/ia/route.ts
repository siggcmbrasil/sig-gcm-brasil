import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { pergunta, usuario } = await req.json();

    if (!pergunta) {
      return NextResponse.json({ erro: "Digite uma pergunta." }, { status: 400 });
    }

    const resposta = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
Você é a IA Operacional do SIG-GCM Brasil.

Usuário:
Nome: ${usuario?.nome || "Não informado"}
Perfil: ${usuario?.perfil || "Não informado"}

Responda de forma curta, objetiva e profissional.
Não invente dados do sistema.

Pergunta:
${pergunta}
      `,
    });

    return NextResponse.json({
      resposta: resposta.text || "Não consegui gerar uma resposta.",
    });
  } catch (error) {
    console.error("ERRO IA:", error);

    return NextResponse.json(
      { erro: "A IA demorou ou falhou. Tente novamente com uma pergunta mais curta." },
      { status: 500 }
    );
  }
}