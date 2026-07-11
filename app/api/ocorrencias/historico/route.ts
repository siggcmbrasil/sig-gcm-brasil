import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioSistema = {
  id: number;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type PermissaoOcorrencias = {
  pode_ver: boolean;
};

type OcorrenciaHistorico = {
  id: number;
  protocolo: string | null;
  data: string | null;
  status: string | null;
  envolvidos?: unknown;
  veiculos_envolvidos?: unknown;
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

function normalizarTexto(valor: unknown) {
  return String(valor ?? "")
    .trim()
    .toUpperCase();
}

function converterLista(
  valor: unknown
): Record<string, unknown>[] {
  if (Array.isArray(valor)) {
    return valor.filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        !Array.isArray(item)
    );
  }

  if (typeof valor !== "string") {
    return [];
  }

  try {
    const dados = JSON.parse(valor);

    return Array.isArray(dados)
      ? dados.filter(
          (
            item
          ): item is Record<string, unknown> =>
            Boolean(item) &&
            typeof item === "object" &&
            !Array.isArray(item)
        )
      : [];
  } catch {
    return [];
  }
}

async function autenticar(
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
      "id,perfil,status,municipio_id"
    )
    .eq("auth_id", authUser.id)
    .maybeSingle<UsuarioSistema>();

  if (usuarioError) {
    console.error(
      "Erro ao validar usuário do histórico:",
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

  const perfil = normalizarTexto(
    usuario.perfil
  );

  const status = normalizarTexto(
    usuario.status
  );

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
      Number.isSafeInteger(
        municipioParametro
      ) &&
      municipioParametro > 0
    ) {
      const {
        data: municipio,
        error: municipioError,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", municipioParametro)
        .maybeSingle();

      if (municipioError) {
        console.error(
          "Erro ao validar município do histórico:",
          municipioError
        );
      }

      if (municipio) {
        municipioId = municipioParametro;
      }
    }
  }

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

  if (perfil !== "DESENVOLVEDOR") {
    const {
      data: permissao,
      error: permissaoError,
    } = await supabaseAdmin
      .from("permissoes_perfis")
      .select("pode_ver")
      .eq("municipio_id", municipioId)
      .eq("perfil", perfil)
      .eq("modulo", "ocorrencias")
      .maybeSingle<PermissaoOcorrencias>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissão do histórico:",
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

    if (!permissao?.pode_ver) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para consultar o histórico.",
          },
          403
        ),
      };
    }
  }

  return {
    ok: true as const,
    municipioId,
  };
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

    const tipo = normalizarTexto(
      request.nextUrl.searchParams.get(
        "tipo"
      )
    );

    const valor = normalizarTexto(
      request.nextUrl.searchParams.get(
        "valor"
      )
    );

    if (
      tipo !== "VEICULO" &&
      tipo !== "PESSOA"
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Tipo de consulta inválido.",
        },
        400
      );
    }

    if (
      (tipo === "VEICULO" &&
        valor.length < 7) ||
      (tipo === "PESSOA" &&
        valor.length < 3)
    ) {
      return responder(
        {
          ok: true,
          registros: [],
        },
        200
      );
    }

    const coluna =
      tipo === "VEICULO"
        ? "veiculos_envolvidos"
        : "envolvidos";

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("ocorrencias")
      .select(
        `id,protocolo,data,status,${coluna}`
      )
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .order("data", {
        ascending: false,
      })
      .limit(100);

    if (error) {
      console.error(
        "Erro ao consultar histórico de ocorrências:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          tipo,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível consultar o histórico.",
        },
        500
      );
    }

    const registros = (
      (data || []) as OcorrenciaHistorico[]
    )
      .filter((ocorrencia) => {
        const lista = converterLista(
          tipo === "VEICULO"
            ? ocorrencia.veiculos_envolvidos
            : ocorrencia.envolvidos
        );

        if (tipo === "VEICULO") {
          return lista.some((item) => {
            const placa =
              normalizarTexto(
                item.placa
              ).replace(
                /[^A-Z0-9]/g,
                ""
              );

            const consulta =
              valor.replace(
                /[^A-Z0-9]/g,
                ""
              );

            return placa === consulta;
          });
        }

        return lista.some((item) => {
          const nome =
            normalizarTexto(
              item.nome
            );

          const documento =
            normalizarTexto(
              item.documento
            );

          return (
            nome.includes(valor) ||
            documento.includes(valor)
          );
        });
      })
      .map((ocorrencia) => ({
        id: ocorrencia.id,
        protocolo:
          ocorrencia.protocolo,
        data: ocorrencia.data,
        status: ocorrencia.status,
      }))
      .slice(0, 20);

    return responder(
      {
        ok: true,
        registros,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/ocorrencias/historico:",
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
          "Erro interno ao consultar o histórico.",
      },
      500
    );
  }
}