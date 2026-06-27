import { NextResponse } from "next/server";
import { processarMensagemSIGIA } from "@/lib/sigia/core/brain";

export async function POST(req: Request) {
  try {
    const { mensagem, usuario } = await req.json();

    if (!mensagem) {
      return NextResponse.json({
        resposta: "Informe uma mensagem para a SIGIA analisar.",
      });
    }

    const resultado = await processarMensagemSIGIA({
      mensagem: String(mensagem),
      usuario,
    });

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Erro na SIGIA:", error);

    return NextResponse.json(
      {
        resposta: "Erro interno ao processar a solicitação da SIGIA.",
      },
      { status: 500 }
    );
  }
}