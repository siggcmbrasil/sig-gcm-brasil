import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioSistema = {
  id: number;
  nome: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type Permissoes = {
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type AutenticacaoSucesso = {
  ok: true;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  permissoes: Permissoes;
};

type AutenticacaoFalha = {
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

function texto(
  valor: unknown,
  limite = 500
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
}

function normalizar(valor: unknown) {
  return texto(valor, 100)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function numeroId(valor: unknown) {
  const numero = Number(valor);

  if (
    !Number.isSafeInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function obterToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  return (
    authorization.slice(7).trim() ||
    null
  );
}

function obterIp(
  request: NextRequest
) {
  const valor =
    request.headers.get(
      "x-vercel-forwarded-for"
    ) ||
    request.headers.get(
      "x-forwarded-for"
    ) ||
    request.headers.get(
      "x-real-ip"
    ) ||
    "Não identificado";

  return valor
    .split(",")[0]
    .trim()
    .slice(0, 64);
}

function obterDispositivo(
  request: NextRequest
) {
  return (
    request.headers.get(
      "user-agent"
    ) ||
    "Não identificado"
  ).slice(0, 500);
}

async function resolverMunicipio({
  request,
  usuario,
  perfil,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
}) {
  let municipioId = Number(
    usuario.municipio_id || 0
  );

  if (
    perfil === "DESENVOLVEDOR"
  ) {
    const parametro = numeroId(
      request.nextUrl.searchParams.get(
        "municipio_id"
      )
    );

    if (parametro) {
      const {
        data: municipio,
        error,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", parametro)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao validar município dos pontos de visita:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );
      }

      if (municipio) {
        municipioId = parametro;
      }
    }

    if (!municipioId) {
      const {
        data: primeiroMunicipio,
        error,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .order("id", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao localizar município padrão dos pontos de visita:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );
      }

      municipioId = Number(
        primeiroMunicipio?.id || 0
      );
    }
  }

  return municipioId;
}

async function autenticar(
  request: NextRequest
): Promise<
  AutenticacaoSucesso |
  AutenticacaoFalha
> {
  const accessToken =
    obterToken(request);

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
  } =
    await supabaseAdmin.auth.getUser(
      accessToken
    );

  if (
    authError ||
    !authUser
  ) {
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
        nome,
        email,
        perfil,
        status,
        municipio_id
      `
    )
    .eq(
      "auth_id",
      authUser.id
    )
    .maybeSingle<UsuarioSistema>();

  if (usuarioError) {
    console.error(
      "Erro ao validar usuário dos pontos de visita:",
      {
        message:
          usuarioError.message,
        details:
          usuarioError.details,
        hint:
          usuarioError.hint,
        code:
          usuarioError.code,
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

  const perfil =
    normalizar(
      usuario.perfil
    );

  if (
    normalizar(
      usuario.status
    ) !== "ATIVO"
  ) {
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

  const municipioId =
    await resolverMunicipio({
      request,
      usuario,
      perfil,
    });

  if (!municipioId) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Município não identificado.",
        },
        422
      ),
    };
  }

  let permissoes: Permissoes = {
    pode_ver: true,
    pode_criar: true,
    pode_editar: true,
    pode_excluir: true,
  };

  if (
    perfil !== "DESENVOLVEDOR"
  ) {
    const {
      data: permissao,
      error: permissaoError,
    } = await supabaseAdmin
      .from(
        "permissoes_perfis"
      )
      .select(
        `
          pode_ver,
          pode_criar,
          pode_editar,
          pode_excluir
        `
      )
      .eq(
        "municipio_id",
        municipioId
      )
      .eq("perfil", perfil)
      .eq(
        "modulo",
        "patrulhamento"
      )
      .maybeSingle<Permissoes>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissões dos pontos de visita:",
        {
          message:
            permissaoError.message,
          details:
            permissaoError.details,
          hint:
            permissaoError.hint,
          code:
            permissaoError.code,
        }
      );

      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Não foi possível validar as permissões.",
          },
          500
        ),
      };
    }

    permissoes =
      permissao || {
        pode_ver: false,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false,
      };
  }

  return {
    ok: true,
    usuario,
    perfil,
    municipioId,
    permissoes,
  };
}

async function auditar({
  request,
  autenticacao,
  acao,
  descricao,
  registroId,
  detalhes,
}: {
  request: NextRequest;
  autenticacao: AutenticacaoSucesso;
  acao: string;
  descricao: string;
  registroId: number | null;
  detalhes?: Record<string, unknown>;
}) {
  const { error } =
    await supabaseAdmin
      .from("auditoria")
      .insert({
        municipio_id:
          autenticacao.municipioId,
        guarda_id:
          autenticacao.usuario.id,
        usuario_nome:
          autenticacao.usuario.nome ||
          "Usuário",
        usuario_email:
          autenticacao.usuario.email ||
          "",
        perfil:
          autenticacao.perfil,
        modulo:
          "Patrulhamento",
        acao,
        descricao,
        status: "SUCESSO",
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(request),
        tabela: "pontos_ronda",
        registro_id:
          registroId
            ? String(registroId)
            : null,
        detalhes:
          detalhes || {},
      });

  if (error) {
    console.error(
      "Erro ao auditar pontos de visita:",
      {
        message:
          error.message,
        details:
          error.details,
        hint:
          error.hint,
        code:
          error.code,
        registro_id:
          registroId,
      }
    );
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const autenticacao =
      await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    if (
      !autenticacao.permissoes
        .pode_ver
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para visualizar os pontos de visita.",
        },
        403
      );
    }

    const {
      data: pontos,
      error,
    } = await supabaseAdmin
      .from("pontos_ronda")
      .select(
        `
          id,
          municipio_id,
          nome_local,
          latitude,
          longitude,
          ordem,
          obrigatorio
        `
      )
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .order("ordem", {
        ascending: true,
        nullsFirst: false,
      })
      .order("id", {
        ascending: false,
      })
      .limit(1000);

    if (error) {
      console.error(
        "Erro ao carregar pontos de visita:",
        {
          message:
            error.message,
          details:
            error.details,
          hint:
            error.hint,
          code:
            error.code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os pontos de visita.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao: "VISUALIZAR_PONTOS_VISITA",
      descricao:
        "Visualizou a lista de pontos de visita.",
      registroId: null,
      detalhes: {
        quantidade:
          pontos?.length || 0,
      },
    });

    return responder(
      {
        ok: true,
        contexto: {
          usuario_id:
            autenticacao.usuario.id,
          usuario_nome:
            autenticacao.usuario.nome,
          perfil:
            autenticacao.perfil,
          municipio_id:
            autenticacao.municipioId,
        },
        permissoes:
          autenticacao.permissoes,
        pontos: pontos || [],
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/patrulhamento/visitas/pontos:",
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
          "Erro interno ao carregar os pontos de visita.",
      },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const autenticacao =
      await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    if (
      !autenticacao.permissoes
        .pode_excluir
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para excluir pontos de visita.",
        },
        403
      );
    }

    const corpo = (await request
      .json()
      .catch(
        () => null
      )) as
      | {
          id?: unknown;
          motivo?: unknown;
        }
      | null;

    const pontoId =
      numeroId(corpo?.id);

    const motivo =
      texto(corpo?.motivo, 500);

    if (!pontoId) {
      return responder(
        {
          ok: false,
          erro:
            "Identificador do ponto de visita inválido.",
        },
        400
      );
    }

    if (
      motivo.length < 5
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Informe o motivo da exclusão com pelo menos 5 caracteres.",
        },
        400
      );
    }

    const {
      data: ponto,
      error: pontoError,
    } = await supabaseAdmin
      .from("pontos_ronda")
      .select(
        `
          id,
          nome_local,
          latitude,
          longitude,
          ordem,
          obrigatorio
        `
      )
      .eq("id", pontoId)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .maybeSingle();

    if (pontoError) {
      console.error(
        "Erro ao localizar ponto de visita para exclusão:",
        {
          message:
            pontoError.message,
          details:
            pontoError.details,
          hint:
            pontoError.hint,
          code:
            pontoError.code,
          ponto_id:
            pontoId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar o ponto de visita.",
        },
        500
      );
    }

    if (!ponto) {
      return responder(
        {
          ok: false,
          erro:
            "Ponto de visita não encontrado neste município.",
        },
        404
      );
    }

    const {
      error: deleteError,
    } = await supabaseAdmin
      .from("pontos_ronda")
      .delete()
      .eq("id", pontoId)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      );

    if (deleteError) {
      console.error(
        "Erro ao excluir ponto de visita:",
        {
          message:
            deleteError.message,
          details:
            deleteError.details,
          hint:
            deleteError.hint,
          code:
            deleteError.code,
          ponto_id:
            pontoId,
        }
      );

      if (
        deleteError.code ===
        "23503"
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Este ponto possui check-ins ou outros registros vinculados e não pode ser excluído.",
          },
          409
        );
      }

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível excluir o ponto de visita.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao: "EXCLUIR_PONTO_VISITA",
      descricao:
        `Excluiu o ponto de visita ${ponto.nome_local || pontoId}.`,
      registroId: pontoId,
      detalhes: {
        motivo,
        ponto_excluido: ponto,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Ponto de visita excluído com sucesso.",
        id: pontoId,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no DELETE /api/patrulhamento/visitas/pontos:",
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
          "Erro interno ao excluir o ponto de visita.",
      },
      500
    );
  }
}