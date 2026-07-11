import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioSistema = {
  id: number;
  auth_id: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type PermissaoMapa = {
  pode_ver: boolean;
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
  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export async function GET(
  request: NextRequest
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
    } = await supabaseAdmin.auth.getUser(
      accessToken
    );

    if (authError || !authUser) {
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
        `
          id,
          auth_id,
          perfil,
          status,
          municipio_id
        `
      )
      .eq("auth_id", authUser.id)
      .maybeSingle<UsuarioSistema>();

    if (usuarioError) {
      console.error(
        "Erro ao validar usuário do mapa SOS:",
        {
          message: usuarioError.message,
          details: usuarioError.details,
          hint: usuarioError.hint,
          code: usuarioError.code,
        }
      );

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

    const perfil = String(
      usuario.perfil || ""
    ).toUpperCase();

    const status = String(
      usuario.status || ""
    ).toUpperCase();

    if (status !== "ATIVO") {
      return responder(
        {
          ok: false,
          erro: "Usuário sem acesso ativo.",
        },
        403
      );
    }

    let municipioId: number;

    if (perfil === "DESENVOLVEDOR") {
      municipioId = Number(
        request.nextUrl.searchParams.get(
          "municipio_id"
        )
      );

      if (
        !Number.isInteger(municipioId) ||
        municipioId <= 0
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Informe um município válido para visualizar o mapa.",
          },
          400
        );
      }
    } else {
      if (!usuario.municipio_id) {
        return responder(
          {
            ok: false,
            erro: "Usuário sem município vinculado.",
          },
          422
        );
      }

      municipioId = usuario.municipio_id;

      const {
        data: permissao,
        error: permissaoError,
      } = await supabaseAdmin
        .from("permissoes_perfis")
        .select("pode_ver")
        .eq("municipio_id", municipioId)
        .eq("perfil", perfil)
        .eq("modulo", "mapa_operacional")
        .maybeSingle<PermissaoMapa>();

      if (permissaoError) {
        console.error(
          "Erro ao validar permissão do mapa operacional:",
          {
            message: permissaoError.message,
            details: permissaoError.details,
            hint: permissaoError.hint,
            code: permissaoError.code,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível validar a permissão do mapa.",
          },
          500
        );
      }

      if (!permissao?.pode_ver) {
        return responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para visualizar o mapa operacional.",
          },
          403
        );
      }
    }

    const {
      data: alertas,
      error: alertasError,
    } = await supabaseAdmin
      .from("alertas_sos")
      .select(
        `
          id,
          municipio_id,
          usuario_id,
          nome_usuario,
          latitude,
          longitude,
          precisao,
          status,
          observacao,
          criado_em,
          atendido_por,
          atendido_em
        `
      )
      .eq("municipio_id", municipioId)
      .neq("status", "FINALIZADO")
      .order("criado_em", {
        ascending: false,
      })
      .limit(100);

    if (alertasError) {
      console.error(
        "Erro ao carregar SOS do mapa:",
        {
          message: alertasError.message,
          details: alertasError.details,
          hint: alertasError.hint,
          code: alertasError.code,
          municipio_id: municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os alertas SOS.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        alertas: alertas || [],
        municipio_id: municipioId,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/sos/mapa:",
      {
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        error,
      }
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao carregar os alertas SOS do mapa.",
      },
      500
    );
  }
}