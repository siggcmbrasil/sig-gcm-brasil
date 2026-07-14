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

type PermissaoModulo = {
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type TipoPontoGPS =
  | "INICIAL"
  | "AUTOMATICO"
  | "MANUAL"
  | "FINAL";

type PontoEntrada = {
  latitude: unknown;
  longitude: unknown;
  precisao?: unknown;
  velocidade?: unknown;
  tipo?: unknown;
  observacao?: unknown;
  criado_em?: unknown;
};

type PontoValidado = {
  municipio_id: number;
  patrulhamento_id: number;
  guarda_id: null;
  viatura_id: null;
  latitude: number;
  longitude: number;
  precisao: number | null;
  velocidade: number | null;
  tipo: TipoPontoGPS;
  observacao: string | null;
  criado_em: string;
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

function texto(
  valor: unknown,
  limite = 500
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
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

function numeroOpcional(
  valor: unknown,
  minimo: number,
  maximo: number
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    return null;
  }

  return numero;
}

function tipoPonto(
  valor: unknown
): TipoPontoGPS | null {
  const tipo = texto(
    valor,
    30
  ).toUpperCase();

  if (
    tipo === "INICIAL" ||
    tipo === "AUTOMATICO" ||
    tipo === "MANUAL" ||
    tipo === "FINAL"
  ) {
    return tipo;
  }

  return null;
}

function validarDataCaptura(
  valor: unknown
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return new Date().toISOString();
  }

  const data = new Date(String(valor));

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  const agora = Date.now();
  const cincoMinutos = 5 * 60 * 1000;
  const trintaDias = 30 * 24 * 60 * 60 * 1000;

  if (
    data.getTime() > agora + cincoMinutos ||
    data.getTime() < agora - trintaDias
  ) {
    return null;
  }

  return data.toISOString();
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
    const municipioParametro =
      Number(
        request.nextUrl
          .searchParams
          .get("municipio_id")
      );

    if (
      Number.isSafeInteger(
        municipioParametro
      ) &&
      municipioParametro > 0
    ) {
      const {
        data: municipio,
        error,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq(
          "id",
          municipioParametro
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao validar município do GPS de patrulhamento:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );
      }

      if (municipio) {
        municipioId =
          municipioParametro;
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
          "Erro ao localizar município padrão do GPS:",
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
) {
  const accessToken =
    obterToken(request);

  if (!accessToken) {
    return {
      ok: false as const,
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
      ok: false as const,
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
      "Erro ao validar usuário do GPS de patrulhamento:",
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
      ok: false as const,
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
      ok: false as const,
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

  const perfil = texto(
    usuario.perfil,
    50
  ).toUpperCase();

  const status = texto(
    usuario.status,
    30
  ).toUpperCase();

  if (status !== "ATIVO") {
    return {
      ok: false as const,
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
      ok: false as const,
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

  let permissoes: PermissaoModulo = {
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
      .maybeSingle<PermissaoModulo>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissão do GPS de patrulhamento:",
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
        ok: false as const,
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

    permissoes = permissao || {
      pode_ver: false,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
    };
  }

  if (
    !permissoes.pode_criar &&
    !permissoes.pode_editar
  ) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para registrar pontos GPS.",
        },
        403
      ),
    };
  }

  return {
    ok: true as const,
    usuario,
    perfil,
    municipioId,
  };
}

function validarPonto({
  entrada,
  municipioId,
  patrulhamentoId,
}: {
  entrada: PontoEntrada;
  municipioId: number;
  patrulhamentoId: number;
}):
  | {
      ok: true;
      ponto: PontoValidado;
    }
  | {
      ok: false;
      erro: string;
    } {
  const latitude =
    numeroOpcional(
      entrada.latitude,
      -90,
      90
    );

  const longitude =
    numeroOpcional(
      entrada.longitude,
      -180,
      180
    );

  if (
    latitude === null ||
    longitude === null
  ) {
    return {
      ok: false,
      erro:
        "Latitude ou longitude inválida.",
    };
  }

  const tipo =
    tipoPonto(
      entrada.tipo
    );

  if (!tipo) {
    return {
      ok: false,
      erro:
        "Tipo de ponto GPS inválido.",
    };
  }

  const criadoEm =
    validarDataCaptura(
      entrada.criado_em
    );

  if (!criadoEm) {
    return {
      ok: false,
      erro:
        "Data de captura do ponto GPS inválida.",
    };
  }

  const precisao =
    numeroOpcional(
      entrada.precisao,
      0,
      100000
    );

  const velocidade =
    numeroOpcional(
      entrada.velocidade,
      0,
      1000
    );

  return {
    ok: true,
    ponto: {
      municipio_id:
        municipioId,
      patrulhamento_id:
        patrulhamentoId,
      guarda_id: null,
      viatura_id: null,
      latitude,
      longitude,
      precisao,
      velocidade,
      tipo,
      observacao:
        texto(
          entrada.observacao,
          1000
        ) || null,
      criado_em:
        criadoEm,
    },
  };
}

async function auditarResumo({
  request,
  usuario,
  perfil,
  municipioId,
  patrulhamentoId,
  pontos,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  patrulhamentoId: number;
  pontos: PontoValidado[];
}) {
  const somenteAutomaticos =
    pontos.every(
      (ponto) =>
        ponto.tipo ===
        "AUTOMATICO"
    );

  if (somenteAutomaticos) {
    return;
  }

  const tipos = pontos.reduce<
    Record<string, number>
  >((acumulado, ponto) => {
    acumulado[ponto.tipo] =
      (acumulado[ponto.tipo] || 0) +
      1;

    return acumulado;
  }, {});

  const { error } =
    await supabaseAdmin
      .from("auditoria")
      .insert({
        municipio_id:
          municipioId,
        guarda_id:
          usuario.id,
        usuario_nome:
          usuario.nome ||
          "Usuário",
        usuario_email:
          usuario.email ||
          "",
        perfil,
        modulo:
          "Patrulhamento",
        acao:
          pontos.length > 1
            ? "SINCRONIZAR_GPS"
            : "REGISTRAR_GPS",
        descricao:
          pontos.length > 1
            ? `Sincronizou ${pontos.length} pontos GPS do patrulhamento ${patrulhamentoId}.`
            : `Registrou ponto GPS ${pontos[0].tipo} do patrulhamento ${patrulhamentoId}.`,
        status:
          "SUCESSO",
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(
            request
          ),
        tabela:
          "gps_patrulhamento",
        registro_id:
          String(
            patrulhamentoId
          ),
        detalhes: {
          quantidade:
            pontos.length,
          tipos,
          primeiro_criado_em:
            pontos[0]
              .criado_em,
          ultimo_criado_em:
            pontos[
              pontos.length - 1
            ].criado_em,
        },
      });

  if (error) {
    console.error(
      "Erro ao auditar pontos GPS do patrulhamento:",
      {
        message:
          error.message,
        details:
          error.details,
        hint:
          error.hint,
        code:
          error.code,
      }
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

    const corpo = (await request
      .json()
      .catch(
        () => null
      )) as Record<
      string,
      unknown
    > | null;

    if (!corpo) {
      return responder(
        {
          ok: false,
          erro:
            "Dados do GPS não informados.",
        },
        400
      );
    }

    const patrulhamentoId =
      numeroId(
        corpo.patrulhamento_id
      );

    if (!patrulhamentoId) {
      return responder(
        {
          ok: false,
          erro:
            "Patrulhamento inválido.",
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
        "id,status"
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
        "Erro ao validar patrulhamento do ponto GPS:",
        {
          message:
            patrulhamentoError.message,
          details:
            patrulhamentoError.details,
          hint:
            patrulhamentoError.hint,
          code:
            patrulhamentoError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível validar o patrulhamento.",
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

    if (
      texto(
        patrulhamento.status,
        30
      ).toUpperCase() ===
      "FINALIZADO"
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Não é possível registrar GPS em um patrulhamento finalizado.",
        },
        409
      );
    }

    const entradas: PontoEntrada[] =
      Array.isArray(
        corpo.pontos
      )
        ? corpo.pontos.slice(
            0,
            200
          ) as PontoEntrada[]
        : [
            {
              latitude:
                corpo.latitude,
              longitude:
                corpo.longitude,
              precisao:
                corpo.precisao,
              velocidade:
                corpo.velocidade,
              tipo:
                corpo.tipo,
              observacao:
                corpo.observacao,
              criado_em:
                corpo.criado_em,
            },
          ];

    if (
      entradas.length === 0
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Nenhum ponto GPS foi informado.",
        },
        400
      );
    }

    const pontos: PontoValidado[] =
      [];

    for (
      let indice = 0;
      indice <
      entradas.length;
      indice += 1
    ) {
      const validacao =
        validarPonto({
          entrada:
            entradas[indice],
          municipioId:
            autenticacao.municipioId,
          patrulhamentoId,
        });

      if (!validacao.ok) {
        return responder(
          {
            ok: false,
            erro:
              `Ponto ${indice + 1}: ${validacao.erro}`,
          },
          400
        );
      }

      pontos.push(
        validacao.ponto
      );
    }

    const {
      data: inseridos,
      error: insertError,
    } = await supabaseAdmin
      .from(
        "gps_patrulhamento"
      )
      .insert(pontos)
      .select(
        `
          id,
          patrulhamento_id,
          latitude,
          longitude,
          precisao,
          velocidade,
          tipo,
          observacao,
          criado_em
        `
      );

    if (insertError) {
      console.error(
        "Erro ao salvar pontos GPS do patrulhamento:",
        {
          message:
            insertError.message,
          details:
            insertError.details,
          hint:
            insertError.hint,
          code:
            insertError.code,
          patrulhamento_id:
            patrulhamentoId,
          quantidade:
            pontos.length,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível registrar os pontos GPS.",
        },
        500
      );
    }

    await auditarResumo({
      request,
      usuario:
        autenticacao.usuario,
      perfil:
        autenticacao.perfil,
      municipioId:
        autenticacao.municipioId,
      patrulhamentoId,
      pontos,
    });

    return responder(
      {
        ok: true,
        mensagem:
          pontos.length > 1
            ? `${pontos.length} pontos GPS sincronizados com sucesso.`
            : "Ponto GPS registrado com sucesso.",
        quantidade:
          pontos.length,
        pontos:
          inseridos || [],
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado no POST /api/patrulhamento/gps:",
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
          "Erro interno ao registrar os pontos GPS.",
      },
      500
    );
  }
}