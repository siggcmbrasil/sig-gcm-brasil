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

type LocalCadastrado = {
  id: number;
  nome: string;
  tipo: string | null;
  endereco: string | null;
  referencia: string | null;
  latitude: number | null;
  longitude: number | null;
  raio_metros: number | null;
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

function numeroFinito(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function booleano(
  valor: unknown,
  padrao: boolean
) {
  if (
    typeof valor === "boolean"
  ) {
    return valor;
  }

  if (
    valor === "true" ||
    valor === 1 ||
    valor === "1"
  ) {
    return true;
  }

  if (
    valor === "false" ||
    valor === 0 ||
    valor === "0"
  ) {
    return false;
  }

  return padrao;
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

function criarUrlCheckin(
  request: NextRequest,
  pontoId: number
) {
  return new URL(
    `/sistema/patrulhamento/visitas/checkin?ponto=${pontoId}`,
    request.nextUrl.origin
  ).toString();
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
    const parametro =
      numeroId(
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
          "Erro ao validar município do QR Code:",
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
          "Erro ao localizar município padrão do QR Code:",
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
      "Erro ao validar usuário do QR Code:",
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
        "Erro ao validar permissões do QR Code:",
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
      "Erro ao auditar QR Code de visita:",
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
            "Você não possui permissão para visualizar QR Codes de visita.",
        },
        403
      );
    }

    const pontoInformado =
      request.nextUrl.searchParams.has(
        "ponto"
      );

    const pontoId =
      numeroId(
        request.nextUrl.searchParams.get(
          "ponto"
        )
      );

    if (
      pontoInformado &&
      !pontoId
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Identificador do ponto de visita inválido.",
        },
        400
      );
    }

    const [
      locaisResultado,
      municipioResultado,
    ] = await Promise.all([
      supabaseAdmin
        .from("locais")
        .select(
          `
            id,
            nome,
            tipo,
            endereco,
            referencia,
            latitude,
            longitude,
            raio_metros
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .eq("ativo", true)
        .order("nome", {
          ascending: true,
        })
        .limit(1000),

      supabaseAdmin
        .from("municipios")
        .select(
  `
    id,
    nome,
    brasao_gcm,
    emblema_url,
    escudo_gcm,
    brasao
  `
)
        .eq(
          "id",
          autenticacao.municipioId
        )
        .maybeSingle(),
    ]);

    if (
      locaisResultado.error
    ) {
      console.error(
        "Erro ao carregar locais do QR Code:",
        {
          message:
            locaisResultado.error
              .message,
          details:
            locaisResultado.error
              .details,
          hint:
            locaisResultado.error
              .hint,
          code:
            locaisResultado.error
              .code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os locais cadastrados.",
        },
        500
      );
    }

    if (
      municipioResultado.error
    ) {
      console.error(
        "Erro ao carregar identidade visual do município:",
        {
          message:
            municipioResultado.error
              .message,
          details:
            municipioResultado.error
              .details,
          hint:
            municipioResultado.error
              .hint,
          code:
            municipioResultado.error
              .code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar a identidade visual do município.",
        },
        500
      );
    }

    let ponto:
      Record<string, unknown> |
      null = null;

    if (pontoId) {
      const {
        data,
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
            obrigatorio,
            plano_id
          `
        )
        .eq("id", pontoId)
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao carregar ponto existente do QR Code:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            ponto_id: pontoId,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível carregar o ponto de visita.",
          },
          500
        );
      }

      if (!data) {
        return responder(
          {
            ok: false,
            erro:
              "Ponto de visita não encontrado neste município.",
          },
          404
        );
      }

      ponto =
        data as Record<
          string,
          unknown
        >;
    }

    const municipio =
      municipioResultado.data;

    const brasaoGuarda =
      municipio?.brasao_gcm ||
      municipio?.emblema_url ||
      municipio?.escudo_gcm ||
      municipio?.brasao ||
      "";

const brasaoMunicipio =
  municipio?.brasao || "";

    await auditar({
      request,
      autenticacao,
      acao:
        pontoId
          ? "VISUALIZAR_QRCODE_VISITA"
          : "ACESSAR_GERADOR_QRCODE_VISITA",
      descricao:
        pontoId
          ? `Visualizou o QR Code do ponto de visita ${pontoId}.`
          : "Acessou o gerador de QR Code de visita.",
      registroId:
        pontoId || null,
      detalhes: {
        quantidade_locais:
          locaisResultado.data
            ?.length || 0,
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
        locais:
          (locaisResultado.data ||
            []) as unknown as LocalCadastrado[],
        municipio: {
          id:
            autenticacao.municipioId,
          nome:
            municipio?.nome || "",
          brasao_guarda:
            brasaoGuarda,
          brasao_municipio:
            brasaoMunicipio,
        },
        ponto,
        url_checkin:
          pontoId
            ? criarUrlCheckin(
                request,
                pontoId
              )
            : "",
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/patrulhamento/visitas/qrcode:",
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
          "Erro interno ao carregar o gerador de QR Code.",
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

    if (
      !autenticacao.permissoes
        .pode_criar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para cadastrar pontos de visita.",
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
          local_id?: unknown;
          nome_local?: unknown;
          latitude?: unknown;
          longitude?: unknown;
          ordem?: unknown;
          obrigatorio?: unknown;
        }
      | null;

    const localId =
      numeroId(corpo?.local_id);

    let local:
      LocalCadastrado |
      null = null;

    if (localId) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("locais")
        .select(
          `
            id,
            nome,
            tipo,
            endereco,
            referencia,
            latitude,
            longitude,
            raio_metros
          `
        )
        .eq("id", localId)
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .eq("ativo", true)
        .maybeSingle<LocalCadastrado>();

      if (error) {
        console.error(
          "Erro ao validar local selecionado:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            local_id: localId,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível validar o local selecionado.",
          },
          500
        );
      }

      if (!data) {
        return responder(
          {
            ok: false,
            erro:
              "Local selecionado não encontrado neste município.",
          },
          404
        );
      }

      local = data;
    }

    const nomeLocal =
      texto(
        local?.nome ||
          corpo?.nome_local,
        160
      );

    const latitude =
      numeroFinito(
        corpo?.latitude
      ) ??
      numeroFinito(
        local?.latitude
      );

    const longitude =
      numeroFinito(
        corpo?.longitude
      ) ??
      numeroFinito(
        local?.longitude
      );

    const ordemInformada =
      numeroFinito(
        corpo?.ordem
      );

    const ordem =
      ordemInformada === null
        ? 1
        : Math.trunc(
            ordemInformada
          );

    const obrigatorio =
      booleano(
        corpo?.obrigatorio,
        true
      );

    if (
      nomeLocal.length < 2
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Informe o nome do local com pelo menos 2 caracteres.",
        },
        400
      );
    }

    if (
      latitude === null ||
      latitude < -90 ||
      latitude > 90
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Latitude inválida.",
        },
        400
      );
    }

    if (
      longitude === null ||
      longitude < -180 ||
      longitude > 180
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Longitude inválida.",
        },
        400
      );
    }

    if (
      !Number.isSafeInteger(
        ordem
      ) ||
      ordem < 1 ||
      ordem > 100000
    ) {
      return responder(
        {
          ok: false,
          erro:
            "A ordem deve ser um número inteiro entre 1 e 100000.",
        },
        400
      );
    }

    const {
      data: ponto,
      error: insertError,
    } = await supabaseAdmin
      .from("pontos_ronda")
      .insert({
        municipio_id:
          autenticacao.municipioId,
        nome_local:
          nomeLocal,
        latitude,
        longitude,
        obrigatorio,
        ordem,
        plano_id: null,
      })
      .select(
        `
          id,
          municipio_id,
          nome_local,
          latitude,
          longitude,
          ordem,
          obrigatorio,
          plano_id
        `
      )
      .single();

    if (insertError) {
      console.error(
        "Erro ao cadastrar ponto de visita:",
        {
          message:
            insertError.message,
          details:
            insertError.details,
          hint:
            insertError.hint,
          code:
            insertError.code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível cadastrar o ponto de visita.",
        },
        500
      );
    }

    const pontoId =
      Number(ponto.id);

    const urlCheckin =
      criarUrlCheckin(
        request,
        pontoId
      );

    await auditar({
      request,
      autenticacao,
      acao:
        "CADASTRAR_PONTO_VISITA",
      descricao:
        `Cadastrou o ponto de visita ${nomeLocal}.`,
      registroId:
        pontoId,
      detalhes: {
        local_id:
          localId || null,
        latitude,
        longitude,
        ordem,
        obrigatorio,
        url_checkin:
          urlCheckin,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Ponto salvo. QR Code gerado.",
        ponto,
        url_checkin:
          urlCheckin,
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado no POST /api/patrulhamento/visitas/qrcode:",
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
          "Erro interno ao cadastrar o ponto de visita.",
      },
      500
    );
  }
}