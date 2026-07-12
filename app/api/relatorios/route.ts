import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime =
  "nodejs";
export const dynamic =
  "force-dynamic";

type Modulo =
  | "ocorrencias"
  | "patrulhamentos"
  | "chamados"
  | "viaturas"
  | "guardas";

type UsuarioSistema = {
  id: number;
  nome: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type Municipio = {
  id: number;
  nome: string | null;
  estado: string | null;
  nome_guarda: string | null;
  comandante: string | null;
  brasao: string | null;
  brasao_prefeitura: string | null;
  brasao_gcm: string | null;
  ativo: boolean | null;
};

type Permissao = {
  pode_ver: boolean | null;
};

const LIMITE =
  1000;

const MODULOS: Record<
  Modulo,
  {
    tabela: string;
    campoData: string;
  }
> = {
  ocorrencias: {
    tabela: "ocorrencias",
    campoData: "data",
  },
  patrulhamentos: {
    tabela: "patrulhamentos",
    campoData: "data",
  },
  chamados: {
    tabela: "chamados",
    campoData: "criado_em",
  },
  viaturas: {
    tabela: "viaturas",
    campoData: "criado_em",
  },
  guardas: {
    tabela: "guardas",
    campoData: "criado_em",
  },
};

function responder(
  corpo: Record<
    string,
    unknown
  >,
  status: number
) {
  return NextResponse.json(
    corpo,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

function tokenBearer(
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

function idPositivo(
  valor: unknown
) {
  const numero =
    Number(valor);

  if (
    !Number.isSafeInteger(
      numero
    ) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function dataValida(
  valor: string | null
) {
  if (!valor) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      valor
    )
  ) {
    return null;
  }

  return valor;
}

export async function GET(
  request: NextRequest
) {
  try {
    const token =
      tokenBearer(request);

    if (!token) {
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
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      authError ||
      !authUser
    ) {
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
          nome,
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

    if (
      usuarioError ||
      !usuario
    ) {
      console.error(
        "Erro ao validar usuário dos relatórios:",
        {
          message:
            usuarioError?.message,
          details:
            usuarioError?.details,
          hint:
            usuarioError?.hint,
          code:
            usuarioError?.code,
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

    const perfil =
      String(
        usuario.perfil || ""
      )
        .trim()
        .toUpperCase();

    const status =
      String(
        usuario.status || ""
      )
        .trim()
        .toUpperCase();

    if (
      status !== "ATIVO"
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Usuário sem acesso ativo.",
        },
        403
      );
    }

    const modulo =
      String(
        request.nextUrl
          .searchParams
          .get("modulo") ||
          ""
      )
        .trim()
        .toLowerCase() as
        Modulo;

    const config =
      MODULOS[modulo];

    if (!config) {
      return responder(
        {
          ok: false,
          erro:
            "Módulo de relatório inválido.",
        },
        422
      );
    }

    let municipioId =
      idPositivo(
        usuario.municipio_id
      );

    if (
      perfil ===
      "DESENVOLVEDOR"
    ) {
      municipioId =
        idPositivo(
          request.nextUrl
            .searchParams
            .get(
              "municipio_id"
            )
        );

      if (!municipioId) {
        return responder(
          {
            ok: false,
            erro:
              "Selecione o município que será consultado.",
          },
          422
        );
      }
    }

    if (!municipioId) {
      return responder(
        {
          ok: false,
          erro:
            "Usuário sem município vinculado.",
        },
        422
      );
    }

    const {
      data: municipio,
      error: municipioError,
    } = await supabaseAdmin
      .from("municipios")
      .select(
        `
          id,
          nome,
          estado,
          nome_guarda,
          comandante,
          brasao,
          brasao_prefeitura,
          brasao_gcm,
          ativo
        `
      )
      .eq(
        "id",
        municipioId
      )
      .maybeSingle<Municipio>();

    if (
      municipioError ||
      !municipio
    ) {
      console.error(
        "Erro ao carregar município dos relatórios:",
        {
          message:
            municipioError?.message,
          details:
            municipioError?.details,
          hint:
            municipioError?.hint,
          code:
            municipioError?.code,
          municipio_id:
            municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar o município.",
        },
        500
      );
    }

    if (
      municipio.ativo ===
      false
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Município inativo.",
        },
        403
      );
    }

    if (
      perfil !==
      "DESENVOLVEDOR"
    ) {
      const {
        data: permissao,
        error:
          permissaoError,
      } = await supabaseAdmin
        .from(
          "permissoes_perfis"
        )
        .select("pode_ver")
        .eq(
          "municipio_id",
          municipioId
        )
        .eq(
          "perfil",
          perfil
        )
        .eq(
          "modulo",
          "relatorios"
        )
        .maybeSingle<Permissao>();

      if (permissaoError) {
        console.error(
          "Erro ao validar permissão de relatórios:",
          {
            message:
              permissaoError.message,
            details:
              permissaoError.details,
            hint:
              permissaoError.hint,
            code:
              permissaoError.code,
            municipio_id:
              municipioId,
            perfil,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível validar a permissão de relatórios.",
          },
          500
        );
      }

      if (
        !permissao?.pode_ver
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para visualizar relatórios.",
          },
          403
        );
      }
    }

    const inicio =
      dataValida(
        request.nextUrl
          .searchParams
          .get(
            "data_inicio"
          )
      );

    const fim =
      dataValida(
        request.nextUrl
          .searchParams
          .get(
            "data_fim"
          )
      );

    if (
      request.nextUrl.searchParams.has(
        "data_inicio"
      ) &&
      !inicio
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Data inicial inválida.",
        },
        422
      );
    }

    if (
      request.nextUrl.searchParams.has(
        "data_fim"
      ) &&
      !fim
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Data final inválida.",
        },
        422
      );
    }

    if (
      inicio &&
      fim &&
      inicio > fim
    ) {
      return responder(
        {
          ok: false,
          erro:
            "A data inicial não pode ser maior que a data final.",
        },
        422
      );
    }

    let consulta =
      supabaseAdmin
        .from(config.tabela)
        .select("*")
        .eq(
          "municipio_id",
          municipioId
        )
        .order(
          config.campoData,
          {
            ascending: false,
          }
        )
        .limit(
          LIMITE + 1
        );

    if (inicio) {
      consulta =
        consulta.gte(
          config.campoData,
          config.campoData ===
            "data"
            ? inicio
            : `${inicio}T00:00:00`
        );
    }

    if (fim) {
      consulta =
        consulta.lte(
          config.campoData,
          config.campoData ===
            "data"
            ? fim
            : `${fim}T23:59:59.999`
        );
    }

    const {
      data: registros,
      error: registrosError,
    } = await consulta;

    if (registrosError) {
      console.error(
        "Erro ao carregar dados do relatório:",
        {
          message:
            registrosError.message,
          details:
            registrosError.details,
          hint:
            registrosError.hint,
          code:
            registrosError.code,
          modulo,
          municipio_id:
            municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os dados do relatório.",
        },
        500
      );
    }

    const lista =
      Array.isArray(registros)
        ? registros
        : [];

    const limiteAtingido =
      lista.length > LIMITE;

    return responder(
      {
        ok: true,
        registros:
          lista.slice(
            0,
            LIMITE
          ),
        limite_atingido:
          limiteAtingido,
        institucional: {
          municipio_id:
            municipio.id,
          municipio_nome:
            String(
              municipio.nome ||
              ""
            ).trim() ||
            `Município ${municipio.id}`,
          estado:
            String(
              municipio.estado ||
              ""
            ).trim(),
          nome_guarda:
            String(
              municipio.nome_guarda ||
              ""
            ).trim() ||
            "Guarda Civil Municipal",
          comandante:
            String(
              municipio.comandante ||
              ""
            ).trim(),
          brasao_prefeitura:
            String(
              municipio.brasao_prefeitura ||
              ""
            ).trim(),
          brasao_gcm:
            String(
              municipio.brasao_gcm ||
              municipio.brasao ||
              ""
            ).trim(),
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado na Central de Relatórios:",
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
          "Erro interno ao gerar o relatório.",
      },
      500
    );
  }
}
