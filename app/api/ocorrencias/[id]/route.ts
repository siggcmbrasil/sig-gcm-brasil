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

type PermissaoOcorrencias = {
  pode_ver: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type OcorrenciaResumo = {
  id: number;
  municipio_id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  bairro: string | null;
  data: string | null;
  hora: string | null;
  status: string | null;
  prioridade: string | null;
  guarnicao_id: number | null;
  viatura_id: number | null;
  guarda_responsavel_id: number | null;
  criado_por: string | null;
};

type OcorrenciaDetalhada = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  status: string | null;
  data: string | null;
  hora: string | null;
  bairro: string | null;
  local: string | null;
  numero: string | null;
  envolvidos: string | null;
  veiculos_envolvidos: unknown;
  armas_objetos: unknown;
  descricao: string | null;
  foto_url: string | null;
  fotos_urls: string | null;
  latitude: string | null;
  longitude: string | null;
  viatura_empenhada: string | null;
  equipe_empenhada: string | null;
  criado_em: string | null;
  municipio_id: number | null;
  guarnicao_id: number | null;
  viatura_id: number | null;
  guarda_responsavel_id: number | null;
};

type Municipio = {
  id: number;
  nome: string;
  estado: string | null;
  brasao: string | null;
  brasao_prefeitura: string | null;
  brasao_gcm: string | null;
  nome_guarda: string | null;
  nome_corporacao: string | null;
  sigla_corporacao: string | null;
};

type Guarnicao = {
  id: number;
  nome: string;
};

type Viatura = {
  id: number;
  prefixo: string;
};

type Guarda = {
  id: number;
  nome: string;
};

type ContextoAutenticado = {
  usuario: UsuarioSistema;
  perfil: string;
  authEmail: string;
  permissao: PermissaoOcorrencias;
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

type OcorrenciaAuditavel = {
  id: number;
  municipio_id: number;
  protocolo: string | null;
};

const STATUS_VALIDOS = [
  "Aberta",
  "Em andamento",
  "Finalizada",
  "Cancelada",
] as const;

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

async function autenticar(
  request: NextRequest,
  campo: keyof PermissaoOcorrencias
): Promise<ResultadoAutenticacao> {
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
      "Erro ao validar usuário da ocorrência:",
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

  const perfil = String(
    usuario.perfil || ""
  ).toUpperCase();

  const status = String(
    usuario.status || ""
  ).toUpperCase();

  if (status !== "ATIVO") {
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

  if (
    perfil !== "DESENVOLVEDOR" &&
    !usuario.municipio_id
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário sem município vinculado.",
        },
        422
      ),
    };
  }

  let permissao: PermissaoOcorrencias = {
    pode_ver: true,
    pode_editar: true,
    pode_excluir: true,
  };

  if (perfil !== "DESENVOLVEDOR") {
    const {
      data: permissaoEncontrada,
      error: permissaoError,
    } = await supabaseAdmin
      .from("permissoes_perfis")
      .select("pode_ver,pode_editar,pode_excluir")
      .eq("municipio_id", usuario.municipio_id)
      .eq("perfil", perfil)
      .eq("modulo", "ocorrencias")
      .maybeSingle<PermissaoOcorrencias>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissão da ocorrência:",
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
            erro: "Não foi possível validar a permissão.",
          },
          500
        ),
      };
    }

    if (!permissaoEncontrada?.[campo]) {
      const mensagens: Record<
        keyof PermissaoOcorrencias,
        string
      > = {
        pode_ver:
          "Você não possui permissão para visualizar ocorrências.",
        pode_editar:
          "Você não possui permissão para alterar ocorrências.",
        pode_excluir:
          "Você não possui permissão para excluir ocorrências.",
      };

      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro: mensagens[campo],
          },
          403
        ),
      };
    }

    permissao = permissaoEncontrada;
  }

  return {
    ok: true,
    contexto: {
      usuario,
      perfil,
      authEmail:
        authUser.email || usuario.email || "",
      permissao,
    },
  };
}

async function localizarOcorrencia(
  id: number,
  contexto: ContextoAutenticado
) {
  let query = supabaseAdmin
    .from("ocorrencias")
    .select(
      `
        id,
        municipio_id,
        protocolo,
        tipo,
        local,
        bairro,
        data,
        hora,
        status,
        prioridade,
        guarnicao_id,
        viatura_id,
        guarda_responsavel_id,
        criado_por
      `
    )
    .eq("id", id);

  if (contexto.perfil !== "DESENVOLVEDOR") {
    query = query.eq(
      "municipio_id",
      contexto.usuario.municipio_id
    );
  }

  return query.maybeSingle<OcorrenciaResumo>();
}

async function localizarOcorrenciaDetalhada(
  id: number,
  contexto: ContextoAutenticado
) {
  let query = supabaseAdmin
    .from("ocorrencias")
    .select(
      `
        id,
        protocolo,
        tipo,
        status,
        data,
        hora,
        bairro,
        local,
        numero,
        envolvidos,
        veiculos_envolvidos,
        armas_objetos,
        descricao,
        foto_url,
        fotos_urls,
        latitude,
        longitude,
        viatura_empenhada,
        equipe_empenhada,
        criado_em,
        municipio_id,
        guarnicao_id,
        viatura_id,
        guarda_responsavel_id
      `
    )
    .eq("id", id);

  if (contexto.perfil !== "DESENVOLVEDOR") {
    query = query.eq(
      "municipio_id",
      contexto.usuario.municipio_id
    );
  }

  return query.maybeSingle<OcorrenciaDetalhada>();
}

async function registrarAuditoriaOcorrencia({
  request,
  contexto,
  ocorrencia,
  acao,
  descricao,
  detalhes,
}: {
  request: NextRequest;
  contexto: ContextoAutenticado;
  ocorrencia: OcorrenciaAuditavel;
  acao: string;
  descricao: string;
  detalhes: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin
    .from("auditoria")
    .insert({
      municipio_id: ocorrencia.municipio_id,
      guarda_id: contexto.usuario.id,
      usuario_nome:
        contexto.usuario.nome || "Usuário",
      usuario_email:
        contexto.authEmail || contexto.usuario.email || "",
      perfil: contexto.perfil,
      modulo: "Ocorrências",
      acao,
      descricao,
      status: "SUCESSO",
      ip: obterIp(request),
      dispositivo: obterDispositivo(request),
      tabela: "ocorrencias",
      registro_id: String(ocorrencia.id),
      detalhes,
    });

  if (error) {
    console.error(
      "Erro ao registrar auditoria da ocorrência:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        ocorrencia_id: ocorrencia.id,
      }
    );

    return false;
  }

  return true;
}

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const autenticacao = await autenticar(
      request,
      "pode_ver"
    );

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const { id: idParametro } =
      await context.params;

    const id = Number(idParametro);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return responder(
        {
          ok: false,
          erro: "Identificador da ocorrência inválido.",
        },
        400
      );
    }

    const {
      data: ocorrencia,
      error: ocorrenciaError,
    } = await localizarOcorrenciaDetalhada(
      id,
      autenticacao.contexto
    );

    if (ocorrenciaError) {
      console.error(
        "Erro ao carregar ocorrência detalhada:",
        {
          message: ocorrenciaError.message,
          details: ocorrenciaError.details,
          hint: ocorrenciaError.hint,
          code: ocorrenciaError.code,
          ocorrencia_id: id,
        }
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível carregar a ocorrência.",
        },
        500
      );
    }

    if (!ocorrencia) {
      return responder(
        {
          ok: false,
          erro:
            "Ocorrência não encontrada ou pertence a outro município.",
        },
        404
      );
    }

    if (!ocorrencia.municipio_id) {
      return responder(
        {
          ok: false,
          erro:
            "A ocorrência não possui município válido.",
        },
        422
      );
    }

    const municipioId = ocorrencia.municipio_id;

    const [
      municipioResposta,
      guarnicoesResposta,
      viaturasResposta,
      guardasResposta,
    ] = await Promise.all([
      supabaseAdmin
        .from("municipios")
        .select(
          `
            id,
            nome,
            estado,
            brasao,
            brasao_prefeitura,
            brasao_gcm,
            nome_guarda,
            nome_corporacao,
            sigla_corporacao
          `
        )
        .eq("id", municipioId)
        .limit(1),

      supabaseAdmin
        .from("guarnicoes")
        .select("id,nome")
        .eq("municipio_id", municipioId)
        .order("nome"),

      supabaseAdmin
        .from("viaturas")
        .select("id,prefixo")
        .eq("municipio_id", municipioId)
        .order("prefixo"),

      supabaseAdmin
        .from("guardas")
        .select("id,nome")
        .eq("municipio_id", municipioId)
        .order("nome"),
    ]);

    const erroApoio =
      municipioResposta.error ||
      guarnicoesResposta.error ||
      viaturasResposta.error ||
      guardasResposta.error;

    if (erroApoio) {
      console.error(
        "Erro ao carregar dados de apoio da ocorrência:",
        {
          message: erroApoio.message,
          details: erroApoio.details,
          hint: erroApoio.hint,
          code: erroApoio.code,
          ocorrencia_id: id,
          municipio_id: municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os dados de apoio da ocorrência.",
        },
        500
      );
    }

    const auditoriaRegistrada =
      await registrarAuditoriaOcorrencia({
        request,
        contexto: autenticacao.contexto,
        ocorrencia: {
          id: ocorrencia.id,
          municipio_id: municipioId,
          protocolo: ocorrencia.protocolo,
        },
        acao: "VISUALIZAR",
        descricao: `Visualizou a ocorrência ${
          ocorrencia.protocolo || ocorrencia.id
        }.`,
        detalhes: {
          origem: "GET /api/ocorrencias/[id]",
        },
      });

    if (!auditoriaRegistrada) {
      return responder(
        {
          ok: false,
          erro:
            "A ocorrência foi localizada, mas a auditoria de acesso não pôde ser registrada.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        contexto: {
          usuario_id:
            autenticacao.contexto.usuario.id,
          usuario_nome:
            autenticacao.contexto.usuario.nome,
          perfil:
            autenticacao.contexto.perfil,
          municipio_id: municipioId,
          pode_gerar_pdf:
            autenticacao.contexto.perfil !==
            "CONSULTA",
        },
        ocorrencia,
        municipios:
          (municipioResposta.data ||
            []) as Municipio[],
        guarnicoes:
          (guarnicoesResposta.data ||
            []) as Guarnicao[],
        viaturas:
          (viaturasResposta.data ||
            []) as Viatura[],
        guardas:
          (guardasResposta.data ||
            []) as Guarda[],
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/ocorrencias/[id]:",
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
          "Erro interno ao carregar a ocorrência.",
      },
      500
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const autenticacao = await autenticar(
      request,
      "pode_editar"
    );

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const { id: idParametro } =
      await context.params;

    const id = Number(idParametro);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return responder(
        {
          ok: false,
          erro: "Identificador da ocorrência inválido.",
        },
        400
      );
    }

    const corpo = await request
      .json()
      .catch(() => null);

    const novoStatus = String(
      corpo?.status || ""
    ).trim();

    if (
      !STATUS_VALIDOS.includes(
        novoStatus as (typeof STATUS_VALIDOS)[number]
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Status da ocorrência inválido.",
        },
        400
      );
    }

    const {
      data: ocorrencia,
      error: ocorrenciaError,
    } = await localizarOcorrencia(
      id,
      autenticacao.contexto
    );

    if (ocorrenciaError) {
      console.error(
        "Erro ao localizar ocorrência para alteração:",
        {
          message: ocorrenciaError.message,
          details: ocorrenciaError.details,
          hint: ocorrenciaError.hint,
          code: ocorrenciaError.code,
          ocorrencia_id: id,
        }
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível localizar a ocorrência.",
        },
        500
      );
    }

    if (!ocorrencia) {
      return responder(
        {
          ok: false,
          erro:
            "Ocorrência não encontrada ou pertence a outro município.",
        },
        404
      );
    }

    const statusAtual = String(
      ocorrencia.status || ""
    );

    if (statusAtual === "Finalizada") {
      return responder(
        {
          ok: false,
          erro:
            "Ocorrências finalizadas não podem ter o status alterado.",
        },
        409
      );
    }

    if (statusAtual === novoStatus) {
      return responder(
        {
          ok: true,
          ocorrencia,
          mensagem:
            "A ocorrência já possui este status.",
        },
        200
      );
    }

    const {
      data: ocorrenciaAtualizada,
      error: atualizacaoError,
    } = await supabaseAdmin
      .from("ocorrencias")
      .update({
        status: novoStatus,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", ocorrencia.id)
      .eq("municipio_id", ocorrencia.municipio_id)
      .select(
        `
          id,
          municipio_id,
          protocolo,
          tipo,
          local,
          bairro,
          data,
          hora,
          status,
          prioridade,
          guarnicao_id,
          viatura_id,
          guarda_responsavel_id,
          criado_por
        `
      )
      .single<OcorrenciaResumo>();

    if (atualizacaoError || !ocorrenciaAtualizada) {
      console.error(
        "Erro ao alterar status da ocorrência:",
        {
          message: atualizacaoError?.message,
          details: atualizacaoError?.details,
          hint: atualizacaoError?.hint,
          code: atualizacaoError?.code,
          ocorrencia_id: ocorrencia.id,
        }
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível atualizar a ocorrência.",
        },
        500
      );
    }

    const auditoriaRegistrada =
      await registrarAuditoriaOcorrencia({
        request,
        contexto: autenticacao.contexto,
        ocorrencia: ocorrenciaAtualizada,
        acao: "ALTERAR_STATUS",
        descricao: `Alterou o status da ocorrência ${
          ocorrencia.protocolo || ocorrencia.id
        } para ${novoStatus}.`,
        detalhes: {
          status_anterior: statusAtual,
          status_novo: novoStatus,
        },
      });

    if (!auditoriaRegistrada) {
      return responder(
        {
          ok: false,
          alterado: true,
          ocorrencia: ocorrenciaAtualizada,
          erro:
            "A ocorrência foi atualizada, mas a auditoria não pôde ser registrada.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        ocorrencia: ocorrenciaAtualizada,
        mensagem: "Status atualizado com sucesso.",
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no PATCH /api/ocorrencias/[id]:",
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
          "Erro interno ao atualizar a ocorrência.",
      },
      500
    );
  }
}


export async function PUT(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const autenticacao = await autenticar(
      request,
      "pode_editar"
    );

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const { id: idParametro } =
      await context.params;

    const id = Number(idParametro);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return responder(
        {
          ok: false,
          erro: "Identificador da ocorrência inválido.",
        },
        400
      );
    }

    const corpo = await request
      .json()
      .catch(() => null);

    if (!corpo || typeof corpo !== "object") {
      return responder(
        {
          ok: false,
          erro: "Dados da ocorrência não informados.",
        },
        400
      );
    }

    const tipo = String(
      corpo.tipo || ""
    )
      .trim()
      .slice(0, 150);

    const novoStatus = String(
      corpo.status || ""
    ).trim();

    const bairro = String(
      corpo.bairro || ""
    )
      .trim()
      .slice(0, 150);

    const local = String(
      corpo.local || ""
    )
      .trim()
      .slice(0, 300);

    const numero = String(
      corpo.numero || ""
    )
      .trim()
      .slice(0, 50);

    const descricao = String(
      corpo.descricao || ""
    )
      .trim()
      .slice(0, 20000);

    let envolvidos: string | null = null;

    if (
      corpo.envolvidos !== null &&
      corpo.envolvidos !== undefined &&
      corpo.envolvidos !== ""
    ) {
      if (
        typeof corpo.envolvidos === "string"
      ) {
        envolvidos = corpo.envolvidos
          .trim()
          .slice(0, 50000);
      } else {
        envolvidos = JSON.stringify(
          corpo.envolvidos
        ).slice(0, 50000);
      }
    }

    if (!tipo || !local || !descricao) {
      return responder(
        {
          ok: false,
          erro:
            "Preencha tipo, local e descrição da ocorrência.",
        },
        400
      );
    }

    if (
      !STATUS_VALIDOS.includes(
        novoStatus as (typeof STATUS_VALIDOS)[number]
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Status da ocorrência inválido.",
        },
        400
      );
    }

    const {
      data: ocorrenciaAtual,
      error: ocorrenciaError,
    } = await localizarOcorrenciaDetalhada(
      id,
      autenticacao.contexto
    );

    if (ocorrenciaError) {
      console.error(
        "Erro ao localizar ocorrência para edição:",
        {
          message: ocorrenciaError.message,
          details: ocorrenciaError.details,
          hint: ocorrenciaError.hint,
          code: ocorrenciaError.code,
          ocorrencia_id: id,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar a ocorrência.",
        },
        500
      );
    }

    if (
      !ocorrenciaAtual ||
      !ocorrenciaAtual.municipio_id
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Ocorrência não encontrada ou pertence a outro município.",
        },
        404
      );
    }

    if (
      String(ocorrenciaAtual.status || "") ===
      "Finalizada"
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Ocorrências finalizadas não podem ser editadas.",
        },
        409
      );
    }

    const dadosAtualizados = {
      tipo,
      status: novoStatus,
      bairro: bairro || null,
      local,
      numero: numero || null,
      envolvidos,
      descricao,
      atualizado_em: new Date().toISOString(),
    };

    const {
      data: ocorrenciaAtualizada,
      error: atualizacaoError,
    } = await supabaseAdmin
      .from("ocorrencias")
      .update(dadosAtualizados)
      .eq("id", ocorrenciaAtual.id)
      .eq(
        "municipio_id",
        ocorrenciaAtual.municipio_id
      )
      .select(
        `
          id,
          protocolo,
          tipo,
          status,
          data,
          hora,
          bairro,
          local,
          numero,
          envolvidos,
          veiculos_envolvidos,
          armas_objetos,
          descricao,
          foto_url,
          fotos_urls,
          latitude,
          longitude,
          viatura_empenhada,
          equipe_empenhada,
          criado_em,
          municipio_id,
          guarnicao_id,
          viatura_id,
          guarda_responsavel_id
        `
      )
      .single<OcorrenciaDetalhada>();

    if (
      atualizacaoError ||
      !ocorrenciaAtualizada ||
      !ocorrenciaAtualizada.municipio_id
    ) {
      console.error(
        "Erro ao editar ocorrência:",
        {
          message: atualizacaoError?.message,
          details: atualizacaoError?.details,
          hint: atualizacaoError?.hint,
          code: atualizacaoError?.code,
          ocorrencia_id: id,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível atualizar a ocorrência.",
        },
        500
      );
    }

    const auditoriaRegistrada =
      await registrarAuditoriaOcorrencia({
        request,
        contexto: autenticacao.contexto,
        ocorrencia: {
          id: ocorrenciaAtualizada.id,
          municipio_id:
            ocorrenciaAtualizada.municipio_id,
          protocolo:
            ocorrenciaAtualizada.protocolo,
        },
        acao: "EDITAR",
        descricao: `Atualizou a ocorrência ${
          ocorrenciaAtualizada.protocolo ||
          ocorrenciaAtualizada.id
        }.`,
        detalhes: {
          antes: {
            tipo: ocorrenciaAtual.tipo,
            status: ocorrenciaAtual.status,
            bairro: ocorrenciaAtual.bairro,
            local: ocorrenciaAtual.local,
            numero: ocorrenciaAtual.numero,
            envolvidos:
              ocorrenciaAtual.envolvidos,
            descricao:
              ocorrenciaAtual.descricao,
          },
          depois: {
            tipo:
              ocorrenciaAtualizada.tipo,
            status:
              ocorrenciaAtualizada.status,
            bairro:
              ocorrenciaAtualizada.bairro,
            local:
              ocorrenciaAtualizada.local,
            numero:
              ocorrenciaAtualizada.numero,
            envolvidos:
              ocorrenciaAtualizada.envolvidos,
            descricao:
              ocorrenciaAtualizada.descricao,
          },
        },
      });

    if (!auditoriaRegistrada) {
      return responder(
        {
          ok: false,
          alterado: true,
          ocorrencia: ocorrenciaAtualizada,
          erro:
            "A ocorrência foi atualizada, mas a auditoria não pôde ser registrada.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        ocorrencia: ocorrenciaAtualizada,
        mensagem:
          "Ocorrência atualizada com sucesso.",
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no PUT /api/ocorrencias/[id]:",
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
          "Erro interno ao editar a ocorrência.",
      },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const autenticacao = await autenticar(
      request,
      "pode_excluir"
    );

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const { id: idParametro } =
      await context.params;

    const id = Number(idParametro);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return responder(
        {
          ok: false,
          erro: "Identificador da ocorrência inválido.",
        },
        400
      );
    }

    const corpo = await request
      .json()
      .catch(() => null);

    const motivo = String(
      corpo?.motivo || ""
    )
      .trim()
      .slice(0, 1000);

    if (!motivo) {
      return responder(
        {
          ok: false,
          erro: "Informe o motivo da exclusão.",
        },
        400
      );
    }

    const {
      data: ocorrencia,
      error: ocorrenciaError,
    } = await localizarOcorrencia(
      id,
      autenticacao.contexto
    );

    if (ocorrenciaError) {
      console.error(
        "Erro ao localizar ocorrência para exclusão:",
        {
          message: ocorrenciaError.message,
          details: ocorrenciaError.details,
          hint: ocorrenciaError.hint,
          code: ocorrenciaError.code,
          ocorrencia_id: id,
        }
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível localizar a ocorrência.",
        },
        500
      );
    }

    if (!ocorrencia) {
      return responder(
        {
          ok: false,
          erro:
            "Ocorrência não encontrada ou pertence a outro município.",
        },
        404
      );
    }

    if (ocorrencia.status === "Finalizada") {
      return responder(
        {
          ok: false,
          erro:
            "Ocorrências finalizadas não podem ser excluídas.",
        },
        409
      );
    }

    const { error: exclusaoError } =
      await supabaseAdmin
        .from("ocorrencias")
        .delete()
        .eq("id", ocorrencia.id)
        .eq("municipio_id", ocorrencia.municipio_id);

    if (exclusaoError) {
      console.error(
        "Erro ao excluir ocorrência:",
        {
          message: exclusaoError.message,
          details: exclusaoError.details,
          hint: exclusaoError.hint,
          code: exclusaoError.code,
          ocorrencia_id: ocorrencia.id,
        }
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível excluir a ocorrência.",
        },
        500
      );
    }

    const auditoriaRegistrada =
      await registrarAuditoriaOcorrencia({
        request,
        contexto: autenticacao.contexto,
        ocorrencia,
        acao: "EXCLUIR",
        descricao: `Excluiu a ocorrência ${
          ocorrencia.protocolo || ocorrencia.id
        }.`,
        detalhes: {
          motivo,
          ocorrencia_excluida: ocorrencia,
        },
      });

    if (!auditoriaRegistrada) {
      return responder(
        {
          ok: false,
          excluida: true,
          erro:
            "A ocorrência foi excluída, mas a auditoria não pôde ser registrada.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        mensagem: "Ocorrência excluída com sucesso.",
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no DELETE /api/ocorrencias/[id]:",
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
          "Erro interno ao excluir a ocorrência.",
      },
      500
    );
  }
}