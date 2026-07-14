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
  ativo: boolean | null;
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

function texto(
  valor: unknown,
  fallback = ""
) {
  const convertido =
    String(valor ?? "").trim();

  return convertido || fallback;
}

function limparBusca(
  valor: string
) {
  return valor
    .trim()
    .slice(0, 100)
    .replace(
      /[,%()]/g,
      " "
    )
    .replace(
      /\s+/g,
      " "
    );
}

async function contar(
  tabela: string,
  aplicar:
    | ((
        consulta: any
      ) => any)
    | null = null
) {
  let consulta =
    supabaseAdmin
      .from(tabela)
      .select("id", {
        count: "exact",
        head: true,
      });

  if (aplicar) {
    consulta =
      aplicar(consulta);
  }

  const {
    count,
    error,
  } = await consulta;

  if (error) {
    throw error;
  }

  return count || 0;
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
      data: usuarioData,
      error: usuarioError,
    } = await supabaseAdmin
      .from("usuarios")
      .select(
        "id,nome,perfil,status,municipio_id"
      )
      .eq(
        "auth_id",
        authUser.id
      )
      .maybeSingle();

    const usuario =
      usuarioData as
        | UsuarioSistema
        | null;

    if (
      usuarioError ||
      !usuario
    ) {
      console.error(
        "Erro ao validar usuário da Central de Legislação:",
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
      texto(
        usuario.perfil
      ).toUpperCase();

    const status =
      texto(
        usuario.status
      ).toUpperCase();

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
              "Selecione o município da Central de Legislação.",
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
      data: municipioData,
      error: municipioError,
    } = await supabaseAdmin
      .from("municipios")
      .select(
        "id,nome,estado,nome_guarda,ativo"
      )
      .eq(
        "id",
        municipioId
      )
      .maybeSingle();

    const municipio =
      municipioData as
        | Municipio
        | null;

    if (
      municipioError ||
      !municipio
    ) {
      console.error(
        "Erro ao carregar município da Central de Legislação:",
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
          "legislacao"
        )
        .limit(1)
        .maybeSingle();

      if (permissaoError) {
        console.error(
          "Erro ao validar permissão da Central de Legislação:",
          {
            message:
              permissaoError.message,
            details:
              permissaoError.details,
            hint:
              permissaoError.hint,
            code:
              permissaoError.code,
            perfil,
            municipio_id:
              municipioId,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível validar a permissão de legislação.",
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
              "Você não possui permissão para acessar a Central de Legislação.",
          },
          403
        );
      }
    }

    const [
      totalLegislacoes,
      totalFavoritos,
      totalAtualizacoes,
      totalDownloads,
      recentesResposta,
      destaquesResposta,
    ] =
      await Promise.all([
        contar(
          "legislacoes"
        ),
        contar(
          "legislacao_favoritos",
          (consulta) =>
            consulta
              .eq(
                "municipio_id",
                municipioId
              )
              .eq(
                "auth_user_id",
                authUser.id
              )
        ),
        contar(
          "legislacao_atualizacoes",
          (consulta) =>
            consulta
              .eq(
                "municipio_id",
                municipioId
              )
              .eq(
                "ativo",
                true
              )
        ),
        contar(
          "legislacao_downloads",
          (consulta) =>
            consulta
              .eq(
                "municipio_id",
                municipioId
              )
              .eq(
                "ativo",
                true
              )
        ),
        supabaseAdmin
          .from(
            "legislacao_atualizacoes"
          )
          .select(
            "id,titulo,resumo,categoria,tipo,fonte,url,data_publicacao"
          )
          .eq(
            "municipio_id",
            municipioId
          )
          .eq(
            "ativo",
            true
          )
          .order(
            "data_publicacao",
            {
              ascending: false,
              nullsFirst: false,
            }
          )
          .order(
            "criado_em",
            {
              ascending: false,
            }
          )
          .limit(5),
        supabaseAdmin
          .from("legislacoes")
          .select(
            "id,titulo,categoria,descricao,artigo,aplicacao_operacional"
          )
          .eq(
            "favorito",
            true
          )
          .order(
            "criado_em",
            {
              ascending: false,
            }
          )
          .limit(4),
      ]);

    if (
      recentesResposta.error
    ) {
      throw recentesResposta.error;
    }

    if (
      destaquesResposta.error
    ) {
      throw destaquesResposta.error;
    }

    const termo =
      limparBusca(
        texto(
          request.nextUrl
            .searchParams
            .get("q")
        )
      );

    let resultados:
      Record<
        string,
        unknown
      >[] = [];

    if (termo) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from("legislacoes")
        .select(
          "id,titulo,categoria,descricao,artigo,texto_lei,aplicacao_operacional,palavras_chave"
        )
        .or(
          `titulo.ilike.%${termo}%,` +
          `categoria.ilike.%${termo}%,` +
          `descricao.ilike.%${termo}%,` +
          `artigo.ilike.%${termo}%,` +
          `texto_lei.ilike.%${termo}%,` +
          `aplicacao_operacional.ilike.%${termo}%,` +
          `palavras_chave.ilike.%${termo}%`
        )
        .order(
          "favorito",
          {
            ascending: false,
          }
        )
        .limit(20);

      if (error) {
        throw error;
      }

      resultados =
        data || [];
    }

    return responder(
      {
        ok: true,
        institucional: {
          municipio_id:
            municipio.id,
          municipio_nome:
            texto(
              municipio.nome,
              `Município ${municipio.id}`
            ),
          estado:
            texto(
              municipio.estado
            ),
          nome_guarda:
            texto(
              municipio.nome_guarda,
              "Guarda Civil Municipal"
            ),
        },
        resumo: {
          legislacoes:
            totalLegislacoes,
          favoritos:
            totalFavoritos,
          atualizacoes:
            totalAtualizacoes,
          downloads:
            totalDownloads,
        },
        atualizacoes:
          recentesResposta.data ||
          [],
        destaques:
          destaquesResposta.data ||
          [],
        resultados,
        termo,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado na Central de Legislação:",
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
          "Erro interno ao carregar a Central de Legislação.",
      },
      500
    );
  }
}
