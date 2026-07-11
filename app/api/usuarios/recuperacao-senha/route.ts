import { NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  autenticarGestorRecuperacao,
  responder,
} from "@/lib/seguranca/recuperacaoSenha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SolicitacaoBanco = {
  id: number;
  municipio_id: number;
  nome: string | null;
  email: string | null;
  cpf: string | null;
  telefone: string | null;
  navegador: string | null;
  dispositivo: string | null;
  observacao: string | null;
  motivo_negativa: string | null;
  status: string | null;
  criado_em: string;
  analisado_em: string | null;
  link_enviado_em: string | null;
  documento_url: string | null;
  selfie_url: string | null;
};

function mascararCpf(valor: string | null) {
  const numeros = String(valor || "").replace(/\D/g, "");

  if (numeros.length !== 11) return "";

  return `***.***.***-${numeros.slice(-2)}`;
}

function normalizarStatus(
  valor: string | null
): "PENDENTE" | "APROVADA" | "NEGADA" {
  const status = String(valor || "").toUpperCase();

  if (status === "APROVADA" || status === "NEGADA") {
    return status;
  }

  return "PENDENTE";
}

export async function GET(request: NextRequest) {
  try {
    const autorizacao =
      await autenticarGestorRecuperacao(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const gestor = autorizacao.gestor;

    let query = supabaseAdmin
      .from("solicitacoes_recuperacao_senha")
      .select(
        "id,municipio_id,nome,email,cpf,telefone,navegador,dispositivo,observacao,motivo_negativa,status,criado_em,analisado_em,link_enviado_em,documento_url,selfie_url"
      )
      .order("criado_em", { ascending: false })
      .limit(200);

    if (gestor.perfil !== "DESENVOLVEDOR") {
      query = query.eq(
        "municipio_id",
        gestor.usuario.municipio_id
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error(
        `Erro ao listar recuperações: ${error.message} | code=${error.code}`
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível carregar as solicitações.",
        },
        500
      );
    }

    const solicitacoes = ((data || []) as SolicitacaoBanco[]).map(
      (item) => ({
        id: Number(item.id),
        municipio_id: Number(item.municipio_id),
        nome: item.nome || "",
        email: item.email || "",
        cpf_mascarado: mascararCpf(item.cpf),
        telefone: item.telefone || "",
        navegador: item.navegador || "",
        dispositivo: String(item.dispositivo || "").slice(0, 500),
        observacao: item.observacao || "",
        motivo_negativa: item.motivo_negativa || "",
        status: normalizarStatus(item.status),
        criado_em: item.criado_em,
        analisado_em: item.analisado_em || null,
        link_enviado_em: item.link_enviado_em || null,
        documento_disponivel: Boolean(item.documento_url),
        selfie_disponivel: Boolean(item.selfie_url),
      })
    );

    return responder(
      {
        ok: true,
        solicitacoes,
      },
      200
    );
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error(
      `Erro inesperado ao carregar recuperações: ${mensagem}`
    );

    return responder(
      {
        ok: false,
        erro: "Erro interno ao carregar as solicitações.",
      },
      500
    );
  }
}
