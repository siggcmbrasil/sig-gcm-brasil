import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    const resposta = await client.responses.create({
      model: "gpt-5.5",
      input: `
Você é uma IA auxiliar de um sistema da Guarda Civil Municipal.

Responda de forma profissional, objetiva e clara.
Ajude em consultas, relatórios, ocorrências, patrulhamento, chamados e análise de plantão.

Pergunta do usuário:
${pergunta}
      `,
    });

    return NextResponse.json({
      resposta: resposta.output_text,
    });
  } catch (error) {
    return NextResponse.json(
      { erro: "Erro ao consultar a IA." },
      { status: 500 }
    );
  }
}