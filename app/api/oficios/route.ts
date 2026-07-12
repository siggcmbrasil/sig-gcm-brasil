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
  comandante: string | null;
  brasao: string | null;
  brasao_prefeitura: string | null;
  brasao_gcm: string | null;
  ativo: boolean | null;
};

const PERFIS_GESTAO =
  new Set([
    "DESENVOLVEDOR",
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
  ]);

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
  valor: unknown
) {
  return String(
    valor ?? ""
  ).trim();
}

async function contexto(
  request: NextRequest
) {
  const token =
    tokenBearer(request);

  if (!token) {
    return {
      erro: responder(
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
      token
    );

  if (
    authError ||
    !authUser
  ) {
    return {
      erro: responder(
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
      "Erro ao validar usuário de ofícios:",
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

    return {
      erro: responder(
        {
          ok: false,
          erro:
            "Não foi possível validar o usuário.",
        },
        500
      ),
    };
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
    return {
      erro: responder(
        {
          ok: false,
          erro:
            "Usuário sem acesso ativo.",
        },
        403
      ),
    };
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
      return {
        erro: responder(
          {
            ok: false,
            erro:
              "Selecione o município dos ofícios.",
          },
          422
        ),
      };
    }
  }

  if (!municipioId) {
    return {
      erro: responder(
        {
          ok: false,
          erro:
            "Usuário sem município vinculado.",
        },
        422
      ),
    };
  }

  const {
    data: municipioData,
    error: municipioError,
  } = await supabaseAdmin
    .from("municipios")
    .select(
      "id,nome,estado,nome_guarda,comandante,brasao,brasao_prefeitura,brasao_gcm,ativo"
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
      "Erro ao carregar município dos ofícios:",
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

    return {
      erro: responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar o município.",
        },
        500
      ),
    };
  }

  if (
    municipio.ativo ===
    false
  ) {
    return {
      erro: responder(
        {
          ok: false,
          erro:
            "Município inativo.",
        },
        403
      ),
    };
  }

  return {
    usuario,
    perfil,
    municipioId,
    municipio,
    podeGerenciar:
      PERFIS_GESTAO.has(
        perfil
      ),
  };
}

function institucional(
  municipio: Municipio
) {
  return {
    municipio_id:
      municipio.id,
    municipio_nome:
      texto(
        municipio.nome
      ) ||
      `Município ${municipio.id}`,
    estado:
      texto(
        municipio.estado
      ),
    nome_guarda:
      texto(
        municipio.nome_guarda
      ) ||
      "Guarda Civil Municipal",
    comandante:
      texto(
        municipio.comandante
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
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const ctx =
      await contexto(request);

    if ("erro" in ctx) {
      return ctx.erro;
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("oficios")
      .select("*")
      .eq(
        "municipio_id",
        ctx.municipioId
      )
      .order(
        "id",
        {
          ascending: false,
        }
      );

    if (error) {
      console.error(
        "Erro ao carregar ofícios:",
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
            ctx.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os ofícios.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        oficios:
          data || [],
        institucional:
          institucional(
            ctx.municipio
          ),
        pode_gerenciar:
          ctx.podeGerenciar,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao carregar ofícios:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao carregar ofícios.",
      },
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const ctx =
      await contexto(request);

    if ("erro" in ctx) {
      return ctx.erro;
    }

    if (
      !ctx.podeGerenciar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Seu perfil não possui permissão para criar ofícios.",
        },
        403
      );
    }

    const corpo =
      (await request
        .json()
        .catch(() => ({}))) as
        Record<
          string,
          unknown
        >;

    const destinatario =
      texto(
        corpo.destinatario
      );

    const assunto =
      texto(
        corpo.assunto
      );

    const conteudo =
      texto(
        corpo.texto
      );

    if (
      !destinatario ||
      !assunto ||
      !conteudo
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Preencha destinatário, assunto e texto.",
        },
        422
      );
    }

    let numero =
      texto(
        corpo.numero
      );

    if (!numero) {
      const ano =
        new Date()
          .getFullYear();

      const {
        count,
        error:
          countError,
      } = await supabaseAdmin
        .from("oficios")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "municipio_id",
          ctx.municipioId
        );

      if (countError) {
        return responder(
          {
            ok: false,
            erro:
              "Não foi possível gerar o número do ofício.",
          },
          500
        );
      }

      numero =
        `OF-${String(
          (count || 0) + 1
        ).padStart(3, "0")}/${ano}`;
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("oficios")
      .insert({
        municipio_id:
          ctx.municipioId,
        numero,
        tipo: "Ofício",
        destinatario,
        cargo_destinatario:
          texto(
            corpo.cargo_destinatario
          ) || null,
        assunto,
        texto:
          conteudo,
        responsavel:
          texto(
            ctx.usuario.nome
          ),
        status: "EMITIDO",
      })
      .select("*")
      .single();

    if (error) {
      console.error(
        "Erro ao criar ofício:",
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
            ctx.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível criar o ofício.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        oficio: data,
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao criar ofício:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao criar ofício.",
      },
      500
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const ctx =
      await contexto(request);

    if ("erro" in ctx) {
      return ctx.erro;
    }

    if (
      !ctx.podeGerenciar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Seu perfil não possui permissão para alterar ofícios.",
        },
        403
      );
    }

    const corpo =
      (await request
        .json()
        .catch(() => ({}))) as
        Record<
          string,
          unknown
        >;

    const id =
      idPositivo(
        corpo.id
      );

    if (!id) {
      return responder(
        {
          ok: false,
          erro:
            "Ofício inválido.",
        },
        422
      );
    }

    const atualizacao:
      Record<
        string,
        unknown
      > = {};

    const status =
      texto(
        corpo.status
      ).toUpperCase();

    if (status) {
      atualizacao.status =
        status;
    } else {
      const destinatario =
        texto(
          corpo.destinatario
        );

      const assunto =
        texto(
          corpo.assunto
        );

      const conteudo =
        texto(
          corpo.texto
        );

      if (
        !destinatario ||
        !assunto ||
        !conteudo
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Preencha destinatário, assunto e texto.",
          },
          422
        );
      }

      atualizacao.numero =
        texto(
          corpo.numero
        );

      atualizacao.destinatario =
        destinatario;

      atualizacao.cargo_destinatario =
        texto(
          corpo.cargo_destinatario
        ) || null;

      atualizacao.assunto =
        assunto;

      atualizacao.texto =
        conteudo;
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("oficios")
      .update(
        atualizacao
      )
      .eq("id", id)
      .eq(
        "municipio_id",
        ctx.municipioId
      )
      .select("*")
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao atualizar ofício:",
        {
          message:
            error.message,
          details:
            error.details,
          hint:
            error.hint,
          code:
            error.code,
          id,
          municipio_id:
            ctx.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível atualizar o ofício.",
        },
        500
      );
    }

    if (!data) {
      return responder(
        {
          ok: false,
          erro:
            "Ofício não encontrado neste município.",
        },
        404
      );
    }

    return responder(
      {
        ok: true,
        oficio: data,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao atualizar ofício:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao atualizar ofício.",
      },
      500
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  try {
    const ctx =
      await contexto(request);

    if ("erro" in ctx) {
      return ctx.erro;
    }

    if (
      !ctx.podeGerenciar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Seu perfil não possui permissão para excluir ofícios.",
        },
        403
      );
    }

    const id =
      idPositivo(
        request.nextUrl
          .searchParams
          .get("id")
      );

    if (!id) {
      return responder(
        {
          ok: false,
          erro:
            "Ofício inválido.",
        },
        422
      );
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("oficios")
      .delete()
      .eq("id", id)
      .eq(
        "municipio_id",
        ctx.municipioId
      )
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(
        "Erro ao excluir ofício:",
        {
          message:
            error.message,
          details:
            error.details,
          hint:
            error.hint,
          code:
            error.code,
          id,
          municipio_id:
            ctx.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível excluir o ofício.",
        },
        500
      );
    }

    if (!data) {
      return responder(
        {
          ok: false,
          erro:
            "Ofício não encontrado neste município.",
        },
        404
      );
    }

    return responder(
      {
        ok: true,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao excluir ofício:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao excluir ofício.",
      },
      500
    );
  }
}
