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
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type Municipio = {
  id: number;
  nome: string | null;
  estado: string | null;
  nome_guarda: string | null;
  brasao: string | null;
  brasao_prefeitura: string | null;
  brasao_gcm: string | null;
  ativo: boolean | null;
};

type Movimento = {
  id: number;
  item: string | null;
  categoria: string | null;
  quantidade: number | string | null;
  unidade: string | null;
  local?: string | null;
  observacao?: string | null;
  criado_em: string | null;
};

type ItemEstoque = {
  chave: string;
  item: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  local: string;
  observacao: string;
  ultima_entrada: string | null;
  ultima_saida: string | null;
};

const TAMANHO_PAGINA =
  1000;

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

async function buscarTodos(
  tabela: string,
  campos: string,
  municipioId: number
) {
  const registros:
    Movimento[] = [];

  let inicio = 0;

  while (true) {
    const fim =
      inicio +
      TAMANHO_PAGINA -
      1;

    const {
      data,
      error,
    } = await supabaseAdmin
      .from(tabela)
      .select(campos)
      .eq(
        "municipio_id",
        municipioId
      )
      .order(
        "id",
        {
          ascending: true,
        }
      )
      .range(
        inicio,
        fim
      );

    if (error) {
      throw error;
    }

  const lote =
  (data || []) as unknown as
    Movimento[];

    registros.push(
      ...lote
    );

    if (
      lote.length <
      TAMANHO_PAGINA
    ) {
      break;
    }

    inicio +=
      TAMANHO_PAGINA;
  }

  return registros;
}

function dataMaisRecente(
  atual: string | null,
  nova: string | null
) {
  if (!nova) {
    return atual;
  }

  if (!atual) {
    return nova;
  }

  const atualMs =
    new Date(
      atual
    ).getTime();

  const novaMs =
    new Date(
      nova
    ).getTime();

  if (
    Number.isNaN(
      novaMs
    )
  ) {
    return atual;
  }

  if (
    Number.isNaN(
      atualMs
    ) ||
    novaMs >
      atualMs
  ) {
    return nova;
  }

  return atual;
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
        "id,perfil,status,municipio_id"
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
        "Erro ao validar usuário do estoque:",
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
              "Selecione o município do estoque.",
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
        "id,nome,estado,nome_guarda,brasao,brasao_prefeitura,brasao_gcm,ativo"
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
        "Erro ao carregar município do estoque:",
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
          "patrimonio"
        )
        .maybeSingle();

      if (permissaoError) {
        console.error(
          "Erro ao validar permissão do estoque:",
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
              "Não foi possível validar a permissão do estoque.",
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
              "Você não possui permissão para visualizar o estoque.",
          },
          403
        );
      }
    }

    const [
      entradas,
      saidas,
    ] =
      await Promise.all([
        buscarTodos(
          "almoxarifado_entradas",
          "id,item,categoria,quantidade,unidade,local,observacao,criado_em",
          municipioId
        ),
        buscarTodos(
          "almoxarifado_saidas",
          "id,item,categoria,quantidade,unidade,criado_em",
          municipioId
        ),
      ]);

    const mapa =
      new Map<
        string,
        ItemEstoque
      >();

    for (
      const entrada of entradas
    ) {
      const item =
        texto(
          entrada.item,
          "Item não informado"
        );

      const categoria =
        texto(
          entrada.categoria,
          "OUTRO"
        );

      const unidade =
        texto(
          entrada.unidade,
          "UN"
        );

      const chave =
        `${item.toLowerCase()}|` +
        `${categoria.toLowerCase()}|` +
        `${unidade.toLowerCase()}`;

      const atual =
        mapa.get(chave) || {
          chave,
          item,
          categoria,
          unidade,
          quantidade: 0,
          local: "",
          observacao: "",
          ultima_entrada:
            null,
          ultima_saida:
            null,
        };

      atual.quantidade +=
        Number(
          entrada.quantidade ||
          0
        );

      const novaData =
        texto(
          entrada.criado_em
        ) || null;

      const maisRecente =
        dataMaisRecente(
          atual.ultima_entrada,
          novaData
        );

      if (
        maisRecente ===
        novaData
      ) {
        atual.local =
          texto(
            entrada.local
          );

        atual.observacao =
          texto(
            entrada.observacao
          );
      }

      atual.ultima_entrada =
        maisRecente;

      mapa.set(
        chave,
        atual
      );
    }

    for (
      const saida of saidas
    ) {
      const item =
        texto(
          saida.item,
          "Item não informado"
        );

      const categoria =
        texto(
          saida.categoria,
          "OUTRO"
        );

      const unidade =
        texto(
          saida.unidade,
          "UN"
        );

      const chave =
        `${item.toLowerCase()}|` +
        `${categoria.toLowerCase()}|` +
        `${unidade.toLowerCase()}`;

      const atual =
        mapa.get(chave) || {
          chave,
          item,
          categoria,
          unidade,
          quantidade: 0,
          local: "",
          observacao: "",
          ultima_entrada:
            null,
          ultima_saida:
            null,
        };

      atual.quantidade -=
        Number(
          saida.quantidade ||
          0
        );

      atual.ultima_saida =
        dataMaisRecente(
          atual.ultima_saida,
          texto(
            saida.criado_em
          ) || null
        );

      mapa.set(
        chave,
        atual
      );
    }

    const estoque =
      Array.from(
        mapa.values()
      ).sort(
        (a, b) =>
          a.item.localeCompare(
            b.item,
            "pt-BR"
          )
      );

    return responder(
      {
        ok: true,
        estoque,
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
          brasao_prefeitura:
            texto(
              municipio.brasao_prefeitura
            ),
          brasao_gcm:
            texto(
              municipio.brasao_gcm
            ) ||
            texto(
              municipio.brasao
            ),
        },
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao carregar estoque:",
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
          "Erro interno ao carregar o estoque.",
      },
      500
    );
  }
}
