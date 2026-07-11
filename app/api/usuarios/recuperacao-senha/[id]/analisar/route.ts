import { createClient } from "@supabase/supabase-js";
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

type SolicitacaoBanco = {
  id: number;
  municipio_id: number;
  nome: string | null;
  email: string | null;
  cpf: string | null;
  status: string | null;
};

type UsuarioBanco = {
  id: number;
  auth_id: string | null;
  nome: string;
  email: string | null;
  cpf: string | null;
  status: string | null;
  municipio_id: number | null;
};

function somenteNumeros(valor: string | null) {
  return String(valor || "").replace(/\D/g, "");
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function origemPermitida(request: NextRequest) {
  const configurada = String(
    process.env.NEXT_PUBLIC_SITE_URL || ""
  )
    .trim()
    .replace(/\/+$/, "");

  if (configurada) {
    return configurada;
  }

  return request.nextUrl.origin.replace(/\/+$/, "");
}

function criarClientePublicoSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variáveis públicas do Supabase não foram configuradas."
    );
  }

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function reverterAprovacao(
  solicitacaoId: number,
  gestorId: number,
  analisadoEm: string
) {
  return supabaseAdmin
    .from("solicitacoes_recuperacao_senha")
    .update({
      status: "PENDENTE",
      analisado_por: null,
      analisado_em: null,
      link_enviado_por: null,
      link_enviado_em: null,
      observacao: null,
      motivo_negativa: null,
    })
    .eq("id", solicitacaoId)
    .eq("status", "APROVADA")
    .eq("analisado_por", gestorId)
    .eq("analisado_em", analisadoEm);
}

export async function POST(
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

    const corpo = (await request.json().catch(() => null)) as {
      acao?: string;
      motivo?: string;
    } | null;

    const acao = String(corpo?.acao || "").toUpperCase();
    const motivo = String(corpo?.motivo || "").trim();

    if (acao !== "APROVAR" && acao !== "NEGAR") {
      return responder(
        {
          ok: false,
          erro: "Ação inválida.",
        },
        400
      );
    }

    if (
      acao === "NEGAR" &&
      (motivo.length < 5 || motivo.length > 500)
    ) {
      return responder(
        {
          ok: false,
          erro: "Informe um motivo entre 5 e 500 caracteres.",
        },
        422
      );
    }

    const { data, error } = await supabaseAdmin
      .from("solicitacoes_recuperacao_senha")
      .select("id,municipio_id,nome,email,cpf,status")
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

    const solicitacao = data as SolicitacaoBanco;
    const municipioId = Number(solicitacao.municipio_id);

    if (
      !municipioPermitido(
        autorizacao.gestor,
        municipioId
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido analisar solicitação de outro município.",
        },
        403
      );
    }

    if (
      String(solicitacao.status || "").toUpperCase() !==
      "PENDENTE"
    ) {
      return responder(
        {
          ok: false,
          erro: "Esta solicitação já foi analisada.",
        },
        409
      );
    }

    const email = String(solicitacao.email || "")
      .trim()
      .toLowerCase();

    if (!emailValido(email)) {
      return responder(
        {
          ok: false,
          erro: "A solicitação não possui um e-mail válido.",
        },
        422
      );
    }

    const { data: usuarioData, error: usuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .select(
          "id,auth_id,nome,email,cpf,status,municipio_id"
        )
        .eq("municipio_id", municipioId)
        .eq("email", email)
        .maybeSingle();

    if (usuarioError || !usuarioData) {
      return responder(
        {
          ok: false,
          erro: "Não existe usuário institucional correspondente a esta solicitação.",
        },
        422
      );
    }

    const usuario = usuarioData as UsuarioBanco;

    if (!usuario.auth_id) {
      return responder(
        {
          ok: false,
          erro: "O usuário não possui vínculo com o Supabase Auth.",
        },
        422
      );
    }

    const cpfSolicitacao = somenteNumeros(solicitacao.cpf);
    const cpfUsuario = somenteNumeros(usuario.cpf);

    if (
      cpfSolicitacao &&
      cpfUsuario &&
      cpfSolicitacao !== cpfUsuario
    ) {
      return responder(
        {
          ok: false,
          erro: "O CPF informado não corresponde ao usuário cadastrado.",
        },
        422
      );
    }

    const {
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.admin.getUserById(
      usuario.auth_id
    );

    const emailAuth = String(
      authData?.user?.email || ""
    )
      .trim()
      .toLowerCase();

    if (
      authError ||
      !authData?.user ||
      emailAuth !== email
    ) {
      return responder(
        {
          ok: false,
          erro: "A conta de autenticação não corresponde à solicitação.",
        },
        422
      );
    }

    const { error: logInicioError } =
      await registrarLogRecuperacao(
        request,
        autorizacao.gestor,
        municipioId,
        acao === "APROVAR"
          ? "RECUPERACAO_APROVAR_INICIAR"
          : "RECUPERACAO_NEGAR_INICIAR"
      );

    if (logInicioError) {
      console.error(
        `Auditoria inicial falhou: ${logInicioError.message}`
      );

      return responder(
        {
          ok: false,
          erro: "A solicitação não foi alterada porque a auditoria falhou.",
        },
        500
      );
    }

    const analisadoEm = new Date().toISOString();
    const gestorId = autorizacao.gestor.usuario.id;

    if (acao === "NEGAR") {
      const { data: atualizada, error: updateError } =
        await supabaseAdmin
          .from("solicitacoes_recuperacao_senha")
          .update({
            status: "NEGADA",
            analisado_por: gestorId,
            analisado_em: analisadoEm,
            motivo_negativa: motivo,
            observacao: motivo,
          })
          .eq("id", solicitacaoId)
          .eq("status", "PENDENTE")
          .select("id")
          .maybeSingle();

      if (updateError || !atualizada) {
        return responder(
          {
            ok: false,
            erro: "A solicitação foi alterada por outro usuário. Atualize a página.",
          },
          409
        );
      }

      const { error: logFinalError } =
        await registrarLogRecuperacao(
          request,
          autorizacao.gestor,
          municipioId,
          "RECUPERACAO_NEGADA"
        );

      if (logFinalError) {
        console.error(
          `Auditoria final da negativa falhou: ${logFinalError.message}`
        );

        return responder(
          {
            ok: true,
            mensagem: "Solicitação negada.",
            aviso:
              "A negativa foi salva, mas o registro final de auditoria falhou.",
          },
          200
        );
      }

      return responder(
        {
          ok: true,
          mensagem: "Solicitação negada com sucesso.",
        },
        200
      );
    }

    const statusUsuario = String(
      usuario.status || ""
    ).toUpperCase();

    if (!["ATIVO", "BLOQUEADO"].includes(statusUsuario)) {
      return responder(
        {
          ok: false,
          erro: "Somente usuários ATIVOS ou BLOQUEADOS podem redefinir a senha.",
        },
        422
      );
    }

    const { data: atualizada, error: updateError } =
      await supabaseAdmin
        .from("solicitacoes_recuperacao_senha")
        .update({
          status: "APROVADA",
          analisado_por: gestorId,
          analisado_em: analisadoEm,
          link_enviado_por: gestorId,
          link_enviado_em: analisadoEm,
          motivo_negativa: null,
          observacao:
            "Identidade conferida. Link de redefinição autorizado.",
        })
        .eq("id", solicitacaoId)
        .eq("status", "PENDENTE")
        .select("id")
        .maybeSingle();

    if (updateError || !atualizada) {
      return responder(
        {
          ok: false,
          erro: "A solicitação foi alterada por outro usuário. Atualize a página.",
        },
        409
      );
    }

    const supabasePublico = criarClientePublicoSupabase();
    const redirectTo = `${origemPermitida(
      request
    )}/redefinir-senha`;

    const { error: resetError } =
      await supabasePublico.auth.resetPasswordForEmail(
        emailAuth,
        {
          redirectTo,
        }
      );

    if (resetError) {
      await reverterAprovacao(
        solicitacaoId,
        gestorId,
        analisadoEm
      );

      await registrarLogRecuperacao(
        request,
        autorizacao.gestor,
        municipioId,
        "RECUPERACAO_LINK_FALHOU",
        "FALHA"
      );

      console.error(
        `Envio de recuperação falhou: ${resetError.message}`
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível enviar o link de redefinição. A solicitação voltou para PENDENTE.",
        },
        502
      );
    }

    const { error: logFinalError } =
      await registrarLogRecuperacao(
        request,
        autorizacao.gestor,
        municipioId,
        "RECUPERACAO_LINK_ENVIADO"
      );

    if (logFinalError) {
      console.error(
        `Auditoria final do link falhou: ${logFinalError.message}`
      );

      return responder(
        {
          ok: true,
          mensagem: "Link de redefinição enviado.",
          aviso:
            "O e-mail foi enviado, mas o registro final de auditoria falhou.",
        },
        200
      );
    }

    return responder(
      {
        ok: true,
        mensagem: "Link de redefinição enviado com segurança.",
      },
      200
    );
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : "Erro desconhecido";

    console.error(
      `Erro inesperado ao analisar recuperação: ${mensagem}`
    );

    return responder(
      {
        ok: false,
        erro: "Erro interno ao analisar a solicitação.",
      },
      500
    );
  }
}
