import { NextResponse } from "next/server";
import { processarMensagemSIGIA } from "@/lib/sigia/core/brain";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mensagem, usuario } = body;

    if (!mensagem || String(mensagem).trim() === "") {
      return NextResponse.json(
        {
          resposta: "Informe uma mensagem para a SIGIA analisar.",
        },
        { status: 400 }
      );
    }

    if (!usuario?.id || !usuario?.municipio_id) {
      return NextResponse.json(
        {
          resposta:
            "Usuário inválido ou município não identificado. Faça login novamente.",
        },
        { status: 401 }
      );
    }

   const resultado = await processarMensagemSIGIA({
  mensagem: String(mensagem).trim(),
  usuario: {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    municipio_id: usuario.municipio_id,
  },
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