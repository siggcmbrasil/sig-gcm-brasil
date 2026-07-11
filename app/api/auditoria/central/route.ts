import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERFIS_AUTORIZADOS = new Set([
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
]);

const FONTES_PERMITIDAS = new Set([
  "ACESSOS",
  "AUDITORIA",
  "CONSULTAS",
  "PERMISSOES",
]);

type UsuarioSistema = {
  id: number;
  nome: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
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

function inteiroPositivo(
  valor: unknown,
  padrao: number
) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) && numero > 0
    ? numero
    : padrao;
}

function limparFiltro(
  valor: unknown,
  maximo = 100
) {
  return String(valor || "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s@._-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximo);
}

function dataIsoValida(
  valor: string,
  finalDoDia = false
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return null;
  }

  const data = new Date(
    `${valor}T${finalDoDia ? "23:59:59.999" : "00:00:00.000"}Z`
  );

  return Number.isNaN(data.getTime())
    ? null
    : data.toISOString();
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

  if (!PERFIS_AUTORIZADOS.has(perfil)) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Seu perfil não possui acesso à Central de Auditoria.",
        },
        403
      ),
    };
  }

  return {
    ok: true as const,
    usuario,
    perfil,
  };
}

async function resolverMunicipio(
  perfil: string,
  usuario: UsuarioSistema,
  solicitado: number | null
) {
  if (perfil !== "DESENVOLVEDOR") {
    const municipioId = Number(usuario.municipio_id);

    if (
      !Number.isSafeInteger(municipioId) ||
      municipioId <= 0
    ) {
      return {
        ok: false as const,
        erro: "Usuário sem município vinculado.",
      };
    }

    return {
      ok: true as const,
      municipioId,
      municipios: [],
    };
  }

  const { data, error } = await supabaseAdmin
    .from("municipios")
    .select("id,nome")
    .eq("ativo", true)
    .order("nome", { ascending: true });

  if (error) {
    return {
      ok: false as const,
      erro:
        "Não foi possível carregar os municípios.",
    };
  }

  const municipios = data || [];

  if (municipios.length === 0) {
    return {
      ok: false as const,
      erro: "Nenhum município ativo foi encontrado.",
    };
  }

  const municipioDoUsuario = Number(
    usuario.municipio_id
  );

  const municipioId =
    solicitado &&
    municipios.some(
      (item) => Number(item.id) === solicitado
    )
      ? solicitado
      : municipios.some(
            (item) =>
              Number(item.id) === municipioDoUsuario
          )
        ? municipioDoUsuario
        : Number(municipios[0].id);

  return {
    ok: true as const,
    municipioId,
    municipios,
  };
}

function aplicarFiltros(
  query: any,
  {
    fonte,
    busca,
    modulo,
    acao,
    status,
    dataInicio,
    dataFim,
  }: {
    fonte: string;
    busca: string;
    modulo: string;
    acao: string;
    status: string;
    dataInicio: string;
    dataFim: string;
  }
) {
  let consulta = query;

  if (fonte) {
    consulta = consulta.eq("fonte", fonte);
  }

  if (modulo) {
    consulta = consulta.ilike(
      "modulo",
      `%${modulo}%`
    );
  }

  if (acao) {
    consulta = consulta.ilike(
      "acao",
      `%${acao}%`
    );
  }

  if (status) {
    consulta = consulta.ilike(
      "status",
      `%${status}%`
    );
  }

  const inicio = dataIsoValida(dataInicio);
  const fim = dataIsoValida(dataFim, true);

  if (inicio) {
    consulta = consulta.gte("criado_em", inicio);
  }

  if (fim) {
    consulta = consulta.lte("criado_em", fim);
  }

  if (busca) {
    const padrao = `%${busca}%`;

    consulta = consulta.or(
      [
        `usuario_nome.ilike.${padrao}`,
        `usuario_email.ilike.${padrao}`,
        `descricao.ilike.${padrao}`,
        `modulo.ilike.${padrao}`,
        `acao.ilike.${padrao}`,
        `ip.ilike.${padrao}`,
      ].join(",")
    );
  }

  return consulta;
}

export async function GET(request: NextRequest) {
  try {
    const autorizacao = await autenticar(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const municipioSolicitadoRaw =
      request.nextUrl.searchParams.get(
        "municipio_id"
      );

    const municipioSolicitado =
      municipioSolicitadoRaw
        ? inteiroPositivo(
            municipioSolicitadoRaw,
            0
          ) || null
        : null;

    const resolucao = await resolverMunicipio(
      autorizacao.perfil,
      autorizacao.usuario,
      municipioSolicitado
    );

    if (!resolucao.ok) {
      return responder(
        {
          ok: false,
          erro: resolucao.erro,
        },
        422
      );
    }

    const pagina = inteiroPositivo(
      request.nextUrl.searchParams.get("pagina"),
      1
    );

    const limite = Math.min(
      inteiroPositivo(
        request.nextUrl.searchParams.get("limite"),
        25
      ),
      100
    );

    const fonteBruta = String(
      request.nextUrl.searchParams.get("fonte") ||
        ""
    ).toUpperCase();

    const fonte = FONTES_PERMITIDAS.has(
      fonteBruta
    )
      ? fonteBruta
      : "";

    const filtros = {
      fonte,
      busca: limparFiltro(
        request.nextUrl.searchParams.get("busca"),
        80
      ),
      modulo: limparFiltro(
        request.nextUrl.searchParams.get("modulo"),
        80
      ),
      acao: limparFiltro(
        request.nextUrl.searchParams.get("acao"),
        80
      ),
      status: limparFiltro(
        request.nextUrl.searchParams.get("status"),
        50
      ),
      dataInicio: String(
        request.nextUrl.searchParams.get(
          "data_inicio"
        ) || ""
      ),
      dataFim: String(
        request.nextUrl.searchParams.get(
          "data_fim"
        ) || ""
      ),
    };

    const inicio = (pagina - 1) * limite;
    const fim = inicio + limite - 1;

    let consulta = supabaseAdmin
      .from("central_auditoria_unificada")
      .select(
        [
          "fonte",
          "registro_id",
          "municipio_id",
          "municipio_nome",
          "usuario_id",
          "usuario_nome",
          "usuario_email",
          "perfil",
          "modulo",
          "acao",
          "descricao",
          "status",
          "ip",
          "dispositivo",
          "dados",
          "criado_em",
        ].join(","),
        {
          count: "exact",
        }
      )
      .eq(
        "municipio_id",
        resolucao.municipioId
      );

    consulta = aplicarFiltros(
      consulta,
      filtros
    );

    const { data, error, count } =
      await consulta
        .order("criado_em", {
          ascending: false,
        })
        .range(inicio, fim);

    if (error) {
      console.error(
        "Erro ao carregar central de auditoria:",
        error.message
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os registros de auditoria.",
        },
        500
      );
    }

    const fontes = [
      "ACESSOS",
      "AUDITORIA",
      "CONSULTAS",
      "PERMISSOES",
    ];

    const contagens = await Promise.all(
      fontes.map(async (item) => {
        const { count: quantidade, error: erro } =
          await supabaseAdmin
            .from("central_auditoria_unificada")
            .select("registro_id", {
              count: "exact",
              head: true,
            })
            .eq(
              "municipio_id",
              resolucao.municipioId
            )
            .eq("fonte", item);

        if (erro) {
          console.error(
            `Erro ao contar fonte ${item}:`,
            erro.message
          );
        }

        return [
          item,
          erro ? 0 : Number(quantidade || 0),
        ] as const;
      })
    );

    const resumo = Object.fromEntries(contagens);
    const total = Number(count || 0);

    return responder(
      {
        ok: true,
        registros: data || [],
        total,
        pagina,
        limite,
        total_paginas: Math.max(
          1,
          Math.ceil(total / limite)
        ),
        resumo: {
          ...resumo,
          TOTAL:
            Number(resumo.ACESSOS || 0) +
            Number(resumo.AUDITORIA || 0) +
            Number(resumo.CONSULTAS || 0) +
            Number(resumo.PERMISSOES || 0),
        },
        municipios: resolucao.municipios,
        municipio_selecionado:
          resolucao.municipioId,
        perfil: autorizacao.perfil,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado na Central de Auditoria:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao carregar a Central de Auditoria.",
      },
      500
    );
  }
}
