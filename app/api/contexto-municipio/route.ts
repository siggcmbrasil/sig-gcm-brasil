import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_CONTEXTO =
  "sig_municipio_contexto";

type UsuarioSistema = {
  id: number;
  nome: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type Municipio = {
  id: number;
  nome: string | null;
  estado: string | null;
  brasao_gcm: string | null;
  ativo: boolean | null;
};

type AutenticacaoSucesso = {
  ok: true;
  usuario: UsuarioSistema;
  perfil: "DESENVOLVEDOR";
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

function normalizar(
  valor: unknown
) {
  return String(valor || "")
    .trim()
    .toUpperCase();
}

function numeroId(
  valor: unknown
) {
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
    request.headers.get(
      "authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  return (
    authorization
      .slice(7)
      .trim() || null
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

function configurarCookie(
  resposta: NextResponse,
  municipioId: number
) {
  resposta.cookies.set({
    name: COOKIE_CONTEXTO,
    value: String(municipioId),
    httpOnly: true,
    secure:
      process.env.NODE_ENV ===
      "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

async function autenticar(
  request: NextRequest
): Promise<
  | AutenticacaoSucesso
  | AutenticacaoFalha
> {
  const token =
    obterToken(request);

  if (!token) {
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
      token
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
    data,
    error,
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

  if (error) {
    console.error(
      "Erro ao validar desenvolvedor no contexto municipal:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
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

  if (!data) {
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

  if (
    normalizar(data.status) !==
    "ATIVO"
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

  if (
    normalizar(data.perfil) !==
    "DESENVOLVEDOR"
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Somente o DESENVOLVEDOR pode alterar o município de contexto.",
        },
        403
      ),
    };
  }

  return {
    ok: true,
    usuario: data,
    perfil: "DESENVOLVEDOR",
  };
}

async function listarMunicipios() {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("municipios")
    .select(
      `
        id,
        nome,
        estado,
        brasao_gcm,
        ativo
      `
    )
    .eq("ativo", true)
    .order("nome", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Erro ao carregar municípios do contexto administrativo:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      }
    );

    return {
      ok: false as const,
      municipios:
        [] as Municipio[],
    };
  }

  return {
    ok: true as const,
    municipios:
      (data || []) as unknown as Municipio[],
  };
}

async function auditarTroca({
  request,
  usuario,
  municipio,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  municipio: Municipio;
}) {
  const {
    error,
  } = await supabaseAdmin
    .from("auditoria")
    .insert({
      municipio_id:
        municipio.id,
      guarda_id:
        usuario.id,
      usuario_nome:
        usuario.nome ||
        "Desenvolvedor",
      usuario_email:
        usuario.email || "",
      perfil:
        "DESENVOLVEDOR",
      modulo:
        "Sistema",
      acao:
        "TROCAR_MUNICIPIO_CONTEXTO",
      descricao:
        `Município de contexto alterado para ${municipio.nome || municipio.id}.`,
      status:
        "SUCESSO",
      ip:
        obterIp(request),
      dispositivo:
        obterDispositivo(request),
      tabela:
        "municipios",
      registro_id:
        String(municipio.id),
      detalhes: {
        municipio_id:
          municipio.id,
        municipio_nome:
          municipio.nome,
        municipio_estado:
          municipio.estado,
      },
    });

  if (error) {
    console.error(
      "Erro ao auditar troca de município de contexto:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        municipio_id:
          municipio.id,
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

    const resultado =
      await listarMunicipios();

    if (!resultado.ok) {
      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os municípios.",
        },
        500
      );
    }

    if (
      resultado.municipios.length ===
      0
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Nenhum município ativo foi encontrado.",
        },
        404
      );
    }

    const cookieId =
      numeroId(
        request.cookies.get(
          COOKIE_CONTEXTO
        )?.value
      );

    const usuarioMunicipioId =
      numeroId(
        autenticacao.usuario
          .municipio_id
      );

    const municipioAtual =
      resultado.municipios.find(
        (municipio) =>
          municipio.id === cookieId
      ) ||
      resultado.municipios.find(
        (municipio) =>
          municipio.id ===
          usuarioMunicipioId
      ) ||
      resultado.municipios[0];

    const resposta = responder(
      {
        ok: true,
        perfil:
          autenticacao.perfil,
        municipio_atual:
          municipioAtual,
        municipios:
          resultado.municipios,
      },
      200
    );

    configurarCookie(
      resposta,
      municipioAtual.id
    );

    return resposta;
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/contexto-municipio:",
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
          "Erro interno ao carregar o contexto municipal.",
      },
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const autenticacao =
      await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const body =
      (await request
        .json()
        .catch(() => null)) as
        | Record<string, unknown>
        | null;

    const municipioId =
      numeroId(
        body?.municipio_id
      );

    if (!municipioId) {
      return responder(
        {
          ok: false,
          erro:
            "Informe um município válido.",
        },
        400
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("municipios")
      .select(
        `
          id,
          nome,
          estado,
          brasao_gcm,
          ativo
        `
      )
      .eq(
        "id",
        municipioId
      )
      .eq("ativo", true)
      .maybeSingle<Municipio>();

    if (error) {
      console.error(
        "Erro ao validar município de contexto:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          municipio_id:
            municipioId,
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

    if (!data) {
      return responder(
        {
          ok: false,
          erro:
            "Município inexistente ou inativo.",
        },
        404
      );
    }

    const resposta = responder(
      {
        ok: true,
        mensagem:
          "Município de contexto atualizado.",
        municipio_atual:
          data,
      },
      200
    );

    configurarCookie(
      resposta,
      data.id
    );

    await auditarTroca({
      request,
      usuario:
        autenticacao.usuario,
      municipio:
        data,
    });

    return resposta;
  } catch (error) {
    console.error(
      "Erro inesperado no POST /api/contexto-municipio:",
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
          "Erro interno ao alterar o contexto municipal.",
      },
      500
    );
  }
}