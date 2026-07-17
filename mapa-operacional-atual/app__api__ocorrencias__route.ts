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
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type Municipio = {
  id: number;
  nome: string;
  estado: string | null;
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

export async function GET(
  request: NextRequest
) {
  try {
    const accessToken = obterToken(request);

    if (!accessToken) {
      return responder(
        {
          ok: false,
          erro:
            "Token de autenticação não informado.",
        },
        401
      );
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(
      accessToken
    );

    if (authError || !authUser) {
      return responder(
        {
          ok: false,
          erro:
            "Sessão inválida ou expirada.",
        },
        401
      );
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
        "Erro ao validar usuário das ocorrências:",
        {
          message: usuarioError.message,
          details: usuarioError.details,
          hint: usuarioError.hint,
          code: usuarioError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível validar o usuário.",
        },
        500
      );
    }

    if (!usuario) {
      return responder(
        {
          ok: false,
          erro:
            "Usuário não cadastrado no sistema.",
        },
        404
      );
    }

    const perfil = String(
      usuario.perfil || ""
    ).toUpperCase();

    const status = String(
      usuario.status || ""
    ).toUpperCase();

    if (status !== "ATIVO") {
      return responder(
        {
          ok: false,
          erro:
            "Usuário sem acesso ativo.",
        },
        403
      );
    }

    let municipioId: number;
    let municipios: Municipio[] = [];

    if (perfil === "DESENVOLVEDOR") {
      const {
        data: listaMunicipios,
        error: municipiosError,
      } = await supabaseAdmin
        .from("municipios")
        .select("id,nome,estado")
        .eq("ativo", true)
        .order("nome");

      if (municipiosError) {
        console.error(
          "Erro ao carregar municípios das ocorrências:",
          {
            message: municipiosError.message,
            details: municipiosError.details,
            hint: municipiosError.hint,
            code: municipiosError.code,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível carregar os municípios.",
          },
          500
        );
      }

      municipios =
        (listaMunicipios || []) as Municipio[];

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
        return responder(
          {
            ok: false,
            erro:
              "Selecione o município que será administrado.",
          },
          422
        );
      }

      const municipioValido =
        municipios.some(
          (item) =>
            Number(item.id) ===
            municipioParametro
        );

      if (!municipioValido) {
        return responder(
          {
            ok: false,
            erro:
              "Município inexistente ou inativo.",
          },
          404
        );
      }

      municipioId =
        municipioParametro;
    } else {
      if (!usuario.municipio_id) {
        return responder(
          {
            ok: false,
            erro:
              "Usuário sem município vinculado.",
          },
          422
        );
      }

      municipioId = usuario.municipio_id;
    }

    let permissao: PermissaoOcorrencias = {
      pode_ver: true,
      pode_criar: true,
      pode_editar: true,
      pode_excluir: true,
    };

    if (perfil !== "DESENVOLVEDOR") {
      const {
        data: permissaoEncontrada,
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
        .eq("municipio_id", municipioId)
        .eq("perfil", perfil)
        .eq("modulo", "ocorrencias")
        .maybeSingle<PermissaoOcorrencias>();

      if (permissaoError) {
        console.error(
          "Erro ao validar permissão de ocorrências:",
          {
            message: permissaoError.message,
            details: permissaoError.details,
            hint: permissaoError.hint,
            code: permissaoError.code,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível validar a permissão.",
          },
          500
        );
      }

      if (!permissaoEncontrada?.pode_ver) {
        return responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para visualizar ocorrências.",
          },
          403
        );
      }

      permissao = permissaoEncontrada;
    }

    const [
      ocorrenciasResposta,
      guarnicoesResposta,
      viaturasResposta,
      guardasResposta,
    ] = await Promise.all([
      supabaseAdmin
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
        .eq("municipio_id", municipioId)
        .order("data", {
          ascending: false,
        })
        .order("hora", {
          ascending: false,
        })
        .limit(100),

      supabaseAdmin
        .from("guarnicoes")
        .select("id,nome")
        .eq("municipio_id", municipioId)
        .order("nome")
        .limit(100),

      supabaseAdmin
        .from("viaturas")
        .select("id,prefixo")
        .eq("municipio_id", municipioId)
        .order("prefixo")
        .limit(100),

      supabaseAdmin
        .from("guardas")
        .select("id,nome")
        .eq("municipio_id", municipioId)
        .order("nome")
        .limit(200),
    ]);

    const erroConsulta =
      ocorrenciasResposta.error ||
      guarnicoesResposta.error ||
      viaturasResposta.error ||
      guardasResposta.error;

    if (erroConsulta) {
      console.error(
        "Erro ao carregar dados das ocorrências:",
        {
          message: erroConsulta.message,
          details: erroConsulta.details,
          hint: erroConsulta.hint,
          code: erroConsulta.code,
          municipio_id: municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os dados das ocorrências.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        contexto: {
          usuario_id: usuario.id,
          usuario_nome: usuario.nome,
          perfil,
          municipio_id: municipioId,
          municipios,
          pode_criar:
            permissao.pode_criar,
          pode_editar:
            permissao.pode_editar,
          pode_excluir:
            permissao.pode_excluir,
        },
        ocorrencias:
          ocorrenciasResposta.data || [],
        guarnicoes:
          guarnicoesResposta.data || [],
        viaturas:
          viaturasResposta.data || [],
        guardas:
          guardasResposta.data || [],
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/ocorrencias:",
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
          "Erro interno ao carregar ocorrências.",
      },
      500
    );
  }
}