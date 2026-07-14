import { NextRequest, NextResponse } from "next/server";

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

type PessoaEncontrada = {
  id: number;
  nome: string;
  documento: string | null;
  tipo_documento: string | null;
  telefone: string | null;
  endereco: string | null;
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

function obterIp(request: NextRequest) {
  const valor =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "Não identificado";

  return valor.split(",")[0].trim().slice(0, 64);
}

function obterDispositivo(request: NextRequest) {
  return String(
    request.headers.get("user-agent") ||
      "Não identificado"
  ).slice(0, 500);
}

function inteiroPositivo(valor: unknown) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) && numero > 0
    ? numero
    : null;
}

function limparTexto(
  valor: unknown,
  maximo: number
) {
  return String(valor || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximo);
}

function limparTermoPesquisa(valor: unknown) {
  return limparTexto(valor, 80)
    .replace(/[%_]/g, "")
    .trim();
}

async function autenticar(request: NextRequest) {
  const token = obterToken(request);

  if (!token) {
    return {
      ok: false as const,
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
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !authUser) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro: "Sessão inválida ou expirada.",
        },
        401
      ),
    };
  }

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select(
      "id,nome,email,perfil,status,municipio_id"
    )
    .eq("auth_id", authUser.id)
    .maybeSingle();

  const usuario = data as UsuarioSistema | null;

  if (error || !usuario) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário responsável não localizado.",
        },
        403
      ),
    };
  }

  const perfil = String(
    usuario.perfil || ""
  ).toUpperCase();

  if (
    String(usuario.status || "").toUpperCase() !==
    "ATIVO"
  ) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário sem acesso ativo.",
        },
        403
      ),
    };
  }

  const municipioSolicitado = inteiroPositivo(
    request.nextUrl.searchParams.get("municipio_id")
  );

  let municipioId = usuario.municipio_id
    ? Number(usuario.municipio_id)
    : null;

  if (perfil === "DESENVOLVEDOR") {
    if (!municipioSolicitado) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Selecione um município válido para realizar a pesquisa.",
          },
          422
        ),
      };
    }

    const { data: municipio, error: municipioError } =
      await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", municipioSolicitado)
        .eq("ativo", true)
        .maybeSingle();

    if (municipioError || !municipio) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro: "Município informado é inválido.",
          },
          422
        ),
      };
    }

    municipioId = Number(municipio.id);
  } else {
    if (!municipioId) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro: "Usuário sem município vinculado.",
          },
          403
        ),
      };
    }

    if (
      municipioSolicitado &&
      municipioSolicitado !== municipioId
    ) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Você não possui acesso ao município informado.",
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
    municipioId: Number(municipioId),
  };
}

async function possuiPermissao(
  perfil: string,
  municipioId: number
) {
  if (perfil === "DESENVOLVEDOR") {
    return true;
  }

  const { data, error } = await supabaseAdmin
    .from("permissoes_perfis")
    .select("id")
    .eq("municipio_id", municipioId)
    .eq("perfil", perfil)
    .eq("modulo", "pessoas_abordadas")
    .eq("pode_ver", true)
    .limit(1);

  if (error) {
    console.error(
      "Erro ao verificar permissão de pessoas:",
      error.message
    );

    return false;
  }

  return Boolean(data?.length);
}

async function registrarAuditoria({
  request,
  usuario,
  perfil,
  municipioId,
  acao,
  descricao,
  status,
  detalhes,
  registroId = null,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  acao: "CONSULTAR" | "ERRO";
  descricao: string;
  status: "SUCESSO" | "ERRO";
  detalhes: Record<string, unknown>;
  registroId?: number | null;
}) {
  return supabaseAdmin.from("auditoria").insert({
    municipio_id: municipioId,
    guarda_id: Number(usuario.id),
    usuario_nome:
      String(usuario.nome || "").trim() ||
      "Usuário não informado",
    usuario_email: usuario.email || null,
    perfil,
    modulo: "Pesquisa de Pessoas",
    acao,
    descricao,
    registro_id: registroId
      ? String(registroId)
      : null,
    tabela: "pessoas_abordadas",
    status,
    ip: obterIp(request),
    dispositivo: obterDispositivo(request),
    detalhes,
  });
}

async function verificarLimite(usuarioId: number) {
  const desde = new Date(
    Date.now() - 60_000
  ).toISOString();

  const { count, error } = await supabaseAdmin
    .from("consultas_operacionais")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("usuario_id", String(usuarioId))
    .gte("criado_em", desde);

  if (error) {
    console.error(
      "Erro ao verificar limite de consultas:",
      error.message
    );

    return {
      permitido: false,
      erroInterno: true,
    };
  }

  return {
    permitido: Number(count || 0) < 20,
    erroInterno: false,
  };
}

function juntarResultados(
  listas: Array<PessoaEncontrada[] | null>
) {
  const mapa = new Map<number, PessoaEncontrada>();

  for (const lista of listas) {
    for (const pessoa of lista || []) {
      mapa.set(Number(pessoa.id), pessoa);
    }
  }

  return Array.from(mapa.values())
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 50);
}

export async function POST(request: NextRequest) {
  try {
    const autorizacao = await autenticar(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const autorizado = await possuiPermissao(
      autorizacao.perfil,
      autorizacao.municipioId
    );

    if (!autorizado) {
      return responder(
        {
          ok: false,
          erro:
            "Seu perfil não possui permissão para pesquisar pessoas.",
        },
        403
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return responder(
        {
          ok: false,
          erro: "Dados da pesquisa inválidos.",
        },
        400
      );
    }

    const termo = limparTermoPesquisa(body.consulta);
    const motivo = limparTexto(body.motivo, 500);

    if (termo.length < 3) {
      return responder(
        {
          ok: false,
          erro:
            "Digite pelo menos 3 caracteres para pesquisar.",
        },
        422
      );
    }

    if (motivo.length < 10) {
      return responder(
        {
          ok: false,
          erro:
            "Informe um motivo com pelo menos 10 caracteres.",
        },
        422
      );
    }

    const limite = await verificarLimite(
      Number(autorizacao.usuario.id)
    );

    if (limite.erroInterno) {
      return responder(
        {
          ok: false,
          erro:
            "Não foi possível validar o limite de consultas.",
        },
        500
      );
    }

    if (!limite.permitido) {
      return responder(
        {
          ok: false,
          erro:
            "Limite temporário de consultas atingido. Aguarde um minuto.",
        },
        429
      );
    }

    const campos =
      "id,nome,documento,tipo_documento,telefone,endereco";

    const padraoTexto = `%${termo}%`;
    const somenteNumeros = termo.replace(/\D/g, "");
    const padraoNumeros =
      somenteNumeros.length >= 3
        ? `%${somenteNumeros}%`
        : null;

    const consultas = [
      supabaseAdmin
        .from("pessoas_abordadas")
        .select(campos)
        .eq(
          "municipio_id",
          autorizacao.municipioId
        )
        .ilike("nome", padraoTexto)
        .order("id", { ascending: false })
        .limit(50),

      supabaseAdmin
        .from("pessoas_abordadas")
        .select(campos)
        .eq(
          "municipio_id",
          autorizacao.municipioId
        )
        .ilike("documento", padraoTexto)
        .order("id", { ascending: false })
        .limit(50),

      supabaseAdmin
        .from("pessoas_abordadas")
        .select(campos)
        .eq(
          "municipio_id",
          autorizacao.municipioId
        )
        .ilike("telefone", padraoTexto)
        .order("id", { ascending: false })
        .limit(50),
    ];

    if (
      padraoNumeros &&
      padraoNumeros !== padraoTexto
    ) {
      consultas.push(
        supabaseAdmin
          .from("pessoas_abordadas")
          .select(campos)
          .eq(
            "municipio_id",
            autorizacao.municipioId
          )
          .ilike("documento", padraoNumeros)
          .order("id", { ascending: false })
          .limit(50),

        supabaseAdmin
          .from("pessoas_abordadas")
          .select(campos)
          .eq(
            "municipio_id",
            autorizacao.municipioId
          )
          .ilike("telefone", padraoNumeros)
          .order("id", { ascending: false })
          .limit(50)
      );
    }

    const respostas = await Promise.all(consultas);
    const erroPesquisa = respostas.find(
      (resposta) => resposta.error
    )?.error;

    if (erroPesquisa) {
      console.error(
        "Erro ao pesquisar pessoas:",
        erroPesquisa.message
      );

      await registrarAuditoria({
        request,
        usuario: autorizacao.usuario,
        perfil: autorizacao.perfil,
        municipioId: autorizacao.municipioId,
        acao: "ERRO",
        descricao:
          "Erro ao pesquisar pessoa abordada.",
        status: "ERRO",
        detalhes: {
          consulta: termo,
          motivo,
          erro: erroPesquisa.message,
        },
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível pesquisar pessoas.",
        },
        500
      );
    }

    const pessoas = juntarResultados(
      respostas.map(
        (resposta) =>
          (resposta.data || []) as PessoaEncontrada[]
      )
    );

    const resultado =
      pessoas.length > 0
        ? "ENCONTRADO"
        : "NAO_ENCONTRADO";

    const {
      data: consultaRegistrada,
      error: consultaError,
    } = await supabaseAdmin
      .from("consultas_operacionais")
      .insert({
        municipio_id: autorizacao.municipioId,
        usuario_id: String(autorizacao.usuario.id),
        tipo: "PESSOA",
        consulta: termo,
        motivo,
        resultado,
      })
      .select("id")
      .single();

    if (consultaError || !consultaRegistrada) {
      console.error(
        "Erro ao registrar consulta de pessoa:",
        consultaError?.message
      );

      await registrarAuditoria({
        request,
        usuario: autorizacao.usuario,
        perfil: autorizacao.perfil,
        municipioId: autorizacao.municipioId,
        acao: "ERRO",
        descricao:
          "Erro ao registrar pesquisa de pessoa abordada.",
        status: "ERRO",
        detalhes: {
          consulta: termo,
          motivo,
          erro:
            consultaError?.message ||
            "Erro desconhecido",
        },
      });

      return responder(
        {
          ok: false,
          erro:
            "A pesquisa não foi concluída porque o registro de controle falhou.",
        },
        500
      );
    }

    const { error: auditoriaError } =
      await registrarAuditoria({
        request,
        usuario: autorizacao.usuario,
        perfil: autorizacao.perfil,
        municipioId: autorizacao.municipioId,
        acao: "CONSULTAR",
        descricao:
          "Realizou pesquisa de pessoa abordada.",
        status: "SUCESSO",
        registroId: Number(consultaRegistrada.id),
        detalhes: {
          consulta: termo,
          motivo,
          total_resultados: pessoas.length,
          consulta_operacional_id:
            Number(consultaRegistrada.id),
        },
      });

    if (auditoriaError) {
      console.error(
        "Erro ao auditar pesquisa de pessoa:",
        auditoriaError.message
      );

      await supabaseAdmin
        .from("consultas_operacionais")
        .delete()
        .eq("id", consultaRegistrada.id)
        .eq(
          "municipio_id",
          autorizacao.municipioId
        );

      return responder(
        {
          ok: false,
          erro:
            "A pesquisa não foi exibida porque a auditoria falhou.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        pessoas,
        total: pessoas.length,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado na pesquisa de pessoas:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao pesquisar pessoas.",
      },
      500
    );
  }
}
