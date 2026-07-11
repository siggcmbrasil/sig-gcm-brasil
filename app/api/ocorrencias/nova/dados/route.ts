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
  pode_criar: boolean;
};

type Guarda = {
  id: number;
  matricula: string | null;
  nome: string;
  cargo: string | null;
  status: string | null;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string | null;
  placa: string | null;
  status: string | null;
};

type LocalCadastrado = {
  id: number;
  nome: string;
  tipo: string | null;
};

type Guarnicao = {
  id: number;
  nome: string;
  comandante_id: number | null;
  viatura_id: number | null;
};

type ConfigEscalaOperacional = {
  id: number;
  data_base: string;
  guarnicao_base_id: number;
  ordem_guarnicoes: unknown;
};

type MembroGuarnicao = {
  guarda_id: number;
};

type ChamadoOrigem = {
  id: number | string;
  municipio_id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  bairro: string | null;
  numero: string | null;
  referencia: string | null;
  prioridade: string | null;
  observacao: string | null;
  solicitante: string | null;
  telefone: string | null;
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

function obterToken(request: NextRequest) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

function normalizarOrdemGuarnicoes(
  valor: unknown
): number[] {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => Number(item))
      .filter(
        (item) =>
          Number.isSafeInteger(item) &&
          item > 0
      );
  }

  if (typeof valor === "string") {
    try {
      return normalizarOrdemGuarnicoes(
        JSON.parse(valor)
      );
    } catch {
      return [];
    }
  }

  return [];
}

async function autenticarUsuario(
  request: NextRequest
) {
  const accessToken = obterToken(request);

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
  } = await supabaseAdmin.auth.getUser(
    accessToken
  );

  if (authError || !authUser) {
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
      "Erro ao validar usuário da nova ocorrência:",
      {
        message: usuarioError.message,
        details: usuarioError.details,
        hint: usuarioError.hint,
        code: usuarioError.code,
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

  const perfil = String(
    usuario.perfil || ""
  ).toUpperCase();

  const status = String(
    usuario.status || ""
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

  let municipioId = Number(
    usuario.municipio_id || 0
  );

  if (perfil === "DESENVOLVEDOR") {
    const municipioParametro = Number(
      request.nextUrl.searchParams.get(
        "municipio_id"
      )
    );

    if (
      !Number.isSafeInteger(
        municipioParametro
      ) ||
      municipioParametro <= 0
    ) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Selecione o município que será administrado.",
          },
          422
        ),
      };
    }

    const {
      data: municipioValido,
      error: municipioError,
    } = await supabaseAdmin
      .from("municipios")
      .select("id")
      .eq("id", municipioParametro)
      .eq("ativo", true)
      .maybeSingle();

    if (municipioError) {
      console.error(
        "Erro ao validar município da nova ocorrência:",
        {
          message:
            municipioError.message,
          details:
            municipioError.details,
          hint:
            municipioError.hint,
          code:
            municipioError.code,
          municipio_id:
            municipioParametro,
        }
      );

      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Não foi possível validar o município selecionado.",
          },
          500
        ),
      };
    }

    if (!municipioValido) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Município inexistente ou inativo.",
          },
          404
        ),
      };
    }

    municipioId = municipioParametro;
  }

  if (!municipioId) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Usuário sem município vinculado.",
        },
        422
      ),
    };
  }

  if (perfil !== "DESENVOLVEDOR") {
    const {
      data: permissao,
      error: permissaoError,
    } = await supabaseAdmin
      .from("permissoes_perfis")
      .select("pode_criar")
      .eq("municipio_id", municipioId)
      .eq("perfil", perfil)
      .eq("modulo", "ocorrencias")
      .maybeSingle<PermissaoOcorrencias>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissão para criar ocorrência:",
        {
          message: permissaoError.message,
          details: permissaoError.details,
          hint: permissaoError.hint,
          code: permissaoError.code,
        }
      );

      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Não foi possível validar a permissão.",
          },
          500
        ),
      };
    }

    if (!permissao?.pode_criar) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para registrar ocorrências.",
          },
          403
        ),
      };
    }
  }

  return {
    ok: true as const,
    usuario,
    perfil,
    municipioId,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const autenticacao =
      await autenticarUsuario(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const {
      usuario,
      perfil,
      municipioId,
    } = autenticacao;

    const chamadoId = String(
      request.nextUrl.searchParams.get(
        "chamado"
      ) || ""
    )
      .trim()
      .slice(0, 100);

    const [
      guardasResposta,
      viaturasResposta,
      locaisResposta,
      guarnicoesResposta,
      escalaResposta,
    ] = await Promise.all([
      supabaseAdmin
        .from("guardas")
        .select(
          "id,matricula,nome,cargo,status"
        )
        .eq("municipio_id", municipioId)
        .order("nome"),

      supabaseAdmin
        .from("viaturas")
        .select(
          "id,prefixo,modelo,placa,status"
        )
        .eq("municipio_id", municipioId)
        .in("status", [
          "Operacional",
          "Reserva",
        ])
        .order("prefixo"),

      supabaseAdmin
        .from("locais")
        .select("id,nome,tipo")
        .eq("municipio_id", municipioId)
        .eq("ativo", true)
        .order("nome"),

      supabaseAdmin
        .from("guarnicoes")
        .select(
          "id,nome,comandante_id,viatura_id"
        )
        .eq("municipio_id", municipioId)
        .eq("ativa", true)
        .order("nome"),

      supabaseAdmin
        .from("escala_operacional_config")
        .select(
          `
            id,
            data_base,
            guarnicao_base_id,
            ordem_guarnicoes
          `
        )
        .eq("municipio_id", municipioId)
        .eq("ativo", true)
        .maybeSingle<ConfigEscalaOperacional>(),
    ]);

    const erroCarregamento =
      guardasResposta.error ||
      viaturasResposta.error ||
      locaisResposta.error ||
      guarnicoesResposta.error ||
      escalaResposta.error;

    if (erroCarregamento) {
      console.error(
        "Erro ao carregar dados da nova ocorrência:",
        {
          message:
            erroCarregamento.message,
          details:
            erroCarregamento.details,
          hint: erroCarregamento.hint,
          code: erroCarregamento.code,
          municipio_id: municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os dados da nova ocorrência.",
        },
        500
      );
    }

    const guardas =
      (guardasResposta.data ||
        []) as Guarda[];

    const viaturas =
      (viaturasResposta.data ||
        []) as Viatura[];

    const guarnicoes =
      (guarnicoesResposta.data ||
        []) as Guarnicao[];

    const locais =
      (locaisResposta.data ||
        []) as LocalCadastrado[];

    let guarnicaoSugerida: {
      guarnicao_id: number;
      comandante_id: number | null;
      viatura_id: number | null;
      viatura_prefixo: string | null;
      membros_nomes: string[];
    } | null = null;

    const escala =
      escalaResposta.data || null;

    if (escala) {
      const ordem =
        normalizarOrdemGuarnicoes(
          escala.ordem_guarnicoes
        );

      const indiceBase = ordem.findIndex(
        (guarnicaoId) =>
          guarnicaoId ===
          Number(
            escala.guarnicao_base_id
          )
      );

      if (
        ordem.length > 0 &&
        indiceBase >= 0
      ) {
        const dataBase = new Date(
          `${escala.data_base}T07:00:00-03:00`
        );

        const agora = new Date();

        const diasPassados = Math.floor(
          (agora.getTime() -
            dataBase.getTime()) /
            86_400_000
        );

        const indiceAtual =
          ((indiceBase + diasPassados) %
            ordem.length +
            ordem.length) %
          ordem.length;

        const guarnicaoId =
          ordem[indiceAtual];

        const guarnicaoAtual =
          guarnicoes.find(
            (item) =>
              item.id === guarnicaoId
          );

        if (guarnicaoAtual) {
          const {
            data: membros,
            error: membrosError,
          } = await supabaseAdmin
            .from("guarnicao_membros")
            .select("guarda_id")
            .eq(
              "guarnicao_id",
              guarnicaoAtual.id
            );

          if (membrosError) {
            console.error(
              "Erro ao carregar membros da guarnição:",
              {
                message:
                  membrosError.message,
                details:
                  membrosError.details,
                hint: membrosError.hint,
                code: membrosError.code,
                guarnicao_id:
                  guarnicaoAtual.id,
              }
            );
          }

          const idsMembros = (
            (membros || []) as MembroGuarnicao[]
          ).map(
            (item) => item.guarda_id
          );

          const membrosNomes =
            guardas
              .filter((guarda) =>
                idsMembros.includes(
                  guarda.id
                )
              )
              .map(
                (guarda) => guarda.nome
              );

          const viaturaAtual =
            viaturas.find(
              (item) =>
                item.id ===
                guarnicaoAtual.viatura_id
            );

          guarnicaoSugerida = {
            guarnicao_id:
              guarnicaoAtual.id,
            comandante_id:
              guarnicaoAtual.comandante_id,
            viatura_id:
              guarnicaoAtual.viatura_id,
            viatura_prefixo:
              viaturaAtual?.prefixo ||
              null,
            membros_nomes:
              membrosNomes,
          };
        }
      }
    }

    let chamado: ChamadoOrigem | null =
      null;

    if (chamadoId) {
      const {
        data: chamadoEncontrado,
        error: chamadoError,
      } = await supabaseAdmin
        .from("chamados")
        .select(
          `
            id,
            municipio_id,
            protocolo,
            tipo,
            local,
            bairro,
            numero,
            referencia,
            prioridade,
            observacao,
            solicitante,
            telefone
          `
        )
        .eq("id", chamadoId)
        .eq(
          "municipio_id",
          municipioId
        )
        .maybeSingle<ChamadoOrigem>();

      if (chamadoError) {
        console.error(
          "Erro ao carregar chamado de origem:",
          {
            message:
              chamadoError.message,
            details:
              chamadoError.details,
            hint: chamadoError.hint,
            code: chamadoError.code,
            chamado_id: chamadoId,
            municipio_id: municipioId,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível carregar o chamado de origem.",
          },
          500
        );
      }

      chamado =
        chamadoEncontrado || null;
    }

    return responder(
      {
        ok: true,
        contexto: {
          usuario_id: usuario.id,
          usuario_nome: usuario.nome,
          perfil,
          municipio_id: municipioId,
          pode_criar: true,
        },
        guardas,
        viaturas,
        locais,
        guarnicoes,
        guarnicao_sugerida:
          guarnicaoSugerida,
        chamado,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/ocorrencias/nova/dados:",
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
          "Erro interno ao preparar a nova ocorrência.",
      },
      500
    );
  }
}