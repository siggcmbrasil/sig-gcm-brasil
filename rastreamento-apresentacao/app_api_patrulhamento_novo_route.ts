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

type Guarda = {
  id: number;
  matricula: string | null;
  nome: string | null;
  cargo: string | null;
  status: string | null;
};

type Viatura = {
  id: number;
  prefixo: string | null;
  modelo: string | null;
  placa: string | null;
  status: string | null;
};

type Guarnicao = {
  id: number;
  nome: string | null;
  comandante_id: number | null;
  viatura_id: number | null;
  ativa: boolean | null;
};

type MembroGuarnicao = {
  guarnicao_id: number;
  guarda_id: number;
};

type ConfigEscala = {
  data_base: string | null;
  ordem_guarnicoes: unknown;
  guarnicao_base_id: number | null;
};

type AutenticacaoSucesso = {
  ok: true;
  usuario: UsuarioSistema;
  authUserId: string;
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
    request.headers.get("user-agent") ||
    "Não identificado"
  ).slice(0, 500);
}

function dataValida(valor: unknown) {
  const data = texto(valor, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(data)
  ) {
    return null;
  }

  const [ano, mes, dia] = data
    .split("-")
    .map(Number);

  const verificada = new Date(
    Date.UTC(ano, mes - 1, dia)
  );

  if (
    verificada.getUTCFullYear() !== ano ||
    verificada.getUTCMonth() !== mes - 1 ||
    verificada.getUTCDate() !== dia
  ) {
    return null;
  }

  return data;
}

function horaValida(valor: unknown) {
  const hora = texto(valor, 5);

  if (
    !/^\d{2}:\d{2}$/.test(hora)
  ) {
    return null;
  }

  const [horas, minutos] = hora
    .split(":")
    .map(Number);

  if (
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    return null;
  }

  return hora;
}

function coordenada(
  valor: unknown,
  minimo: number,
  maximo: number
) {
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

  return coordenada(
    valor,
    minimo,
    maximo
  );
}

function idsUnicos(
  valor: unknown,
  limite = 30
) {
  if (!Array.isArray(valor)) {
    return [];
  }

  const ids = valor
    .map(numeroId)
    .filter(
      (id): id is number =>
        id !== null
    );

  return Array.from(
    new Set(ids)
  ).slice(0, limite);
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
  if (
    perfil !==
    "DESENVOLVEDOR"
  ) {
    return numeroId(
      usuario.municipio_id
    ) || 0;
  }

  const municipioId =
    numeroId(
      request.nextUrl
        .searchParams
        .get("municipio_id")
    );

  if (!municipioId) {
    return 0;
  }

  const {
    data: municipio,
    error,
  } = await supabaseAdmin
    .from("municipios")
    .select("id")
    .eq("id", municipioId)
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao validar município de contexto do patrulhamento:",
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
          municipioId,
      }
    );

    return 0;
  }

  return municipio
    ? municipioId
    : 0;
}

async function autenticar(
  request: NextRequest
): Promise<
  AutenticacaoSucesso | AutenticacaoFalha
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
    .eq("auth_id", authUser.id)
    .maybeSingle<UsuarioSistema>();

  if (usuarioError) {
    console.error(
      "Erro ao validar usuário do novo patrulhamento:",
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

  const perfil = normalizar(
    usuario.perfil
  );

  if (
    normalizar(usuario.status) !==
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
      .from("permissoes_perfis")
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
        "Erro ao validar permissões do novo patrulhamento:",
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
            "Você não possui permissão para acessar patrulhamentos.",
        },
        403
      ),
    };
  }

  return {
    ok: true,
    usuario,
    authUserId: authUser.id,
    perfil,
    municipioId,
    permissoes,
  };
}

function calcularGuarnicaoServico({
  config,
  guarnicoes,
  dataReferencia,
}: {
  config: ConfigEscala | null;
  guarnicoes: Guarnicao[];
  dataReferencia: string;
}) {
  if (
    !config?.data_base ||
    !Array.isArray(
      config.ordem_guarnicoes
    ) ||
    config.ordem_guarnicoes.length ===
      0 ||
    !config.guarnicao_base_id
  ) {
    return null;
  }

  const dataBase =
    dataValida(config.data_base);

  if (!dataBase) {
    return null;
  }

  const ordem =
    config.ordem_guarnicoes
      .map(numeroId)
      .filter(
        (id): id is number =>
          id !== null
      );

  if (ordem.length === 0) {
    return null;
  }

  const indiceBase =
    ordem.findIndex(
      (id) =>
        id ===
        Number(
          config.guarnicao_base_id
        )
    );

  if (indiceBase === -1) {
    return null;
  }

  const [anoBase, mesBase, diaBase] =
    dataBase.split("-").map(Number);

  const [
    anoReferencia,
    mesReferencia,
    diaReferencia,
  ] = dataReferencia
    .split("-")
    .map(Number);

  const baseUtc = Date.UTC(
    anoBase,
    mesBase - 1,
    diaBase
  );

  const referenciaUtc = Date.UTC(
    anoReferencia,
    mesReferencia - 1,
    diaReferencia
  );

  const diasPassados = Math.floor(
    (referenciaUtc - baseUtc) /
      86400000
  );

  const indiceAtual =
    ((indiceBase + diasPassados) %
      ordem.length +
      ordem.length) %
    ordem.length;

  const idAtual =
    ordem[indiceAtual];

  return (
    guarnicoes.find(
      (guarnicao) =>
        Number(guarnicao.id) ===
        idAtual
    ) || null
  );
}

async function auditar({
  request,
  autenticacao,
  registroId,
  descricao,
  detalhes,
}: {
  request: NextRequest;
  autenticacao:
    AutenticacaoSucesso;
  registroId: number;
  descricao: string;
  detalhes: Record<
    string,
    unknown
  >;
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
        acao: "CRIAR",
        descricao,
        status: "SUCESSO",
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(request),
        tabela:
          "patrulhamentos",
        registro_id:
          String(registroId),
        detalhes,
      });

  if (error) {
    console.error(
      "Erro ao auditar criação do patrulhamento:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        registro_id: registroId,
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
        .pode_criar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para iniciar patrulhamentos.",
        },
        403
      );
    }

    const hojeServidor =
      new Date()
        .toISOString()
        .slice(0, 10);

    const dataReferencia =
      dataValida(
        request.nextUrl.searchParams.get(
          "data_referencia"
        )
      ) || hojeServidor;

    const [
      guardasResultado,
      viaturasResultado,
      guarnicoesResultado,
      configResultado,
    ] = await Promise.all([
      supabaseAdmin
        .from("guardas")
        .select(
          `
            id,
            matricula,
            nome,
            cargo,
            status
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .order("nome", {
          ascending: true,
        }),
      supabaseAdmin
        .from("viaturas")
        .select(
          `
            id,
            prefixo,
            modelo,
            placa,
            status
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .order("prefixo", {
          ascending: true,
        }),
      supabaseAdmin
        .from("guarnicoes")
        .select(
          `
            id,
            nome,
            comandante_id,
            viatura_id,
            ativa
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .eq("ativa", true)
        .order("nome", {
          ascending: true,
        }),
      supabaseAdmin
        .from(
          "escala_operacional_config"
        )
        .select(
          `
            data_base,
            ordem_guarnicoes,
            guarnicao_base_id
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .eq("ativo", true)
        .maybeSingle<ConfigEscala>(),
    ]);

    const algumErro =
      guardasResultado.error ||
      viaturasResultado.error ||
      guarnicoesResultado.error ||
      configResultado.error;

    if (algumErro) {
      console.error(
        "Erro ao carregar dados do novo patrulhamento:",
        {
          message:
            algumErro.message,
          details:
            algumErro.details,
          hint:
            algumErro.hint,
          code:
            algumErro.code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os dados do patrulhamento.",
        },
        500
      );
    }

    const guardas = (
      guardasResultado.data || []
    ).filter((guarda) => {
      const status =
        normalizar(
          guarda.status
        );

      return ![
        "INATIVO",
        "BLOQUEADO",
        "EXONERADO",
        "DESLIGADO",
      ].includes(status);
    }) as Guarda[];

    const viaturas = (
      viaturasResultado.data || []
    ).filter((viatura) =>
      [
        "OPERACIONAL",
        "RESERVA",
      ].includes(
        normalizar(
          viatura.status
        )
      )
    ) as Viatura[];

    const guarnicoes = (
      guarnicoesResultado.data ||
      []
    ) as Guarnicao[];

    const guarnicaoIds =
      guarnicoes.map(
        (guarnicao) =>
          guarnicao.id
      );

    let membros: MembroGuarnicao[] =
      [];

    if (
      guarnicaoIds.length > 0
    ) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from(
          "guarnicao_membros"
        )
        .select(
          "guarnicao_id,guarda_id"
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .in(
          "guarnicao_id",
          guarnicaoIds
        );

      if (error) {
        console.error(
          "Erro ao carregar membros das guarnições:",
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
              "Não foi possível carregar os membros das guarnições.",
          },
          500
        );
      }

      membros =
        (data || []) as MembroGuarnicao[];
    }

    const guardaIdsPermitidos =
      new Set(
        guardas.map(
          (guarda) =>
            Number(guarda.id)
        )
      );

    const guarnicoesCompletas =
      guarnicoes.map(
        (guarnicao) => ({
          ...guarnicao,
          guarda_ids:
            membros
              .filter(
                (membro) =>
                  Number(
                    membro.guarnicao_id
                  ) ===
                  Number(
                    guarnicao.id
                  )
              )
              .map(
                (membro) =>
                  Number(
                    membro.guarda_id
                  )
              )
              .filter(
                (guardaId) =>
                  guardaIdsPermitidos.has(
                    guardaId
                  )
              ),
        })
      );

    const guarnicaoServico =
      calcularGuarnicaoServico({
        config:
          configResultado.data ||
          null,
        guarnicoes,
        dataReferencia,
      });

    const servicoCompleto =
      guarnicaoServico
        ? guarnicoesCompletas.find(
            (guarnicao) =>
              guarnicao.id ===
              guarnicaoServico.id
          ) || null
        : null;

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
        data_referencia:
          dataReferencia,
        guardas,
        viaturas,
        guarnicoes:
          guarnicoesCompletas,
        guarnicao_servico:
          servicoCompleto,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/patrulhamento/novo:",
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
          "Erro interno ao carregar o novo patrulhamento.",
      },
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  let patrulhamentoCriadoId:
    number | null = null;

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
            "Você não possui permissão para iniciar patrulhamentos.",
        },
        403
      );
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
            "Dados do patrulhamento não informados.",
        },
        400
      );
    }

    const data =
      dataValida(corpo.data);

    const hora =
      horaValida(corpo.hora);

    const local =
      texto(corpo.local, 300);

    const observacao =
      texto(
        corpo.observacao,
        3000
      );

    const guardaIds =
      idsUnicos(
        corpo.guarda_ids,
        30
      );

    const guarnicaoId =
      numeroId(
        corpo.guarnicao_id
      );

    let viaturaId =
      numeroId(
        corpo.viatura_id
      );

    const latitude =
      coordenada(
        corpo.latitude,
        -90,
        90
      );

    const longitude =
      coordenada(
        corpo.longitude,
        -180,
        180
      );

    const precisao =
      numeroOpcional(
        corpo.precisao,
        0,
        100000
      );

    const velocidade =
      numeroOpcional(
        corpo.velocidade,
        0,
        1000
      );

    if (!data || !hora) {
      return responder(
        {
          ok: false,
          erro:
            "Informe uma data e um horário válidos.",
        },
        400
      );
    }

    if (local.length < 3) {
      return responder(
        {
          ok: false,
          erro:
            "Informe o local ou a finalidade do patrulhamento.",
        },
        400
      );
    }

    if (
      guardaIds.length === 0
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Selecione pelo menos um guarda.",
        },
        400
      );
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Não foi possível validar o GPS inicial.",
        },
        400
      );
    }

    let guarnicao:
      Guarnicao | null = null;

    if (guarnicaoId) {
      const {
        data: encontrada,
        error,
      } = await supabaseAdmin
        .from("guarnicoes")
        .select(
          `
            id,
            nome,
            comandante_id,
            viatura_id,
            ativa
          `
        )
        .eq("id", guarnicaoId)
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .eq("ativa", true)
        .maybeSingle<Guarnicao>();

      if (error) {
        console.error(
          "Erro ao validar guarnição do patrulhamento:",
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
              "Não foi possível validar a guarnição.",
          },
          500
        );
      }

      if (!encontrada) {
        return responder(
          {
            ok: false,
            erro:
              "A guarnição selecionada não pertence a este município ou está inativa.",
          },
          400
        );
      }

      guarnicao = encontrada;

      if (
        !viaturaId &&
        guarnicao.viatura_id
      ) {
        viaturaId =
          Number(
            guarnicao.viatura_id
          );
      }
    }

    const {
      data: guardasEncontrados,
      error: guardasError,
    } = await supabaseAdmin
      .from("guardas")
      .select(
        `
          id,
          matricula,
          nome,
          cargo,
          status
        `
      )
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .in("id", guardaIds);

    if (guardasError) {
      console.error(
        "Erro ao validar guardas do patrulhamento:",
        {
          message:
            guardasError.message,
          details:
            guardasError.details,
          hint:
            guardasError.hint,
          code:
            guardasError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível validar a equipe.",
        },
        500
      );
    }

    const guardas =
      (guardasEncontrados ||
        []) as Guarda[];

    if (
      guardas.length !==
      guardaIds.length
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Um ou mais guardas selecionados não pertencem a este município.",
        },
        400
      );
    }

    const guardaBloqueado =
      guardas.find((guarda) => {
        const status =
          normalizar(
            guarda.status
          );

        return [
          "INATIVO",
          "BLOQUEADO",
          "EXONERADO",
          "DESLIGADO",
        ].includes(status);
      });

    if (guardaBloqueado) {
      return responder(
        {
          ok: false,
          erro:
            `O guarda ${guardaBloqueado.nome || guardaBloqueado.id} está com status ${normalizar(guardaBloqueado.status) || "INVÁLIDO"}.`,
        },
        400
      );
    }

    const guardasOrdenados =
      guardaIds.map(
        (id) =>
          guardas.find(
            (guarda) =>
              Number(guarda.id) ===
              id
          )
      ).filter(
        (guarda): guarda is Guarda =>
          Boolean(guarda)
      );

    let viatura:
      Viatura | null = null;

    if (viaturaId) {
      const {
        data: encontrada,
        error,
      } = await supabaseAdmin
        .from("viaturas")
        .select(
          `
            id,
            prefixo,
            modelo,
            placa,
            status
          `
        )
        .eq("id", viaturaId)
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .maybeSingle<Viatura>();

      if (error) {
        console.error(
          "Erro ao validar viatura do patrulhamento:",
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
              "Não foi possível validar a viatura.",
          },
          500
        );
      }

      if (!encontrada) {
        return responder(
          {
            ok: false,
            erro:
              "A viatura selecionada não pertence a este município.",
          },
          400
        );
      }

      if (
        ![
          "OPERACIONAL",
          "RESERVA",
        ].includes(
          normalizar(
            encontrada.status
          )
        )
      ) {
        return responder(
          {
            ok: false,
            erro:
              "A viatura selecionada não está disponível para patrulhamento.",
          },
          400
        );
      }

      viatura = encontrada;
    }

    const nomes =
      guardasOrdenados
        .map(
          (guarda) =>
            texto(
              guarda.nome,
              200
            )
        )
        .filter(Boolean);

    if (nomes.length === 0) {
      return responder(
        {
          ok: false,
          erro:
            "A equipe selecionada não possui nomes válidos.",
        },
        400
      );
    }

    const guardaPrincipal =
      nomes[0];

    const equipe =
      nomes.join("\n");

    const viaturaTexto =
      texto(
        viatura?.prefixo,
        100
      );

    const criadoEm =
      new Date().toISOString();

    const {
      data: patrulhamento,
      error: insertError,
    } = await supabaseAdmin
      .from("patrulhamentos")
      .insert({
        municipio_id:
          autenticacao.municipioId,
        criado_por:
          autenticacao.authUserId,
        criado_em:
          criadoEm,
        data,
        hora,
        local,
        guarda:
          guardaPrincipal,
        equipe,
        viatura:
          viaturaTexto || null,
        latitude,
        longitude,
        observacao:
          observacao || null,
        status:
          "EM_ANDAMENTO",
      })
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
          criado_em
        `
      )
      .single();

    if (
      insertError ||
      !patrulhamento
    ) {
      console.error(
        "Erro ao criar patrulhamento:",
        {
          message:
            insertError?.message,
          details:
            insertError?.details,
          hint:
            insertError?.hint,
          code:
            insertError?.code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível iniciar o patrulhamento.",
        },
        500
      );
    }

    patrulhamentoCriadoId =
      Number(
        patrulhamento.id
      );

    const {
      error: gpsError,
    } = await supabaseAdmin
      .from(
        "gps_patrulhamento"
      )
      .insert({
        municipio_id:
          autenticacao.municipioId,
        patrulhamento_id:
          patrulhamentoCriadoId,
        guarda_id: null,
        viatura_id: null,
        latitude,
        longitude,
        velocidade,
        precisao,
        tipo: "INICIAL",
        observacao:
          "Ponto inicial do patrulhamento",
        criado_em:
          criadoEm,
      });

    if (gpsError) {
      const {
        error: rollbackError,
      } = await supabaseAdmin
        .from("patrulhamentos")
        .delete()
        .eq(
          "id",
          patrulhamentoCriadoId
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        );

      if (rollbackError) {
        console.error(
          "Erro ao desfazer patrulhamento após falha no GPS inicial:",
          {
            message:
              rollbackError.message,
            details:
              rollbackError.details,
            hint:
              rollbackError.hint,
            code:
              rollbackError.code,
            patrulhamento_id:
              patrulhamentoCriadoId,
          }
        );
      }

      console.error(
        "Erro ao salvar GPS inicial:",
        {
          message:
            gpsError.message,
          details:
            gpsError.details,
          hint:
            gpsError.hint,
          code:
            gpsError.code,
          patrulhamento_id:
            patrulhamentoCriadoId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível salvar o ponto GPS inicial. O patrulhamento não foi iniciado.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      registroId:
        patrulhamentoCriadoId,
      descricao:
        `Iniciou patrulhamento em ${local}.`,
      detalhes: {
        guarnicao_id:
          guarnicao?.id || null,
        guarnicao_nome:
          guarnicao?.nome || null,
        guarda_ids:
          guardaIds,
        equipe:
          nomes,
        viatura_id:
          viatura?.id || null,
        viatura:
          viaturaTexto || null,
        latitude,
        longitude,
        precisao,
        criado_em:
          criadoEm,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Patrulhamento iniciado com sucesso.",
        patrulhamento,
        rastreamento: {
          municipio_id:
            autenticacao.municipioId,
          patrulhamento_id:
            patrulhamentoCriadoId,
        },
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado no POST /api/patrulhamento/novo:",
      {
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        patrulhamento_id:
          patrulhamentoCriadoId,
        error,
      }
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao iniciar o patrulhamento.",
      },
      500
    );
  }
}