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
  nome: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type PermissaoAcionarSOS = {
  pode_ver: boolean;
  pode_criar: boolean;
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
    request.headers.get("user-agent") ||
    "Não identificado"
  ).slice(0, 500);
}

export async function POST(
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
          nome,
          email,
          perfil,
          status,
          municipio_id
        `
      )
      .eq("auth_id", authUser.id)
      .maybeSingle<UsuarioSistema>();

    if (usuarioError) {
      console.error(
        "Erro ao validar usuário do SOS:",
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

    if (!usuario.municipio_id) {
      return responder(
        {
          ok: false,
          erro: "Usuário sem município vinculado.",
        },
        422
      );
    }

    if (perfil !== "DESENVOLVEDOR") {
      const {
        data: permissao,
        error: permissaoError,
      } = await supabaseAdmin
        .from("permissoes_perfis")
        .select("pode_ver,pode_criar")
        .eq(
          "municipio_id",
          usuario.municipio_id
        )
        .eq("perfil", perfil)
        .eq("modulo", "sos_acionar")
        .maybeSingle<PermissaoAcionarSOS>();

      if (permissaoError) {
        console.error(
          "Erro ao validar permissão para acionar SOS:",
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
              "Não foi possível validar a permissão do SOS.",
          },
          500
        );
      }

      if (
        !permissao?.pode_ver ||
        !permissao?.pode_criar
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para acionar o SOS.",
          },
          403
        );
      }
    }

    const corpo = await request
      .json()
      .catch(() => null);

    const latitude = Number(corpo?.latitude);
    const longitude = Number(corpo?.longitude);
    const precisao = Number(corpo?.precisao);

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      return responder(
        {
          ok: false,
          erro: "Latitude inválida.",
        },
        400
      );
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      return responder(
        {
          ok: false,
          erro: "Longitude inválida.",
        },
        400
      );
    }

    if (
      !Number.isFinite(precisao) ||
      precisao < 0
    ) {
      return responder(
        {
          ok: false,
          erro: "Precisão do GPS inválida.",
        },
        400
      );
    }

const modoTesteSolicitado =
  corpo?.modo_teste === true;

const modoTestePermitido =
  process.env.NODE_ENV !== "production" &&
  modoTesteSolicitado;

if (
  precisao > 100 &&
  !modoTestePermitido
) {
  return responder(
    {
      ok: false,
      erro:
        "GPS com baixa precisão. Vá para uma área aberta e tente novamente.",
    },
    422
  );
}

    /*
     * Evita vários alertas causados por
     * múltiplos cliques no botão.
     */
    const limiteRepeticao = new Date(
      Date.now() - 30_000
    ).toISOString();

    const {
      data: alertaRecente,
      error: alertaRecenteError,
    } = await supabaseAdmin
      .from("alertas_sos")
      .select("id,status,criado_em")
      .eq(
        "municipio_id",
        usuario.municipio_id
      )
      .eq("usuario_id", usuario.id)
      .in("status", [
        "ABERTO",
        "EM_ATENDIMENTO",
      ])
      .gte("criado_em", limiteRepeticao)
      .order("criado_em", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (alertaRecenteError) {
      console.error(
        "Erro ao verificar SOS recente:",
        {
          message: alertaRecenteError.message,
          details: alertaRecenteError.details,
          hint: alertaRecenteError.hint,
          code: alertaRecenteError.code,
        }
      );
    }

    if (alertaRecente) {
      return responder(
        {
          ok: false,
          erro:
            "Um SOS já foi acionado por você nos últimos segundos.",
          alerta_id: alertaRecente.id,
        },
        409
      );
    }

    const {
      data: alerta,
      error: alertaError,
    } = await supabaseAdmin
      .from("alertas_sos")
      .insert({
        municipio_id: usuario.municipio_id,
        usuario_id: usuario.id,
        nome_usuario:
          usuario.nome ||
          "Usuário não identificado",
        latitude,
        longitude,
        precisao,
        status: "ABERTO",
      })
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
      .single();

    if (alertaError || !alerta) {
      console.error(
        "Erro ao criar alerta SOS:",
        {
          message: alertaError?.message,
          details: alertaError?.details,
          hint: alertaError?.hint,
          code: alertaError?.code,
        }
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível enviar o SOS.",
        },
        500
      );
    }

    const {
      error: notificacaoError,
    } = await supabaseAdmin
      .from("notificacoes")
      .insert({
        municipio_id: usuario.municipio_id,
        titulo: "🚨 ALERTA SOS",
        mensagem: `${
          usuario.nome || "Um guarda"
        } acionou o botão SOS.`,
        tipo: "SOS",
        link: "/sistema/central-sos",
        lida: false,
      });

    if (notificacaoError) {
      console.error(
        "Erro ao criar notificação do SOS:",
        {
          message: notificacaoError.message,
          details: notificacaoError.details,
          hint: notificacaoError.hint,
          code: notificacaoError.code,
          alerta_id: alerta.id,
        }
      );
    }

    const {
      error: auditoriaError,
    } = await supabaseAdmin
      .from("auditoria")
      .insert({
        municipio_id: usuario.municipio_id,
        guarda_id: usuario.id,
        usuario_nome:
          usuario.nome || "Usuário",
        usuario_email:
          authUser.email ||
          usuario.email ||
          "",
        perfil,
        modulo: "SOS",
        acao: "ACIONAR",
        descricao: `Alerta SOS acionado por ${
          usuario.nome || "usuário"
        }.`,
        status: "SUCESSO",
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(request),
        tabela: "alertas_sos",
        registro_id: String(alerta.id),
detalhes: {
  latitude,
  longitude,
  precisao,
  modo_teste: modoTestePermitido,
  notificacao_criada:
    !notificacaoError,
},
      });

    if (auditoriaError) {
      console.error(
        "Erro ao registrar auditoria do acionamento SOS:",
        {
          message: auditoriaError.message,
          details: auditoriaError.details,
          hint: auditoriaError.hint,
          code: auditoriaError.code,
          alerta_id: alerta.id,
        }
      );

      return responder(
        {
          ok: false,
          enviado: true,
          alerta,
          erro:
            "O SOS foi enviado, mas a auditoria não pôde ser registrada.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        alerta,
        mensagem:
          "SOS enviado com sucesso. Sua localização foi compartilhada.",
        notificacao_criada:
          !notificacaoError,
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado no POST /api/sos/acionar:",
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
          "Erro interno ao tentar acionar o SOS.",
      },
      500
    );
  }
}