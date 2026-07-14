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

type CheckinRonda = {
  id: number;
  municipio_id: number;
  plano_id: number | null;
  ponto_id: number | null;
  usuario_id: number | null;
  nome: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  precisao: number | string | null;
  distancia_metros: number | string | null;
  observacao: string | null;
  foto_url: string | null;
  criado_em: string | null;
};

const BUCKET_FOTOS_RONDA =
  "documentos-guardas";

const LIMITE_PADRAO = 500;
const LIMITE_MAXIMO = 2000;

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
  limite = 1000
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
}

function normalizar(valor: unknown) {
  return texto(valor, 200)
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

function numeroInteiroPositivo(
  valor: unknown,
  padrao: number,
  maximo: number
) {
  const numero = Number(valor);

  if (
    !Number.isSafeInteger(numero) ||
    numero <= 0
  ) {
    return padrao;
  }

  return Math.min(
    numero,
    maximo
  );
}

function dataIsoInicio(
  valor: unknown
) {
  const textoData =
    texto(valor, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      textoData
    )
  ) {
    return null;
  }

  const data = new Date(
    `${textoData}T00:00:00.000-03:00`
  );

  return Number.isNaN(
    data.getTime()
  )
    ? null
    : data.toISOString();
}

function dataIsoFimExclusivo(
  valor: unknown
) {
  const textoData =
    texto(valor, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      textoData
    )
  ) {
    return null;
  }

  const data = new Date(
    `${textoData}T00:00:00.000-03:00`
  );

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return null;
  }

  data.setDate(
    data.getDate() + 1
  );

  return data.toISOString();
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

function extrairCaminhoStorage(
  fotoUrl: string | null
) {
  const valor =
    texto(fotoUrl, 2000);

  if (!valor) {
    return null;
  }

  try {
    const url = new URL(valor);

    const marcador =
      `/storage/v1/object/public/${BUCKET_FOTOS_RONDA}/`;

    const indice =
      url.pathname.indexOf(
        marcador
      );

    if (indice < 0) {
      return null;
    }

    const caminhoCodificado =
      url.pathname.slice(
        indice + marcador.length
      );

    const caminho =
      decodeURIComponent(
        caminhoCodificado
      );

    return caminho || null;
  } catch {
    return null;
  }
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
          "Erro ao validar município do relatório de visitas:",
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
          "Erro ao localizar município padrão do relatório de visitas:",
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
      "Erro ao validar usuário do relatório de visitas:",
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
        "Erro ao validar permissões do relatório de visitas:",
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
  status,
  registroId,
  detalhes,
}: {
  request: NextRequest;
  autenticacao: AutenticacaoSucesso;
  acao: string;
  descricao: string;
  status:
    | "SUCESSO"
    | "BLOQUEADO"
    | "ERRO";
  registroId?: number | null;
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
        status,
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(request),
        tabela:
          "checkins_ronda",
        registro_id:
          registroId
            ? String(registroId)
            : null,
        detalhes:
          detalhes || {},
      });

  if (error) {
    console.error(
      "Erro ao auditar relatório de visitas:",
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
          registroId || null,
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
            "Você não possui permissão para visualizar o relatório de visitas.",
        },
        403
      );
    }

    const pontoId =
      numeroId(
        request.nextUrl.searchParams.get(
          "ponto_id"
        )
      );

    const planoId =
      numeroId(
        request.nextUrl.searchParams.get(
          "plano_id"
        )
      );

    const usuarioId =
      numeroId(
        request.nextUrl.searchParams.get(
          "usuario_id"
        )
      );

    const dataInicio =
      dataIsoInicio(
        request.nextUrl.searchParams.get(
          "data_inicio"
        )
      );

    const dataFim =
      dataIsoFimExclusivo(
        request.nextUrl.searchParams.get(
          "data_fim"
        )
      );

    const busca =
      texto(
        request.nextUrl.searchParams.get(
          "busca"
        ),
        120
      );

    const limite =
      numeroInteiroPositivo(
        request.nextUrl.searchParams.get(
          "limite"
        ),
        LIMITE_PADRAO,
        LIMITE_MAXIMO
      );

    let consulta =
      supabaseAdmin
        .from("checkins_ronda")
        .select(
          `
            id,
            municipio_id,
            plano_id,
            ponto_id,
            usuario_id,
            nome,
            latitude,
            longitude,
            precisao,
            distancia_metros,
            observacao,
            foto_url,
            criado_em
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .order("criado_em", {
          ascending: false,
        })
        .limit(limite);

    if (pontoId) {
      consulta =
        consulta.eq(
          "ponto_id",
          pontoId
        );
    }

    if (planoId) {
      consulta =
        consulta.eq(
          "plano_id",
          planoId
        );
    }

    if (usuarioId) {
      consulta =
        consulta.eq(
          "usuario_id",
          usuarioId
        );
    }

    if (dataInicio) {
      consulta =
        consulta.gte(
          "criado_em",
          dataInicio
        );
    }

    if (dataFim) {
      consulta =
        consulta.lt(
          "criado_em",
          dataFim
        );
    }

    if (busca) {
      const termoSeguro =
        busca.replace(
          /[%_(),]/g,
          " "
        );

      consulta =
        consulta.or(
          `nome.ilike.%${termoSeguro}%,observacao.ilike.%${termoSeguro}%`
        );
    }

    const [
      checkinsResultado,
      pontosResultado,
      planosResultado,
    ] = await Promise.all([
      consulta,

      supabaseAdmin
        .from("pontos_ronda")
        .select(
          `
            id,
            nome_local
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .order("nome_local", {
          ascending: true,
        })
        .limit(2000),

      supabaseAdmin
        .from("planos_ronda")
        .select(
          `
            id,
            nome
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .order("nome", {
          ascending: true,
        })
        .limit(1000),
    ]);

    if (
      checkinsResultado.error ||
      pontosResultado.error ||
      planosResultado.error
    ) {
      const erro =
        checkinsResultado.error ||
        pontosResultado.error ||
        planosResultado.error;

      console.error(
        "Erro ao carregar relatório de visitas:",
        {
          message:
            erro?.message,
          details:
            erro?.details,
          hint:
            erro?.hint,
          code:
            erro?.code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      await auditar({
        request,
        autenticacao,
        acao:
          "RELATORIO_VISITAS_ERRO",
        descricao:
          "Erro ao carregar relatório de visitas.",
        status: "ERRO",
        detalhes: {
          erro:
            erro?.message,
          codigo:
            erro?.code,
        },
      });

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar o relatório de visitas.",
        },
        500
      );
    }

    const checkins =
      (checkinsResultado.data ||
        []) as CheckinRonda[];

    const dentroRaio =
      checkins.filter(
        (item) => {
          const distancia =
            Number(
              item.distancia_metros
            );

          return (
            Number.isFinite(
              distancia
            ) &&
            distancia <= 200
          );
        }
      ).length;

    const foraRaio =
      checkins.filter(
        (item) => {
          const distancia =
            Number(
              item.distancia_metros
            );

          return (
            Number.isFinite(
              distancia
            ) &&
            distancia > 200
          );
        }
      ).length;

    const comFoto =
      checkins.filter(
        (item) =>
          Boolean(
            texto(
              item.foto_url
            )
          )
      ).length;

    await auditar({
      request,
      autenticacao,
      acao:
        "VISUALIZAR_RELATORIO_VISITAS",
      descricao:
        "Visualizou o relatório de visitas.",
      status: "SUCESSO",
      detalhes: {
        filtros: {
          ponto_id:
            pontoId,
          plano_id:
            planoId,
          usuario_id:
            usuarioId,
          data_inicio:
            dataInicio,
          data_fim:
            dataFim,
          busca:
            busca || null,
          limite,
        },
        quantidade:
          checkins.length,
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
        checkins,
        pontos:
          pontosResultado.data || [],
        planos:
          planosResultado.data || [],
        resumo: {
          checkins:
            checkins.length,
          planos:
            planosResultado.data
              ?.length || 0,
          pontos:
            pontosResultado.data
              ?.length || 0,
          dentro_raio:
            dentroRaio,
          fora_raio:
            foraRaio,
          com_foto:
            comFoto,
        },
        limite_aplicado:
          limite,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/patrulhamento/visitas/relatorio:",
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
          "Erro interno ao carregar o relatório de visitas.",
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
            "Você não possui permissão para excluir check-ins de visita.",
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

    const checkinId =
      numeroId(corpo?.id);

    const motivo =
      texto(
        corpo?.motivo,
        500
      );

    if (!checkinId) {
      return responder(
        {
          ok: false,
          erro:
            "Identificador do check-in inválido.",
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
      data: checkin,
      error: buscaError,
    } = await supabaseAdmin
      .from("checkins_ronda")
      .select(
        `
          id,
          municipio_id,
          plano_id,
          ponto_id,
          usuario_id,
          nome,
          latitude,
          longitude,
          precisao,
          distancia_metros,
          observacao,
          foto_url,
          criado_em
        `
      )
      .eq("id", checkinId)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .maybeSingle<CheckinRonda>();

    if (buscaError) {
      console.error(
        "Erro ao localizar check-in para exclusão:",
        {
          message:
            buscaError.message,
          details:
            buscaError.details,
          hint:
            buscaError.hint,
          code:
            buscaError.code,
          checkin_id:
            checkinId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar o check-in.",
        },
        500
      );
    }

    if (!checkin) {
      return responder(
        {
          ok: false,
          erro:
            "Check-in não encontrado neste município.",
        },
        404
      );
    }

    const {
      error: deleteError,
    } = await supabaseAdmin
      .from("checkins_ronda")
      .delete()
      .eq("id", checkinId)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      );

    if (deleteError) {
      console.error(
        "Erro ao excluir check-in de visita:",
        {
          message:
            deleteError.message,
          details:
            deleteError.details,
          hint:
            deleteError.hint,
          code:
            deleteError.code,
          checkin_id:
            checkinId,
        }
      );

      await auditar({
        request,
        autenticacao,
        acao:
          "EXCLUIR_CHECKIN_VISITA_ERRO",
        descricao:
          "Erro ao excluir check-in de visita.",
        status: "ERRO",
        registroId:
          checkinId,
        detalhes: {
          motivo,
          erro:
            deleteError.message,
          codigo:
            deleteError.code,
        },
      });

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível excluir o check-in.",
        },
        500
      );
    }

    const caminhoFoto =
      extrairCaminhoStorage(
        checkin.foto_url
      );

    let fotoRemovida =
      false;

    if (caminhoFoto) {
      const {
        error: storageError,
      } = await supabaseAdmin.storage
        .from(
          BUCKET_FOTOS_RONDA
        )
        .remove([
          caminhoFoto,
        ]);

      if (storageError) {
        console.error(
          "Check-in excluído, mas a foto não pôde ser removida:",
          {
            message:
              storageError.message,
            caminho:
              caminhoFoto,
            checkin_id:
              checkinId,
          }
        );
      } else {
        fotoRemovida = true;
      }
    }

    await auditar({
      request,
      autenticacao,
      acao:
        "EXCLUIR_CHECKIN_VISITA",
      descricao:
        `Excluiu o check-in de visita ${checkinId}.`,
      status: "SUCESSO",
      registroId:
        checkinId,
      detalhes: {
        motivo,
        checkin_excluido:
          checkin,
        foto_storage:
          caminhoFoto,
        foto_removida:
          fotoRemovida,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Check-in excluído com sucesso.",
        id: checkinId,
        foto_removida:
          fotoRemovida,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no DELETE /api/patrulhamento/visitas/relatorio:",
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
          "Erro interno ao excluir o check-in.",
      },
      500
    );
  }
}