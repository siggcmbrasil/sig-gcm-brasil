import { NextResponse } from "next/server";
import { processarMensagemSIGIA } from "@/lib/sigia/core/brain";

type ContextoSIGIA = {
  data?: string;
  hora?: string;
  usuario_nome?: string;
  perfil?: string;
  municipio_id?: number | null;
};

type AnexoSIGIA = {
  nome?: string;
  tipo?: string;
  tamanho?: number;
  conteudo_texto?: string;
};

type ItemHistoricoSIGIA = {
  autor: string;
  texto: string;
};

type CorpoRequisicaoSIGIA = {
  mensagem?: string;
  usuario?: {
    id?: string;
    nome?: string;
    email?: string;
    perfil?: string;
    municipio_id?: number;
  };
  contexto?: ContextoSIGIA;
  anexo?: AnexoSIGIA | null;
  historico?: ItemHistoricoSIGIA[];
};

export async function POST(req: Request) {
  try {
    const body =
      (await req.json()) as CorpoRequisicaoSIGIA;

    const {
      mensagem,
      usuario,
      contexto,
      anexo,
      historico,
    } = body;

    const mensagemNormalizada =
      String(mensagem || "").trim();

    if (
      !mensagemNormalizada &&
      !anexo
    ) {
      return NextResponse.json(
        {
          resposta:
            "Informe uma mensagem ou envie um arquivo para a SIGIA analisar.",
        },
        { status: 400 }
      );
    }

    if (
      !usuario?.id ||
      !usuario?.municipio_id
    ) {
      return NextResponse.json(
        {
          resposta:
            "Usuário inválido ou município não identificado. Faça login novamente.",
        },
        { status: 401 }
      );
    }

    const contextoOperacional = `
CONTEXTO OPERACIONAL

Data:
${contexto?.data || new Date().toLocaleDateString("pt-BR")}

Hora:
${contexto?.hora || new Date().toLocaleTimeString("pt-BR")}

Usuário:
${contexto?.usuario_nome || usuario.nome || "Não informado"}

Perfil:
${contexto?.perfil || usuario.perfil || "Não informado"}

Município:
${contexto?.municipio_id || usuario.municipio_id}

INSTRUÇÕES

Responda sempre em português do Brasil.

Use linguagem clara, profissional, natural e operacional.

Não invente nomes, documentos, placas, endereços, datas, leis ou fatos.

Quando houver informações suficientes para estruturar uma ocorrência, organize os dados usando apenas os campos efetivamente informados:

Tipo:
Nome:
Qualificação:
CPF:
Telefone:
Endereço:
Bairro:
Local:
Número:
Placa:
Marca:
Modelo:
Cor:
Ano:

Depois dos campos estruturados, escreva uma narrativa operacional objetiva e adequada para registro de ocorrência.

Quando faltarem informações essenciais, faça perguntas curtas e específicas.
`.trim();

    const contextoHistorico =
      Array.isArray(historico) &&
      historico.length > 0
        ? `
HISTÓRICO RECENTE DA CONVERSA

${historico
  .slice(-10)
  .map((item) => {
    const autor =
      item.autor === "usuario"
        ? "USUÁRIO"
        : "SIGIA";

    const textoItem =
      String(item.texto || "")
        .trim()
        .slice(0, 3000);

    return `${autor}:\n${textoItem}`;
  })
  .join("\n\n")}
`.trim()
        : "";

    const contextoAnexo = anexo
      ? `
ARQUIVO ANEXADO

Nome:
${anexo.nome || "Não informado"}

Tipo:
${anexo.tipo || "Não informado"}

Tamanho:
${Number(anexo.tamanho || 0)} bytes

CONTEÚDO EXTRAÍDO:

${
  anexo.conteudo_texto?.trim()
    ? anexo.conteudo_texto
        .trim()
        .slice(0, 20000)
    : "Não foi possível extrair conteúdo textual desse arquivo nesta etapa."
}
`.trim()
      : "";

    const mensagemCompleta = `
${contextoOperacional}

${contextoHistorico}

${contextoAnexo}

SOLICITAÇÃO ATUAL DO USUÁRIO

${
  mensagemNormalizada ||
  "Analise o arquivo anexado e informe os dados relevantes."
}
`.trim();

    const resultado =
      await processarMensagemSIGIA({
        mensagem: mensagemCompleta,
        usuario: {
          id: usuario.id,
          nome: usuario.nome || "",
          email: usuario.email || "",
          perfil: usuario.perfil || "",
          municipio_id:
            usuario.municipio_id,
        },
      });

    return NextResponse.json(
      resultado
    );
  } catch (error) {
    console.error(
      "Erro na API da SIGIA:",
      error
    );

    return NextResponse.json(
      {
        resposta:
          "Erro interno ao processar a solicitação da SIGIA.",
      },
      { status: 500 }
    );
  }
}