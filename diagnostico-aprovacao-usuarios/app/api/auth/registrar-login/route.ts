import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioSistema = {
  id: number;
  auth_id: string | null;
  municipio_id: number | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
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

  const token = authorization.slice(7).trim();

  return token || null;
}

function obterIp(request: NextRequest) {
  const cabecalhos = [
    request.headers.get("x-vercel-forwarded-for"),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  ];

  const valor = cabecalhos
    .find((item) => Boolean(item))
    ?.split(",")[0]
    ?.trim();

  return (valor || "Não identificado").slice(0, 64);
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
  if (userAgent.includes("SamsungBrowser/")) return "Samsung Internet";
  if (userAgent.includes("Chrome/")) return "Chrome";

  if (
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/") &&
    !userAgent.includes("Chromium/")
  ) {
    return "Safari";
  }

  return "Outro";
}

export async function POST(request: NextRequest) {
  try {
    /*
     * O corpo enviado pelo navegador é ignorado.
     * usuario_id, municipio_id, email, perfil e status são obtidos
     * exclusivamente da sessão autenticada e do banco.
     */
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
      console.warn("Token inválido em registrar-login:", {
        message: authError?.message,
      });

      return responder(
        {
          ok: false,
          erro: "Sessão inválida ou expirada.",
        },
        401
      );
    }

    const {
      data: usuario,
      error: usuarioError,
    } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id,auth_id,municipio_id,email,perfil,status"
      )
      .eq("auth_id", authUser.id)
      .maybeSingle<UsuarioSistema>();

    if (usuarioError) {
      console.error("Erro ao localizar usuário no registrar-login:", {
        message: usuarioError.message,
        details: usuarioError.details,
        hint: usuarioError.hint,
        code: usuarioError.code,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível validar o usuário.",
        },
        500
      );
    }

    if (!usuario) {
      return responder(
        {
          ok: false,
          erro: "Usuário não cadastrado no sistema.",
        },
        404
      );
    }

    const status = String(usuario.status || "").toUpperCase();
    const perfil = String(usuario.perfil || "").toUpperCase();

    if (status !== "ATIVO") {
      return responder(
        {
          ok: false,
          erro: "Usuário sem acesso ativo.",
        },
        403
      );
    }

    if (
      perfil !== "DESENVOLVEDOR" &&
      !usuario.municipio_id
    ) {
      return responder(
        {
          ok: false,
          erro: "Usuário sem município vinculado.",
        },
        422
      );
    }

    const ip = obterIp(request);
    const dispositivo = obterDispositivo(request);
    const navegador = identificarNavegador(dispositivo);
    const agora = new Date().toISOString();

    const { error: atualizacaoError } = await supabaseAdmin
      .from("usuarios")
      .update({
        ultimo_login: agora,
        ultimo_ip: ip,
        ultimo_dispositivo: dispositivo,
        ultimo_navegador: navegador,
        tentativas_login: 0,
        bloqueado_ate: null,
      })
      .eq("auth_id", authUser.id);

    if (atualizacaoError) {
      console.error("Erro ao atualizar último login:", {
        message: atualizacaoError.message,
        details: atualizacaoError.details,
        hint: atualizacaoError.hint,
        code: atualizacaoError.code,
        auth_id: authUser.id,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível registrar o acesso.",
        },
        500
      );
    }

    const { error: logError } = await supabaseAdmin
      .from("logs_acesso")
      .insert({
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        email: authUser.email || usuario.email || "",
        ip,
        dispositivo,
        navegador,
        acao: "LOGIN",
        status: "SUCESSO",
      });

    if (logError) {
      console.error("Erro ao inserir log de acesso:", {
        message: logError.message,
        details: logError.details,
        hint: logError.hint,
        code: logError.code,
        usuario_id: usuario.id,
      });

      return responder(
        {
          ok: false,
          erro: "O login ocorreu, mas o log de acesso não foi registrado.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado em registrar-login:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao registrar o login.",
      },
      500
    );
  }
}
