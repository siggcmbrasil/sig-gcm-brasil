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
  pode_criar: boolean;
};

type TipoConsulta =
  | "PESSOA"
  | "PLACA"
  | "RENAVAM";

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

function texto(valor: unknown, limite = 500) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function normalizarPlaca(valor: string) {
  return valor
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function formatarPlacaConsulta(valor: string) {
  const placa = normalizarPlaca(valor);

  if (placa.length !== 7) {
    return placa;
  }

  return `${placa.slice(0, 3)}-${placa.slice(3)}`;
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
      "Erro ao validar usuário da consulta operacional:",
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
          "Erro ao validar município da consulta operacional:",
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
      .select("pode_criar")
      .eq("municipio_id", municipioId)
      .eq("perfil", perfil)
      .eq("modulo", "ocorrencias")
      .maybeSingle<PermissaoOcorrencias>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissão da consulta operacional:",
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
              "Você não possui permissão para consultar dados durante o registro da ocorrência.",
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

    const tipo = texto(
      request.nextUrl.searchParams.get(
        "tipo"
      ),
      20
    ).toUpperCase() as TipoConsulta;

    const valor = texto(
      request.nextUrl.searchParams.get(
        "valor"
      ),
      100
    );

    if (
      tipo !== "PESSOA" &&
      tipo !== "PLACA" &&
      tipo !== "RENAVAM"
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

    if (!valor) {
      return responder(
        {
          ok: false,
          erro:
            "Valor da consulta não informado.",
        },
        400
      );
    }

    if (tipo === "PESSOA") {
      const documentoNumerico =
        somenteNumeros(valor);

      if (documentoNumerico.length < 5) {
        return responder(
          {
            ok: true,
            encontrado: false,
            registro: null,
          },
          200
        );
      }

      const candidatos = Array.from(
        new Set(
          [
            valor,
            documentoNumerico,
          ].filter(Boolean)
        )
      );

      const {
        data,
        error,
      } = await supabaseAdmin
        .from("pessoas_abordadas")
        .select(
          `
            id,
            nome,
            tipo_documento,
            documento,
            telefone,
            endereco,
            observacao
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .in("documento", candidatos)
        .order("atualizado_em", {
          ascending: false,
          nullsFirst: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao consultar pessoa abordada:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            municipio_id:
              autenticacao.municipioId,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível consultar a pessoa.",
          },
          500
        );
      }

      return responder(
        {
          ok: true,
          encontrado: Boolean(data),
          registro: data || null,
        },
        200
      );
    }

    if (tipo === "PLACA") {
      const placaNormalizada =
        normalizarPlaca(valor);

      if (placaNormalizada.length !== 7) {
        return responder(
          {
            ok: true,
            encontrado: false,
            registro: null,
          },
          200
        );
      }

      const candidatos = Array.from(
        new Set([
          placaNormalizada,
          formatarPlacaConsulta(
            placaNormalizada
          ),
        ])
      );

      const {
        data,
        error,
      } = await supabaseAdmin
        .from("veiculos_abordados")
        .select(
          `
            id,
            placa,
            tipo_especie,
            marca,
            modelo,
            ano,
            cor,
            renavam,
            chassi,
            proprietario,
            cpf_proprietario,
            telefone_proprietario,
            condutor,
            tipo_documento_condutor,
            documento_condutor,
            situacao,
            observacao
          `
        )
        .eq(
          "municipio_id",
          autenticacao.municipioId
        )
        .in("placa", candidatos)
        .order("atualizado_em", {
          ascending: false,
          nullsFirst: false,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao consultar veículo por placa:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
            municipio_id:
              autenticacao.municipioId,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível consultar o veículo.",
          },
          500
        );
      }

      return responder(
        {
          ok: true,
          encontrado: Boolean(data),
          registro: data || null,
        },
        200
      );
    }

    const renavam =
      somenteNumeros(valor);

    if (renavam.length !== 11) {
      return responder(
        {
          ok: true,
          encontrado: false,
          registro: null,
        },
        200
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("veiculos_abordados")
      .select(
        `
          id,
          placa,
          tipo_especie,
          marca,
          modelo,
          ano,
          cor,
          renavam,
          chassi,
          proprietario,
          cpf_proprietario,
          telefone_proprietario,
          condutor,
          tipo_documento_condutor,
          documento_condutor,
          situacao,
          observacao
        `
      )
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .eq("renavam", renavam)
      .order("atualizado_em", {
        ascending: false,
        nullsFirst: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao consultar veículo por Renavam:",
        {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível consultar o veículo.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        encontrado: Boolean(data),
        registro: data || null,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/ocorrencias/consultas:",
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
          "Erro interno ao realizar a consulta.",
      },
      500
    );
  }
}