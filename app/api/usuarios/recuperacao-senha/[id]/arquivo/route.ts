import { NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  autenticarGestorRecuperacao,
  municipioPermitido,
  registrarLogRecuperacao,
  responder,
} from "@/lib/seguranca/recuperacaoSenha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SolicitacaoArquivo = {
  id: number;
  municipio_id: number;
  documento_url: string | null;
  selfie_url: string | null;
};

function caminhoSeguro(valor: string) {
  const caminho = valor.trim();

  return (
    caminho.length > 0 &&
    caminho.length <= 500 &&
    !caminho.includes("..") &&
    !caminho.startsWith("/") &&
    !/^https?:\/\//i.test(caminho)
  );
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const autorizacao =
      await autenticarGestorRecuperacao(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const { id } = await context.params;
    const solicitacaoId = Number(id);
    const tipo = request.nextUrl.searchParams.get("tipo");

    if (
      !Number.isSafeInteger(solicitacaoId) ||
      solicitacaoId <= 0
    ) {
      return responder(
        {
          ok: false,
          erro: "Solicitação inválida.",
        },
        400
      );
    }

    if (tipo !== "documento" && tipo !== "selfie") {
      return responder(
        {
          ok: false,
          erro: "Tipo de arquivo inválido.",
        },
        400
      );
    }

    const { data, error } = await supabaseAdmin
      .from("solicitacoes_recuperacao_senha")
      .select("id,municipio_id,documento_url,selfie_url")
      .eq("id", solicitacaoId)
      .maybeSingle();

    if (error || !data) {
      return responder(
        {
          ok: false,
          erro: "Solicitação não encontrada.",
        },
        404
      );
    }

    const item = data as SolicitacaoArquivo;
    const municipioId = Number(item.municipio_id);

    if (
      !municipioPermitido(
        autorizacao.gestor,
        municipioId
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido acessar arquivo de outro município.",
        },
        403
      );
    }

    const caminho =
      tipo === "documento"
        ? item.documento_url
        : item.selfie_url;

    if (!caminho || !caminhoSeguro(caminho)) {
      return responder(
        {
          ok: false,
          erro: "Arquivo indisponível ou com caminho inválido.",
        },
        404
      );
    }

    const { data: arquivo, error: arquivoError } =
      await supabaseAdmin.storage
        .from("recuperacao-senha")
        .createSignedUrl(caminho, 60);

    if (arquivoError || !arquivo?.signedUrl) {
      console.error(
        `Erro ao assinar arquivo de recuperação: ${arquivoError?.message || "sem URL"}`
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível abrir o arquivo.",
        },
        500
      );
    }

    const { error: logError } =
      await registrarLogRecuperacao(
        request,
        autorizacao.gestor,
        municipioId,
        tipo === "documento"
          ? "RECUPERACAO_DOCUMENTO_VISUALIZAR"
          : "RECUPERACAO_SELFIE_VISUALIZAR"
      );

    if (logError) {
      console.error(
        `Auditoria de arquivo falhou: ${logError.message}`
      );

      return responder(
        {
          ok: false,
          erro: "O arquivo não foi liberado porque a auditoria falhou.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        signed_url: arquivo.signedUrl,
        expira_em_segundos: 60,
      },
      200
    );
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error(
      `Erro inesperado ao abrir arquivo de recuperação: ${mensagem}`
    );

    return responder(
      {
        ok: false,
        erro: "Erro interno ao abrir o arquivo.",
      },
      500
    );
  }
}
