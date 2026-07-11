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

type ContextoRota = {
  params: Promise<{
    id: string;
  }>;
};

const TAMANHO_LOTE = 1000;
const LIMITE_PONTOS = 20000;

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
          "Erro ao validar município do acompanhamento:",
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
          "Erro ao localizar município padrão do acompanhamento:",
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
      "Erro ao validar usuário do acompanhamento:",
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
        "Erro ao validar permissões do acompanhamento:",
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

  if (
    !permissoes.pode_ver
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para visualizar este patrulhamento.",
        },
        403
      ),
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

async function carregarPontos({
  municipioId,
  patrulhamentoId,
}: {
  municipioId: number;
  patrulhamentoId: number;
}) {
  const pontos: Record<
    string,
    unknown
  >[] = [];

  let inicio = 0;
  let truncado = false;

  while (
    pontos.length <
    LIMITE_PONTOS
  ) {
    const fim = Math.min(
      inicio +
        TAMANHO_LOTE -
        1,
      LIMITE_PONTOS - 1
    );

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(
        "gps_patrulhamento"
      )
      .select(
        `
          id,
          municipio_id,
          patrulhamento_id,
          latitude,
          longitude,
          velocidade,
          precisao,
          criado_em,
          tipo,
          observacao
        `
      )
      .eq(
        "patrulhamento_id",
        patrulhamentoId
      )
      .eq(
        "municipio_id",
        municipioId
      )
      .order("criado_em", {
        ascending: true,
      })
      .range(inicio, fim);

    if (error) {
      throw error;
    }

    const lote =
      (data || []) as Record<
        string,
        unknown
      >[];

    pontos.push(...lote);

    if (
      lote.length <
      TAMANHO_LOTE
    ) {
      break;
    }

    inicio +=
      TAMANHO_LOTE;

    if (
      pontos.length >=
      LIMITE_PONTOS
    ) {
      truncado = true;
      break;
    }
  }

  return {
    pontos,
    truncado,
  };
}

async function auditarAcesso({
  request,
  autenticacao,
  patrulhamentoId,
  quantidadePontos,
}: {
  request: NextRequest;
  autenticacao:
    AutenticacaoSucesso;
  patrulhamentoId: number;
  quantidadePontos: number;
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
        acao:
          "VISUALIZAR",
        descricao:
          `Visualizou o patrulhamento ${patrulhamentoId}.`,
        status: "SUCESSO",
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(request),
        tabela:
          "patrulhamentos",
        registro_id:
          String(
            patrulhamentoId
          ),
        detalhes: {
          quantidade_pontos:
            quantidadePontos,
        },
      });

  if (error) {
    console.error(
      "Erro ao auditar acompanhamento do patrulhamento:",
      {
        message:
          error.message,
        details:
          error.details,
        hint:
          error.hint,
        code:
          error.code,
        patrulhamento_id:
          patrulhamentoId,
      }
    );
  }
}

export async function GET(
  request: NextRequest,
  contexto: ContextoRota
) {
  try {
    const autenticacao =
      await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const parametros =
      await contexto.params;

    const patrulhamentoId =
      numeroId(parametros.id);

    if (!patrulhamentoId) {
      return responder(
        {
          ok: false,
          erro:
            "Identificador do patrulhamento inválido.",
        },
        400
      );
    }

    const {
      data: patrulhamento,
      error:
        patrulhamentoError,
    } = await supabaseAdmin
      .from("patrulhamentos")
      .select(
        `
          id,
          municipio_id,
          data,
          hora,
          local,
          guarda,
          equipe,
          viatura,
          latitude,
          longitude,
          observacao,
          status,
          criado_em,
          finalizado_em
        `
      )
      .eq(
        "id",
        patrulhamentoId
      )
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .maybeSingle();

    if (patrulhamentoError) {
      console.error(
        "Erro ao carregar acompanhamento do patrulhamento:",
        {
          message:
            patrulhamentoError.message,
          details:
            patrulhamentoError.details,
          hint:
            patrulhamentoError.hint,
          code:
            patrulhamentoError.code,
          patrulhamento_id:
            patrulhamentoId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar o patrulhamento.",
        },
        500
      );
    }

    if (!patrulhamento) {
      return responder(
        {
          ok: false,
          erro:
            "Patrulhamento não encontrado neste município.",
        },
        404
      );
    }

    const resultadoPontos =
      await carregarPontos({
        municipioId:
          autenticacao.municipioId,
        patrulhamentoId,
      });

    const silencioso =
      request.nextUrl.searchParams.get(
        "silencioso"
      ) === "1";

    if (!silencioso) {
      await auditarAcesso({
        request,
        autenticacao,
        patrulhamentoId,
        quantidadePontos:
          resultadoPontos.pontos
            .length,
      });
    }

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
        patrulhamento,
        pontos:
          resultadoPontos.pontos,
        pontos_truncados:
          resultadoPontos.truncado,
        limite_pontos:
          LIMITE_PONTOS,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/patrulhamento/[id]:",
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
          "Erro interno ao carregar o patrulhamento.",
      },
      500
    );
  }
}