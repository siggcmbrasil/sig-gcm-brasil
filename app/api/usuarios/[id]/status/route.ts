import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERFIS = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
] as const;

type Perfil = (typeof PERFIS)[number];
type NovoStatus = "ATIVO" | "BLOQUEADO" | "INATIVO";

type UsuarioBanco = {
  id: number;
  auth_id: string | null;
  nome: string;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
  tentativas_login: number | null;
  cpf: string | null;
  guarda_id: number | null;
};

type ResultadoVinculo = {
  ok?: boolean;
  status?: string;
  usuario_id?: number;
  guarda_id?: number;
  municipio_id?: number;
  erro?: string;
};

const NIVEL_PERFIL: Record<Perfil, number> = {
  DESENVOLVEDOR: 100,
  ADMIN: 90,
  COMANDANTE: 80,
  DIRETOR: 70,
  CMT_GUARNICAO: 60,
  PLANTONISTA: 50,
  GUARDA: 40,
  CONSULTA: 10,
};

function responder(
  corpo: Record<string, unknown>,
  status: number
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function obterToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

function normalizarPerfil(valor: string | null): Perfil | null {
  const perfil = String(valor || "").toUpperCase();

  return PERFIS.includes(perfil as Perfil)
    ? (perfil as Perfil)
    : null;
}

function obterIp(request: NextRequest) {
  const valor =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "Não identificado";

  return valor.split(",")[0].trim().slice(0, 64);
}

function obterDispositivo(request: NextRequest) {
  return (
    request.headers.get("user-agent") || "Não identificado"
  ).slice(0, 500);
}

function identificarNavegador(userAgent: string) {
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("OPR/")) return "Opera";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("SamsungBrowser/")) {
    return "Samsung Internet";
  }
  if (userAgent.includes("Chrome/")) return "Chrome";

  if (
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/")
  ) {
    return "Safari";
  }

  return "Outro";
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const accessToken = obterToken(request);

    if (!accessToken) {
      return responder(
        {
          ok: false,
          erro: "Token de autenticação não informado.",
        },
        401
      );
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !authUser) {
      return responder(
        {
          ok: false,
          erro: "Sessão inválida ou expirada.",
        },
        401
      );
    }

    const { id } = await context.params;
    const usuarioAlvoId = Number(id);

    if (
      !Number.isSafeInteger(usuarioAlvoId) ||
      usuarioAlvoId <= 0
    ) {
      return responder(
        {
          ok: false,
          erro: "Identificador do usuário inválido.",
        },
        400
      );
    }

    const corpo = (await request.json().catch(() => null)) as {
      status?: string;
    } | null;

    const novoStatus = String(corpo?.status || "").toUpperCase();

    if (
      !["ATIVO", "BLOQUEADO", "INATIVO"].includes(novoStatus)
    ) {
      return responder(
        {
          ok: false,
          erro: "Status informado é inválido.",
        },
        422
      );
    }

    const { data: atorData, error: atorError } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id,auth_id,nome,email,perfil,status,municipio_id,tentativas_login,cpf,guarda_id"
      )
      .eq("auth_id", authUser.id)
      .maybeSingle();

    if (atorError || !atorData) {
      return responder(
        {
          ok: false,
          erro: "Usuário responsável não foi localizado.",
        },
        403
      );
    }

    const ator = atorData as UsuarioBanco;
    const perfilAtor = normalizarPerfil(ator.perfil);
    const statusAtor = String(ator.status || "").toUpperCase();

    if (
      statusAtor !== "ATIVO" ||
      !perfilAtor ||
      !["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR"].includes(
        perfilAtor
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Usuário sem permissão para gerenciar acessos.",
        },
        403
      );
    }

    if (ator.id === usuarioAlvoId) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido alterar o próprio status.",
        },
        409
      );
    }

    const { data: alvoData, error: alvoError } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id,auth_id,nome,email,perfil,status,municipio_id,tentativas_login,cpf,guarda_id"
      )
      .eq("id", usuarioAlvoId)
      .maybeSingle();

    if (alvoError || !alvoData) {
      return responder(
        {
          ok: false,
          erro: "Usuário que será alterado não foi encontrado.",
        },
        404
      );
    }

    const alvo = alvoData as UsuarioBanco;
    const perfilAlvo =
      normalizarPerfil(alvo.perfil) || "CONSULTA";

    if (
      perfilAtor !== "DESENVOLVEDOR" &&
      (
        !ator.municipio_id ||
        ator.municipio_id !== alvo.municipio_id
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido gerenciar usuário de outro município.",
        },
        403
      );
    }

    if (
      perfilAtor !== "DESENVOLVEDOR" &&
      NIVEL_PERFIL[perfilAtor] <= NIVEL_PERFIL[perfilAlvo]
    ) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido gerenciar usuário de nível igual ou superior.",
        },
        403
      );
    }

    let guardaIdVinculado =
      alvo.guarda_id
        ? Number(alvo.guarda_id)
        : null;

    if (
      novoStatus === "ATIVO" &&
      perfilAlvo === "GUARDA" &&
      !guardaIdVinculado
    ) {
      const cpfNormalizado =
        String(alvo.cpf || "")
          .replace(/\D/g, "");

      if (cpfNormalizado.length !== 11) {
        return responder(
          {
            ok: false,
            erro:
              "O usuário de perfil GUARDA precisa possuir CPF válido antes da aprovação.",
          },
          422
        );
      }

      if (!alvo.municipio_id) {
        return responder(
          {
            ok: false,
            erro:
              "O usuário de perfil GUARDA precisa possuir município antes da aprovação.",
          },
          422
        );
      }

      const {
        data: vinculoData,
        error: vinculoError,
      } = await supabaseAdmin.rpc(
        "vincular_usuario_guarda_por_cpf",
        {
          p_usuario_id: alvo.id,
          p_responsavel_usuario_id:
            ator.id,
        }
      );

      if (vinculoError) {
        console.error(
          "Erro ao vincular usuário ao guarda:",
          {
            message:
              vinculoError.message,
            details:
              vinculoError.details,
            hint:
              vinculoError.hint,
            code:
              vinculoError.code,
            usuario_alvo_id:
              alvo.id,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível vincular o usuário ao cadastro funcional do guarda.",
          },
          500
        );
      }

      const resultadoVinculo =
        (vinculoData || {}) as
          ResultadoVinculo;

      if (
        resultadoVinculo.ok !==
          true ||
        !resultadoVinculo.guarda_id
      ) {
        const mensagem =
          resultadoVinculo.erro ||
          (
            resultadoVinculo.status ===
            "GUARDA_NAO_ENCONTRADO"
              ? "Nenhum guarda com o mesmo CPF foi encontrado neste município."
              : "O vínculo com o cadastro funcional não pôde ser concluído."
          );

        return responder(
          {
            ok: false,
            erro: mensagem,
            codigo:
              resultadoVinculo.status ||
              "VINCULO_NAO_REALIZADO",
          },
          409
        );
      }

      guardaIdVinculado =
        Number(
          resultadoVinculo.guarda_id
        );
    }

    const atualizacao = {
      status: novoStatus as NovoStatus,
      aprovado_por: String(ator.id),
      aprovado_em: new Date().toISOString(),
      tentativas_login:
        novoStatus === "ATIVO"
          ? 0
          : alvo.tentativas_login || 0,
      bloqueado_ate:
        novoStatus === "ATIVO" ? null : undefined,
    };

    const payload =
      novoStatus === "ATIVO"
        ? atualizacao
        : {
            status: atualizacao.status,
            aprovado_por: atualizacao.aprovado_por,
            aprovado_em: atualizacao.aprovado_em,
            tentativas_login: atualizacao.tentativas_login,
          };

    const { error: updateError } = await supabaseAdmin
      .from("usuarios")
      .update(payload)
      .eq("id", alvo.id);

    if (updateError) {
      console.error("Erro ao alterar status do usuário:", {
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível alterar o status do usuário.",
        },
        500
      );
    }

    const { error: auditoriaError } = await supabaseAdmin
  .from("auditoria")
  .insert({
    municipio_id:
      alvo.municipio_id ||
      ator.municipio_id,
    guarda_id:
      ator.guarda_id ||
      ator.id,
    usuario_nome:
      ator.nome ||
      "Usuário",
    usuario_email:
      ator.email ||
      authUser.email ||
      "",
    perfil:
      perfilAtor,
    modulo:
      "Usuários",
    acao:
      novoStatus === "ATIVO" &&
      String(alvo.status || "").toUpperCase() === "PENDENTE"
        ? "APROVAR_USUARIO"
        : `ALTERAR_STATUS_${novoStatus}`,
    descricao:
      `Alterou o status do usuário ${alvo.nome} de ${
        alvo.status || "NÃO INFORMADO"
      } para ${novoStatus}.`,
    status:
      "SUCESSO",
    ip:
      obterIp(request),
    dispositivo:
      obterDispositivo(request),
    tabela:
      "usuarios",
    registro_id:
      String(alvo.id),
    detalhes: {
      usuario_alvo_id:
        alvo.id,
      nome_usuario_alvo:
        alvo.nome,
      status_anterior:
        alvo.status,
      novo_status:
        novoStatus,
      perfil_usuario_alvo:
        perfilAlvo,
      municipio_usuario_alvo:
        alvo.municipio_id,
      guarda_id_vinculado:
        guardaIdVinculado,
      responsavel_usuario_id:
        ator.id,
    },
  });

if (auditoriaError) {
  console.error(
    "Status alterado, mas a auditoria falhou:",
    {
      message:
        auditoriaError.message,
      details:
        auditoriaError.details,
      hint:
        auditoriaError.hint,
      code:
        auditoriaError.code,
      usuario_alvo_id:
        alvo.id,
    }
  );
}

    const dispositivo = obterDispositivo(request);

    const { error: logError } = await supabaseAdmin
      .from("logs_acesso")
      .insert({
        usuario_id: ator.id,
        municipio_id:
          ator.municipio_id || alvo.municipio_id,
        email: authUser.email || ator.email || "",
        ip: obterIp(request),
        dispositivo,
        navegador: identificarNavegador(dispositivo),
        acao: `USUARIO_STATUS_${novoStatus}`,
        status: "SUCESSO",
      });

    if (logError) {
      console.error("Status alterado, mas o log falhou:", {
        message: logError.message,
        details: logError.details,
        hint: logError.hint,
        code: logError.code,
        usuario_alvo_id: alvo.id,
      });
    }

    return responder(
      {
        ok: true,
        usuario: {
          id: alvo.id,
          status: novoStatus,
          guarda_id:
            guardaIdVinculado,
        },
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado ao alterar status:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao alterar o status do usuário.",
      },
      500
    );
  }
}
