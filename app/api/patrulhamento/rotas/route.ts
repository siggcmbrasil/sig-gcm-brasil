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

const TAMANHO_LOTE = 1000;
const LIMITE_PONTOS = 20000;

function responder(corpo: Record<string, unknown>, status: number) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function texto(valor: unknown, limite = 500) {
  return String(valor ?? "").trim().slice(0, limite);
}

function normalizar(valor: unknown) {
  return texto(valor, 100)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function numeroId(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isSafeInteger(numero) || numero <= 0) {
    return null;
  }

  return numero;
}

function obterToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

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

async function resolverMunicipio({
  request,
  usuario,
  perfil,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
}) {
  let municipioId = Number(usuario.municipio_id || 0);

  if (perfil === "DESENVOLVEDOR") {
    const parametro = numeroId(
      request.nextUrl.searchParams.get("municipio_id")
    );

    if (parametro) {
      const { data: municipio, error } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", parametro)
        .maybeSingle();

      if (error) {
        console.error("Erro ao validar município das rotas:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }

      if (municipio) {
        municipioId = parametro;
      }
    }

    if (!municipioId) {
      const { data: primeiroMunicipio, error } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Erro ao localizar município padrão das rotas:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
      }

      municipioId = Number(primeiroMunicipio?.id || 0);
    }
  }

  return municipioId;
}

async function autenticar(
  request: NextRequest
): Promise<AutenticacaoSucesso | AutenticacaoFalha> {
  const accessToken = obterToken(request);

  if (!accessToken) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Token de autenticação não informado.",
        },
        401
      ),
    };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !authUser) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Sessão inválida ou expirada.",
        },
        401
      ),
    };
  }

  const { data: usuario, error: usuarioError } = await supabaseAdmin
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
    .eq("auth_id", authUser.id)
    .maybeSingle<UsuarioSistema>();

  if (usuarioError) {
    console.error("Erro ao validar usuário das rotas:", {
      message: usuarioError.message,
      details: usuarioError.details,
      hint: usuarioError.hint,
      code: usuarioError.code,
    });

    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Não foi possível validar o usuário.",
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
          erro: "Usuário não cadastrado no sistema.",
        },
        404
      ),
    };
  }

  const perfil = normalizar(usuario.perfil);

  if (normalizar(usuario.status) !== "ATIVO") {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário sem acesso ativo.",
        },
        403
      ),
    };
  }

  const municipioId = await resolverMunicipio({
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
          erro: "Município não identificado.",
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

  if (perfil !== "DESENVOLVEDOR") {
    const { data: permissao, error: permissaoError } = await supabaseAdmin
      .from("permissoes_perfis")
      .select(
        `
          pode_ver,
          pode_criar,
          pode_editar,
          pode_excluir
        `
      )
      .eq("municipio_id", municipioId)
      .eq("perfil", perfil)
      .eq("modulo", "patrulhamento")
      .maybeSingle<Permissoes>();

    if (permissaoError) {
      console.error("Erro ao validar permissões das rotas:", {
        message: permissaoError.message,
        details: permissaoError.details,
        hint: permissaoError.hint,
        code: permissaoError.code,
      });

      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro: "Não foi possível validar as permissões.",
          },
          500
        ),
      };
    }

    permissoes = permissao || {
      pode_ver: false,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
    };
  }

  if (!permissoes.pode_ver) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para visualizar rotas de patrulhamento.",
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
  const pontos: Record<string, unknown>[] = [];
  let inicio = 0;
  let truncado = false;

  while (pontos.length < LIMITE_PONTOS) {
    const fim = Math.min(
      inicio + TAMANHO_LOTE - 1,
      LIMITE_PONTOS - 1
    );

    const { data, error } = await supabaseAdmin
      .from("gps_patrulhamento")
      .select(
        `
          id,
          municipio_id,
          patrulhamento_id,
          latitude,
          longitude,
          velocidade,
          precisao,
          tipo,
          observacao,
          criado_em
        `
      )
      .eq("patrulhamento_id", patrulhamentoId)
      .eq("municipio_id", municipioId)
      .order("criado_em", { ascending: true })
      .range(inicio, fim);

    if (error) {
      throw error;
    }

    const lote = (data || []) as Record<string, unknown>[];
    pontos.push(...lote);

    if (lote.length < TAMANHO_LOTE) {
      break;
    }

    inicio += TAMANHO_LOTE;

    if (pontos.length >= LIMITE_PONTOS) {
      truncado = true;
      break;
    }
  }

  return {
    pontos,
    truncado,
  };
}

async function auditar({
  request,
  autenticacao,
  patrulhamentoId,
  quantidadePontos,
}: {
  request: NextRequest;
  autenticacao: AutenticacaoSucesso;
  patrulhamentoId: number | null;
  quantidadePontos: number;
}) {
  const { error } = await supabaseAdmin
    .from("auditoria")
    .insert({
      municipio_id: autenticacao.municipioId,
      guarda_id: autenticacao.usuario.id,
      usuario_nome:
        autenticacao.usuario.nome || "Usuário",
      usuario_email:
        autenticacao.usuario.email || "",
      perfil: autenticacao.perfil,
      modulo: "Patrulhamento",
      acao: "VISUALIZAR_ROTA",
      descricao: patrulhamentoId
        ? `Visualizou a rota do patrulhamento ${patrulhamentoId}.`
        : "Acessou a central de rotas de patrulhamento.",
      status: "SUCESSO",
      ip: obterIp(request),
      dispositivo: obterDispositivo(request),
      tabela: "gps_patrulhamento",
      registro_id: patrulhamentoId
        ? String(patrulhamentoId)
        : null,
      detalhes: {
        quantidade_pontos: quantidadePontos,
      },
    });

  if (error) {
    console.error("Erro ao auditar visualização de rota:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      patrulhamento_id: patrulhamentoId,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const autenticacao = await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const idInformado =
      request.nextUrl.searchParams.has("id");

    const idSolicitado = numeroId(
      request.nextUrl.searchParams.get("id")
    );

    if (idInformado && !idSolicitado) {
      return responder(
        {
          ok: false,
          erro: "Identificador do patrulhamento inválido.",
        },
        400
      );
    }

    const { data: patrulhamentos, error: listaError } =
      await supabaseAdmin
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
            observacao,
            status,
            finalizado_em,
            criado_em
          `
        )
        .eq("municipio_id", autenticacao.municipioId)
        .order("id", { ascending: false })
        .limit(300);

    if (listaError) {
      console.error("Erro ao carregar lista de rotas:", {
        message: listaError.message,
        details: listaError.details,
        hint: listaError.hint,
        code: listaError.code,
        municipio_id: autenticacao.municipioId,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível carregar os patrulhamentos.",
        },
        500
      );
    }

    let patrulhamento: Record<string, unknown> | null = null;

    if (idSolicitado) {
      const { data, error } = await supabaseAdmin
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
            observacao,
            status,
            finalizado_em,
            criado_em
          `
        )
        .eq("id", idSolicitado)
        .eq("municipio_id", autenticacao.municipioId)
        .maybeSingle();

      if (error) {
        console.error("Erro ao localizar patrulhamento da rota:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          patrulhamento_id: idSolicitado,
        });

        return responder(
          {
            ok: false,
            erro: "Não foi possível localizar o patrulhamento.",
          },
          500
        );
      }

      if (!data) {
        return responder(
          {
            ok: false,
            erro: "Patrulhamento não encontrado neste município.",
          },
          404
        );
      }

      patrulhamento = data as Record<string, unknown>;
    } else {
      patrulhamento =
        ((patrulhamentos || [])[0] as Record<string, unknown>) ||
        null;
    }

    let pontos: Record<string, unknown>[] = [];
    let pontosTruncados = false;

    if (patrulhamento) {
      const resultadoPontos = await carregarPontos({
        municipioId: autenticacao.municipioId,
        patrulhamentoId: Number(patrulhamento.id),
      });

      pontos = resultadoPontos.pontos;
      pontosTruncados = resultadoPontos.truncado;
    }

    await auditar({
      request,
      autenticacao,
      patrulhamentoId: patrulhamento
        ? Number(patrulhamento.id)
        : null,
      quantidadePontos: pontos.length,
    });

    return responder(
      {
        ok: true,
        contexto: {
          usuario_id: autenticacao.usuario.id,
          usuario_nome: autenticacao.usuario.nome,
          perfil: autenticacao.perfil,
          municipio_id: autenticacao.municipioId,
        },
        permissoes: autenticacao.permissoes,
        patrulhamentos: patrulhamentos || [],
        patrulhamento,
        pontos,
        pontos_truncados: pontosTruncados,
        limite_pontos: LIMITE_PONTOS,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/patrulhamento/rotas:",
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
          "Erro interno ao carregar a rota do patrulhamento.",
      },
      500
    );
  }
}