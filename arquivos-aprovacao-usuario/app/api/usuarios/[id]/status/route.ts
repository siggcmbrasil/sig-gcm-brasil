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
        "id,auth_id,nome,email,perfil,status,municipio_id,tentativas_login"
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
        "id,auth_id,nome,email,perfil,status,municipio_id,tentativas_login"
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
