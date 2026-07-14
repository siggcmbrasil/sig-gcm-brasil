import {
  NextRequest,
  NextResponse,
} from "next/server";

import { randomUUID } from "node:crypto";

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

type AutenticacaoSucesso = {
  ok: true;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  permissoes: PermissaoModulo;
};

type AutenticacaoFalha = {
  ok: false;
  resposta: NextResponse;
};

type AcaoChamado =
  | "ATENDER"
  | "FINALIZAR";

type DadosChamado = {
  solicitante: string;
  telefone: string;
  tipo: string;
  local: string;
  bairro: string;
  numero: string;
  referencia: string;
  tipo_local: string;
  prioridade: string;
  status: string;
  observacao: string;
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

function texto(
  valor: unknown,
  limite = 200
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

function gerarProtocolo() {
  const agora = new Date();

  const data = [
    agora.getFullYear(),
    String(
      agora.getMonth() + 1
    ).padStart(2, "0"),
    String(
      agora.getDate()
    ).padStart(2, "0"),
  ].join("");

  const hora = [
    String(
      agora.getHours()
    ).padStart(2, "0"),
    String(
      agora.getMinutes()
    ).padStart(2, "0"),
    String(
      agora.getSeconds()
    ).padStart(2, "0"),
  ].join("");

  const sufixo = randomUUID()
    .replace(/-/g, "")
    .slice(0, 5)
    .toUpperCase();

  return `CH-${data}-${hora}-${sufixo}`;
}

function normalizarStatus(
  valor: unknown,
  padrao = "Aberto"
) {
  const status = texto(
    valor,
    50
  ).toUpperCase();

  if (
    status === "ABERTO" ||
    status === "ABERTA"
  ) {
    return "Aberto";
  }

  if (
    status === "EM ATENDIMENTO"
  ) {
    return "Em Atendimento";
  }

  if (
    status === "FINALIZADO" ||
    status === "FINALIZADA"
  ) {
    return "Finalizado";
  }

  return padrao;
}

function normalizarPrioridade(
  valor: unknown
) {
  const prioridade = texto(
    valor,
    30
  ).toUpperCase();

  if (
    prioridade === "BAIXA" ||
    prioridade === "MEDIA" ||
    prioridade === "MÉDIA" ||
    prioridade === "ALTA" ||
    prioridade === "URGENTE"
  ) {
    if (
      prioridade === "MEDIA"
    ) {
      return "MÉDIA";
    }

    return prioridade;
  }

  return "MÉDIA";
}

function lerDadosChamado(
  corpo: Record<string, unknown>
): DadosChamado {
  return {
    solicitante: texto(
      corpo.solicitante,
      200
    ),
    telefone: texto(
      corpo.telefone,
      30
    ),
    tipo: texto(
      corpo.tipo,
      200
    ),
    local: texto(
      corpo.local,
      500
    ),
    bairro: texto(
      corpo.bairro,
      150
    ),
    numero: texto(
      corpo.numero,
      50
    ),
    referencia: texto(
      corpo.referencia,
      500
    ),
    tipo_local: texto(
      corpo.tipo_local,
      100
    ),
    prioridade:
      normalizarPrioridade(
        corpo.prioridade
      ),
    status: normalizarStatus(
      corpo.status,
      "Aberto"
    ),
    observacao: texto(
      corpo.observacao,
      5000
    ),
  };
}

function validarDadosChamado(
  dados: DadosChamado
) {
  if (!dados.tipo) {
    return "Informe o tipo do chamado.";
  }

  if (!dados.local) {
    return "Informe o local do chamado.";
  }

  return null;
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
    perfil !== "DESENVOLVEDOR"
  ) {
    const municipioId = Number(
      usuario.municipio_id || 0
    );

    return (
      Number.isSafeInteger(
        municipioId
      ) &&
      municipioId > 0
        ? municipioId
        : 0
    );
  }

  const municipioParametro =
    Number(
      request.nextUrl
        .searchParams
        .get("municipio_id")
    );

  if (
    !Number.isSafeInteger(
      municipioParametro
    ) ||
    municipioParametro <= 0
  ) {
    return 0;
  }

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
    .eq("ativo", true)
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao validar município dos chamados:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        municipio_id:
          municipioParametro,
      }
    );

    return 0;
  }

  return municipio
    ? municipioParametro
    : 0;
}

async function autenticar(
  request: NextRequest
): Promise<
  | AutenticacaoSucesso
  | AutenticacaoFalha
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
      "Erro ao validar usuário dos chamados:",
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
        "chamados"
      )
      .maybeSingle<PermissaoModulo>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissões dos chamados:",
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
            "Você não possui permissão para visualizar chamados.",
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

async function auditar({
  request,
  autenticacao,
  acao,
  descricao,
  registroId,
  detalhes,
}: {
  request: NextRequest;
  autenticacao:
    AutenticacaoSucesso;
  acao: string;
  descricao: string;
  registroId:
    string | number | null;
  detalhes?: Record<
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
        modulo: "Chamados",
        acao,
        descricao,
        status: "SUCESSO",
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(
            request
          ),
        tabela: "chamados",
        registro_id:
          registroId === null
            ? null
            : String(registroId),
        detalhes:
          detalhes || {},
      });

  if (error) {
    console.error(
      "Erro ao registrar auditoria de chamados:",
      {
        message:
          error.message,
        details:
          error.details,
        hint:
          error.hint,
        code:
          error.code,
        acao,
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

    const [
      chamadosResultado,
      locaisResultado,
      permissaoOcorrenciasResultado,
    ] = await Promise.all([
      supabaseAdmin
        .from("chamados")
        .select("*")
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .order("id", {
          ascending: false,
        }),

      supabaseAdmin
        .from("locais")
        .select(
          "id,nome,tipo"
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .eq("ativo", true)
        .order("nome", {
          ascending: true,
        }),

      autenticacao.perfil ===
      "DESENVOLVEDOR"
        ? Promise.resolve({
            data: {
              pode_criar: true,
            },
            error: null,
          })
        : supabaseAdmin
            .from(
              "permissoes_perfis"
            )
            .select("pode_criar")
            .eq(
              "municipio_id",
              autenticacao.municipioId
            )
            .eq(
              "perfil",
              autenticacao.perfil
            )
            .eq(
              "modulo",
              "ocorrencias"
            )
            .maybeSingle(),
    ]);

    if (
      chamadosResultado.error
    ) {
      console.error(
        "Erro ao carregar chamados:",
        {
          message:
            chamadosResultado.error
              .message,
          details:
            chamadosResultado.error
              .details,
          hint:
            chamadosResultado.error
              .hint,
          code:
            chamadosResultado.error
              .code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os chamados.",
        },
        500
      );
    }

    if (locaisResultado.error) {
      console.error(
        "Erro ao carregar locais dos chamados:",
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
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os locais.",
        },
        500
      );
    }

    if (
      permissaoOcorrenciasResultado.error
    ) {
      console.error(
        "Erro ao validar geração de ocorrência pelo chamado:",
        {
          message:
            permissaoOcorrenciasResultado
              .error.message,
          details:
            permissaoOcorrenciasResultado
              .error.details,
          hint:
            permissaoOcorrenciasResultado
              .error.hint,
          code:
            permissaoOcorrenciasResultado
              .error.code,
        }
      );
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
        permissoes: {
          ...autenticacao.permissoes,
          pode_atender:
            autenticacao.permissoes
              .pode_editar,
          pode_finalizar:
            autenticacao.permissoes
              .pode_editar,
          pode_gerar_ocorrencia:
            Boolean(
              permissaoOcorrenciasResultado
                .data?.pode_criar
            ),
        },
        chamados:
          chamadosResultado.data ||
          [],
        locais:
          locaisResultado.data ||
          [],
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/chamados:",
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
          "Erro interno ao carregar os chamados.",
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
            "Você não possui permissão para criar chamados.",
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
            "Dados do chamado não informados.",
        },
        400
      );
    }

    const dados =
      lerDadosChamado(corpo);

    const erroValidacao =
      validarDadosChamado(dados);

    if (erroValidacao) {
      return responder(
        {
          ok: false,
          erro: erroValidacao,
        },
        400
      );
    }

    const protocolo =
      gerarProtocolo();

    const {
      data: chamado,
      error,
    } = await supabaseAdmin
      .from("chamados")
      .insert({
        municipio_id:
          autenticacao.municipioId,
        protocolo,
        ...dados,
        status: "Aberto",
      })
      .select("*")
      .single();

    if (error || !chamado) {
      console.error(
        "Erro ao criar chamado:",
        {
          message:
            error?.message,
          details:
            error?.details,
          hint:
            error?.hint,
          code:
            error?.code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível registrar o chamado.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao: "CRIAR",
      descricao:
        `Registrou o chamado ${chamado.protocolo}.`,
      registroId:
        chamado.id,
      detalhes: {
        protocolo:
          chamado.protocolo,
        tipo:
          chamado.tipo,
        prioridade:
          chamado.prioridade,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Chamado registrado com sucesso.",
        chamado,
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado no POST /api/chamados:",
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
          "Erro interno ao registrar o chamado.",
      },
      500
    );
  }
}

export async function PUT(
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
        .pode_editar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para editar chamados.",
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
            "Dados do chamado não informados.",
        },
        400
      );
    }

    const id = numeroId(
      corpo.id
    );

    if (!id) {
      return responder(
        {
          ok: false,
          erro:
            "Chamado inválido.",
        },
        400
      );
    }

    const dados =
      lerDadosChamado(corpo);

    const erroValidacao =
      validarDadosChamado(dados);

    if (erroValidacao) {
      return responder(
        {
          ok: false,
          erro: erroValidacao,
        },
        400
      );
    }

    const {
      data: chamadoAnterior,
      error:
        chamadoAnteriorError,
    } = await supabaseAdmin
      .from("chamados")
      .select(
        "id,protocolo,status"
      )
      .eq("id", id)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .maybeSingle();

    if (chamadoAnteriorError) {
      console.error(
        "Erro ao localizar chamado antes da edição:",
        {
          message:
            chamadoAnteriorError.message,
          details:
            chamadoAnteriorError.details,
          hint:
            chamadoAnteriorError.hint,
          code:
            chamadoAnteriorError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar o chamado.",
        },
        500
      );
    }

    if (!chamadoAnterior) {
      return responder(
        {
          ok: false,
          erro:
            "Chamado não encontrado neste município.",
        },
        404
      );
    }

    const {
      data: chamado,
      error,
    } = await supabaseAdmin
      .from("chamados")
      .update(dados)
      .eq("id", id)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .select("*")
      .single();

    if (error || !chamado) {
      console.error(
        "Erro ao atualizar chamado:",
        {
          message:
            error?.message,
          details:
            error?.details,
          hint:
            error?.hint,
          code:
            error?.code,
          chamado_id: id,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível atualizar o chamado.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao: "EDITAR",
      descricao:
        `Atualizou o chamado ${chamado.protocolo || id}.`,
      registroId: id,
      detalhes: {
        protocolo:
          chamado.protocolo,
        status_anterior:
          chamadoAnterior.status,
        status_atual:
          chamado.status,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Chamado atualizado com sucesso.",
        chamado,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no PUT /api/chamados:",
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
          "Erro interno ao atualizar o chamado.",
      },
      500
    );
  }
}

export async function PATCH(
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
        .pode_editar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para alterar o atendimento do chamado.",
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
            "Dados da operação não informados.",
        },
        400
      );
    }

    const id = numeroId(
      corpo.id
    );

    const acao = texto(
      corpo.acao,
      30
    ).toUpperCase() as AcaoChamado;

    if (!id) {
      return responder(
        {
          ok: false,
          erro:
            "Chamado inválido.",
        },
        400
      );
    }

    if (
      acao !== "ATENDER" &&
      acao !== "FINALIZAR"
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Operação de chamado inválida.",
        },
        400
      );
    }

    const {
      data: chamadoAtual,
      error:
        chamadoAtualError,
    } = await supabaseAdmin
      .from("chamados")
      .select("*")
      .eq("id", id)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .maybeSingle();

    if (chamadoAtualError) {
      console.error(
        "Erro ao localizar chamado para alteração de status:",
        {
          message:
            chamadoAtualError.message,
          details:
            chamadoAtualError.details,
          hint:
            chamadoAtualError.hint,
          code:
            chamadoAtualError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar o chamado.",
        },
        500
      );
    }

    if (!chamadoAtual) {
      return responder(
        {
          ok: false,
          erro:
            "Chamado não encontrado neste município.",
        },
        404
      );
    }

    if (
      normalizarStatus(
        chamadoAtual.status
      ) === "Finalizado"
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Este chamado já está finalizado.",
        },
        409
      );
    }

    const agora =
      new Date().toISOString();

    const responsavel =
      autenticacao.usuario.nome ||
      autenticacao.usuario.email ||
      "Sistema";

    const atualizacao =
      acao === "ATENDER"
        ? {
            status:
              "Em Atendimento",
            atendido_por:
              responsavel,
            data_atendimento:
              agora,
          }
        : {
            status:
              "Finalizado",
            finalizado_em:
              agora,
            finalizado_por:
              responsavel,
            observacao_finalizacao:
              texto(
                corpo.observacao_finalizacao,
                5000
              ),
          };

    const {
      data: chamado,
      error,
    } = await supabaseAdmin
      .from("chamados")
      .update(atualizacao)
      .eq("id", id)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .select("*")
      .single();

    if (error || !chamado) {
      console.error(
        "Erro ao alterar status do chamado:",
        {
          message:
            error?.message,
          details:
            error?.details,
          hint:
            error?.hint,
          code:
            error?.code,
          chamado_id: id,
          acao,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            acao === "ATENDER"
              ? "Não foi possível iniciar o atendimento."
              : "Não foi possível finalizar o chamado.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao,
      descricao:
        acao === "ATENDER"
          ? `Iniciou o atendimento do chamado ${chamado.protocolo || id}.`
          : `Finalizou o chamado ${chamado.protocolo || id}.`,
      registroId: id,
      detalhes: {
        protocolo:
          chamado.protocolo,
        status_anterior:
          chamadoAtual.status,
        status_atual:
          chamado.status,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          acao === "ATENDER"
            ? "Chamado colocado em atendimento."
            : "Chamado finalizado com sucesso.",
        chamado,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no PATCH /api/chamados:",
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
          "Erro interno ao alterar o chamado.",
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
            "Você não possui permissão para excluir chamados.",
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

    const id = numeroId(
      corpo?.id
    );

    if (!id) {
      return responder(
        {
          ok: false,
          erro:
            "Chamado inválido.",
        },
        400
      );
    }

    const {
      data: chamado,
      error:
        chamadoError,
    } = await supabaseAdmin
      .from("chamados")
      .select(
        "id,protocolo,tipo,status"
      )
      .eq("id", id)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .maybeSingle();

    if (chamadoError) {
      console.error(
        "Erro ao localizar chamado antes da exclusão:",
        {
          message:
            chamadoError.message,
          details:
            chamadoError.details,
          hint:
            chamadoError.hint,
          code:
            chamadoError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar o chamado.",
        },
        500
      );
    }

    if (!chamado) {
      return responder(
        {
          ok: false,
          erro:
            "Chamado não encontrado neste município.",
        },
        404
      );
    }

    const { error } =
      await supabaseAdmin
        .from("chamados")
        .delete()
        .eq("id", id)
        .eq(
          "municipio_id",
          autenticacao.municipioId
        );

    if (error) {
      console.error(
        "Erro ao excluir chamado:",
        {
          message:
            error.message,
          details:
            error.details,
          hint:
            error.hint,
          code:
            error.code,
          chamado_id: id,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível excluir o chamado.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao: "EXCLUIR",
      descricao:
        `Excluiu o chamado ${chamado.protocolo || id}.`,
      registroId: id,
      detalhes: {
        protocolo:
          chamado.protocolo,
        tipo:
          chamado.tipo,
        status:
          chamado.status,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Chamado excluído com sucesso.",
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no DELETE /api/chamados:",
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
          "Erro interno ao excluir o chamado.",
      },
      500
    );
  }
}