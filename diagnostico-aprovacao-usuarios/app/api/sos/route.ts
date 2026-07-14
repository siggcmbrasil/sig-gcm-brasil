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

type PermissaoSOS = {
  pode_ver: boolean;
  pode_editar: boolean;
};

type AlertaSOS = {
  id: number;
  municipio_id: number;
  usuario_id: string | number | null;
  nome_usuario: string | null;
  latitude: string | null;
  longitude: string | null;
  precisao: string | null;
  status: string;
  observacao: string | null;
  criado_em: string;
  atendido_por: string | number | null;
  atendido_em: string | null;
};

type CampoPermissao =
  | "pode_ver"
  | "pode_editar";

type ContextoAutenticado = {
  usuario: UsuarioSistema;
  perfil: string;
  authEmail: string;
};

type ResultadoAutenticacao =
  | {
      ok: true;
      contexto: ContextoAutenticado;
    }
  | {
      ok: false;
      resposta: NextResponse;
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
  const cabecalhos = [
    request.headers.get(
      "x-vercel-forwarded-for"
    ),
    request.headers.get("x-forwarded-for"),
    request.headers.get("x-real-ip"),
  ];

  const valor = cabecalhos
    .find((item) => Boolean(item))
    ?.split(",")[0]
    ?.trim();

  return (
    valor || "Não identificado"
  ).slice(0, 64);
}

function obterDispositivo(
  request: NextRequest
) {
  return (
    request.headers.get("user-agent") ||
    "Não identificado"
  ).slice(0, 500);
}

async function autenticar(
  request: NextRequest,
  campo: CampoPermissao
): Promise<ResultadoAutenticacao> {
  const accessToken = obterToken(request);

  if (!accessToken) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Token de autenticação não informado.",
        },
        401
      ),
    };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseAdmin.auth.getUser(
    accessToken
  );

  if (authError || !authUser) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Sessão inválida ou expirada.",
        },
        401
      ),
    };
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
      "Erro ao validar usuário da Central SOS:",
      {
        message: usuarioError.message,
        details: usuarioError.details,
        hint: usuarioError.hint,
        code: usuarioError.code,
      }
    );

    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Não foi possível validar o usuário.",
        },
        500
      ),
    };
  }

  if (!usuario) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Usuário não cadastrado no sistema.",
        },
        404
      ),
    };
  }

  const status = String(
    usuario.status || ""
  ).toUpperCase();

  const perfil = String(
    usuario.perfil || ""
  ).toUpperCase();

  if (status !== "ATIVO") {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Usuário sem acesso ativo.",
        },
        403
      ),
    };
  }

  if (
    perfil !== "DESENVOLVEDOR" &&
    !usuario.municipio_id
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Usuário sem município vinculado.",
        },
        422
      ),
    };
  }

  /*
   * O DESENVOLVEDOR possui acesso global.
   */
  if (perfil !== "DESENVOLVEDOR") {
    const {
      data: permissao,
      error: permissaoError,
    } = await supabaseAdmin
      .from("permissoes_perfis")
      .select("pode_ver,pode_editar")
      .eq(
        "municipio_id",
        usuario.municipio_id
      )
      .eq("perfil", perfil)
      .eq("modulo", "sos_central")
      .maybeSingle<PermissaoSOS>();

    if (permissaoError) {
      console.error(
        "Erro ao consultar permissão da Central SOS:",
        {
          message: permissaoError.message,
          details: permissaoError.details,
          hint: permissaoError.hint,
          code: permissaoError.code,
        }
      );

      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Não foi possível validar a permissão.",
          },
          500
        ),
      };
    }

    if (!permissao?.[campo]) {
      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para esta ação.",
          },
          403
        ),
      };
    }
  }

  return {
    ok: true,
    contexto: {
      usuario,
      perfil,
      authEmail:
        authUser.email ||
        usuario.email ||
        "",
    },
  };
}

async function registrarAuditoriaSOS({
  request,
  usuario,
  perfil,
  authEmail,
  alerta,
  acao,
  descricao,
  detalhes,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
  authEmail: string;
  alerta: AlertaSOS;
  acao: string;
  descricao: string;
  detalhes: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin
    .from("auditoria")
    .insert({
      municipio_id: alerta.municipio_id,
      guarda_id: usuario.id,
      usuario_nome:
        usuario.nome || "Usuário",
      usuario_email:
        authEmail || usuario.email || "",
      perfil,
      modulo: "CENTRAL_SOS",
      acao,
      descricao,
      status: "SUCESSO",
      ip: obterIp(request),
      dispositivo:
        obterDispositivo(request),
      tabela: "alertas_sos",
      registro_id: String(alerta.id),
      detalhes,
    });

  if (error) {
    console.error(
      "Erro ao registrar auditoria do SOS:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        alerta_id: alerta.id,
      }
    );

    return false;
  }

  return true;
}

/*
 * Lista os alertas.
 *
 * Usuários comuns:
 * somente alertas do próprio município.
 *
 * DESENVOLVEDOR:
 * todos os municípios ou um município
 * informado por query string.
 */
export async function GET(
  request: NextRequest
) {
  try {
    const autenticacao = await autenticar(
      request,
      "pode_ver"
    );

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const {
      usuario,
      perfil,
    } = autenticacao.contexto;

    let query = supabaseAdmin
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
      .order("criado_em", {
        ascending: false,
      })
      .limit(100);

    if (perfil !== "DESENVOLVEDOR") {
      query = query.eq(
        "municipio_id",
        usuario.municipio_id
      );
    } else {
      const municipioParametro = Number(
        request.nextUrl.searchParams.get(
          "municipio_id"
        )
      );

      if (
        !Number.isSafeInteger(
          municipioParametro
        ) ||
        municipioParametro <= 0
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Selecione um município para visualizar a Central SOS.",
          },
          400
        );
      }

      const {
        data: municipio,
        error: municipioError,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", municipioParametro)
        .eq("ativo", true)
        .maybeSingle();

      if (municipioError) {
        console.error(
          "Erro ao validar município da Central SOS:",
          {
            message: municipioError.message,
            details: municipioError.details,
            hint: municipioError.hint,
            code: municipioError.code,
            municipio_id:
              municipioParametro,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível validar o município selecionado.",
          },
          500
        );
      }

      if (!municipio) {
        return responder(
          {
            ok: false,
            erro:
              "Município inexistente ou inativo.",
          },
          404
        );
      }

      query = query.eq(
        "municipio_id",
        municipioParametro
      );
    }

    const {
      data,
      error,
    } = await query;

    if (error) {
      console.error(
        "Erro ao carregar alertas SOS:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
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

    const alertas = (
      (data || []) as AlertaSOS[]
    ).sort((a, b) => {
      const prioridade:
        Record<string, number> = {
        ABERTO: 1,
        EM_ATENDIMENTO: 2,
        FINALIZADO: 3,
      };

      const prioridadeA =
        prioridade[
          String(a.status).toUpperCase()
        ] || 99;

      const prioridadeB =
        prioridade[
          String(b.status).toUpperCase()
        ] || 99;

      if (
        prioridadeA !== prioridadeB
      ) {
        return (
          prioridadeA - prioridadeB
        );
      }

      return (
        new Date(
          b.criado_em
        ).getTime() -
        new Date(
          a.criado_em
        ).getTime()
      );
    });

    return responder(
      {
        ok: true,
        alertas,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          perfil,
          municipio_id:
            usuario.municipio_id,
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/sos:",
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
          "Erro interno ao carregar a Central SOS.",
      },
      500
    );
  }
}

/*
 * Ações aceitas:
 *
 * ATENDER
 * FINALIZAR
 */
export async function PATCH(
  request: NextRequest
) {
  try {
    const autenticacao = await autenticar(
      request,
      "pode_editar"
    );

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const {
      usuario,
      perfil,
      authEmail,
    } = autenticacao.contexto;

    const corpo = await request
      .json()
      .catch(() => null);

    const id = Number(corpo?.id);

    const acao = String(
      corpo?.acao || ""
    )
      .trim()
      .toUpperCase();

    const observacao = String(
      corpo?.observacao || ""
    )
      .trim()
      .slice(0, 1000);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Identificador do SOS inválido.",
        },
        400
      );
    }

    if (
      !["ATENDER", "FINALIZAR"].includes(
        acao
      )
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Ação solicitada é inválida.",
        },
        400
      );
    }

    let municipioIdContexto =
      Number(usuario.municipio_id || 0);

    if (perfil === "DESENVOLVEDOR") {
      municipioIdContexto = Number(
        request.nextUrl.searchParams.get(
          "municipio_id"
        )
      );

      if (
        !Number.isSafeInteger(
          municipioIdContexto
        ) ||
        municipioIdContexto <= 0
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Selecione um município antes de alterar o SOS.",
          },
          400
        );
      }
    }

    let buscaAlerta = supabaseAdmin
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
      .eq("id", id)
      .eq(
        "municipio_id",
        municipioIdContexto
      );

    const {
      data: alerta,
      error: alertaError,
    } = await buscaAlerta
      .maybeSingle<AlertaSOS>();

    if (alertaError) {
      console.error(
        "Erro ao localizar SOS:",
        {
          message: alertaError.message,
          details: alertaError.details,
          hint: alertaError.hint,
          code: alertaError.code,
          alerta_id: id,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar o SOS.",
        },
        500
      );
    }

    if (!alerta) {
      return responder(
        {
          ok: false,
          erro:
            "SOS não encontrado ou pertence a outro município.",
        },
        404
      );
    }

    const statusAtual = String(
      alerta.status || ""
    ).toUpperCase();

    const agora =
      new Date().toISOString();

    let atualizacao:
      Record<string, unknown>;

    let descricaoAuditoria = "";

    let novoStatus = "";

    if (acao === "ATENDER") {
      if (statusAtual !== "ABERTO") {
        return responder(
          {
            ok: false,
            erro:
              "Somente um SOS ABERTO pode ser colocado em atendimento.",
          },
          409
        );
      }

      novoStatus = "EM_ATENDIMENTO";

      atualizacao = {
        status: novoStatus,
        atendido_por: usuario.id,
        atendido_em: agora,
      };

      descricaoAuditoria =
        `Iniciou o atendimento do SOS de ${
          alerta.nome_usuario ||
          "usuário não identificado"
        }.`;
    } else {
      if (
        statusAtual === "FINALIZADO"
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Este SOS já foi finalizado.",
          },
          409
        );
      }

      novoStatus = "FINALIZADO";

      atualizacao = {
        status: novoStatus,
        observacao:
          observacao ||
          alerta.observacao ||
          "",
        atendido_por:
          alerta.atendido_por ||
          usuario.id,
        atendido_em:
          alerta.atendido_em || agora,
      };

      descricaoAuditoria =
        `Finalizou o SOS de ${
          alerta.nome_usuario ||
          "usuário não identificado"
        }.`;
    }

    const {
      data: alertaAtualizado,
      error: atualizacaoError,
    } = await supabaseAdmin
      .from("alertas_sos")
      .update(atualizacao)
      .eq("id", alerta.id)
      .eq(
        "municipio_id",
        alerta.municipio_id
      )
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
      .single<AlertaSOS>();

    if (atualizacaoError) {
      console.error(
        "Erro ao atualizar SOS:",
        {
          message:
            atualizacaoError.message,
          details:
            atualizacaoError.details,
          hint: atualizacaoError.hint,
          code: atualizacaoError.code,
          alerta_id: alerta.id,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível atualizar o SOS.",
        },
        500
      );
    }

    const auditoriaRegistrada =
      await registrarAuditoriaSOS({
        request,
        usuario,
        perfil,
        authEmail,
        alerta:
          alertaAtualizado as AlertaSOS,
        acao,
        descricao:
          descricaoAuditoria,
        detalhes: {
          status_anterior:
            statusAtual,
          status_novo:
            novoStatus,
          atendido_por:
            usuario.id,
          observacao:
            observacao || null,
        },
      });

    if (!auditoriaRegistrada) {
      return responder(
        {
          ok: false,
          alterado: true,
          alerta: alertaAtualizado,
          erro:
            "O SOS foi atualizado, mas a auditoria não pôde ser registrada.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        alerta: alertaAtualizado,
        mensagem:
          acao === "ATENDER"
            ? "Atendimento iniciado com sucesso."
            : "SOS finalizado com sucesso.",
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no PATCH /api/sos:",
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
          "Erro interno ao atualizar o SOS.",
      },
      500
    );
  }
}