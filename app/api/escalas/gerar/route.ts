import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERFIS_AUTORIZADOS = new Set([
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
]);

type UsuarioSistema = {
  id: number;
  nome: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type RegistroEscalaBase = {
  municipio_id: number;
  mes: string;
  ano: string;
  data_servico: string;
  guarda_nome: string;
  matricula: string;
  tipo: string;
  turno: string;
  equipe: string;
  observacao: string;
};

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function obterToken(request: NextRequest) {
  const authorization = request.headers.get(
    "authorization"
  );

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

function numeroId(valor: unknown) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) && numero > 0
    ? numero
    : null;
}

function texto(valor: unknown, limite = 200) {
  return String(valor || "")
    .trim()
    .slice(0, limite);
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
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
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
    .eq("auth_id", user.id)
    .maybeSingle();

  const usuario = data as UsuarioSistema | null;

  if (error || !usuario) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário não localizado no sistema.",
        },
        403
      ),
    };
  }

  const perfil = texto(usuario.perfil).toUpperCase();
  const status = texto(usuario.status).toUpperCase();

  if (status !== "ATIVO") {
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
            "Seu perfil não possui permissão para gerar escalas.",
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

export async function POST(request: NextRequest) {
  const autenticacao = await autenticar(request);

  if (!autenticacao.ok) {
    return autenticacao.resposta;
  }

  const { usuario, perfil } = autenticacao;

  let corpo: Record<string, unknown>;

  try {
    corpo = await request.json();
  } catch {
    return responder(
      {
        ok: false,
        erro: "Corpo da requisição inválido.",
      },
      400
    );
  }

  const municipioIdInformado = numeroId(
    corpo.municipio_id
  );

  const municipioId =
    perfil === "DESENVOLVEDOR"
      ? municipioIdInformado
      : numeroId(usuario.municipio_id);

  if (!municipioId) {
    return responder(
      {
        ok: false,
        erro: "Município não identificado.",
      },
      422
    );
  }

  const mes = texto(corpo.mes, 2).padStart(2, "0");
  const ano = texto(corpo.ano, 4);
  const turno = texto(corpo.turno, 100);
  const tipoEscala = texto(
    corpo.tipo_escala,
    50
  );
  const guarnicaoInicialId = numeroId(
    corpo.guarnicao_inicial_id
  );

  if (
    !/^(0[1-9]|1[0-2])$/.test(mes) ||
    !/^\d{4}$/.test(ano)
  ) {
    return responder(
      {
        ok: false,
        erro: "Mês ou ano inválido.",
      },
      422
    );
  }

  const { data: guarnicoes, error: guarnicoesError } =
    await supabaseAdmin
      .from("guarnicoes")
      .select("id,nome,ativa")
      .eq("municipio_id", municipioId)
      .eq("ativa", true)
      .order("nome");

  if (guarnicoesError) {
    return responder(
      {
        ok: false,
        erro: "Não foi possível carregar as guarnições.",
      },
      500
    );
  }

  if (!guarnicoes?.length) {
    return responder(
      {
        ok: false,
        erro: "Nenhuma guarnição ativa cadastrada.",
      },
      422
    );
  }

  let inicio = 0;

  if (guarnicaoInicialId) {
    const indice = guarnicoes.findIndex(
      (item) => Number(item.id) === guarnicaoInicialId
    );

    if (indice >= 0) {
      inicio = indice;
    }
  }

  const diasNoMes = new Date(
    Number(ano),
    Number(mes),
    0
  ).getDate();

  const novosRegistros: RegistroEscalaBase[] = [];

  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = `${ano}-${mes}-${String(dia).padStart(
      2,
      "0"
    )}`;

    const guarnicao =
      guarnicoes[(inicio + dia - 1) % guarnicoes.length];

    novosRegistros.push({
      municipio_id: municipioId,
      mes,
      ano,
      data_servico: data,
      guarda_nome: guarnicao.nome,
      matricula: "",
      tipo: "Plantão",
      turno: turno || "07:00 às 07:00",
      equipe: guarnicao.nome,
      observacao: `Gerado automaticamente - Escala ${
        tipoEscala || "24x96"
      }`,
    });
  }

  const dataInicial = `${ano}-${mes}-01`;
  const dataFinal = `${ano}-${mes}-${String(
    diasNoMes
  ).padStart(2, "0")}`;

  const { error: deleteBaseError } =
    await supabaseAdmin
      .from("escala_mensal")
      .delete()
      .eq("municipio_id", municipioId)
      .eq("mes", mes)
      .eq("ano", ano)
      .like(
        "observacao",
        "Gerado automaticamente%"
      );

  if (deleteBaseError) {
    return responder(
      {
        ok: false,
        erro:
          "Não foi possível limpar a escala mensal anterior.",
      },
      500
    );
  }

  const { error: insertBaseError } =
    await supabaseAdmin
      .from("escala_mensal")
      .insert(novosRegistros);

  if (insertBaseError) {
    return responder(
      {
        ok: false,
        erro: "Não foi possível gerar a escala mensal.",
      },
      500
    );
  }

  const { error: deleteServicoError } =
    await supabaseAdmin
      .from("escalas_servico")
      .delete()
      .eq("municipio_id", municipioId)
      .gte("data_servico", dataInicial)
      .lte("data_servico", dataFinal);

  if (deleteServicoError) {
    return responder(
      {
        ok: false,
        erro:
          "A escala mensal foi gerada, mas não foi possível limpar a escala operacional anterior.",
      },
      500
    );
  }

  const { data: membros, error: membrosError } =
    await supabaseAdmin
      .from("guarnicao_membros")
      .select(
        "guarnicao_id,guarda_id,funcao,municipio_id"
      )
      .eq("municipio_id", municipioId);

  if (membrosError) {
    return responder(
      {
        ok: false,
        erro:
          "Não foi possível carregar os membros das guarnições.",
      },
      500
    );
  }

  const { data: guardas, error: guardasError } =
    await supabaseAdmin
      .from("guardas")
      .select(
        "id,nome,matricula,ativo,municipio_id"
      )
      .eq("municipio_id", municipioId);

  if (guardasError) {
    return responder(
      {
        ok: false,
        erro: "Não foi possível carregar os guardas.",
      },
      500
    );
  }

  const guardasPorId = new Map(
    (guardas || []).map((guarda) => [
      Number(guarda.id),
      guarda,
    ])
  );

  const guarnicoesPorNome = new Map(
    guarnicoes.map((guarnicao) => [
      String(guarnicao.nome)
        .trim()
        .toUpperCase(),
      guarnicao,
    ])
  );

  const registrosServico: Record<
    string,
    unknown
  >[] = [];

  for (const registro of novosRegistros) {
    const guarnicao = guarnicoesPorNome.get(
      registro.equipe.trim().toUpperCase()
    );

    if (!guarnicao) {
      continue;
    }

    const membrosDaGuarnicao = (membros || []).filter(
      (membro) =>
        Number(membro.guarnicao_id) ===
        Number(guarnicao.id)
    );

    for (const membro of membrosDaGuarnicao) {
      const guarda = guardasPorId.get(
        Number(membro.guarda_id)
      );

      if (!guarda || guarda.ativo === false) {
        continue;
      }

      registrosServico.push({
        municipio_id: municipioId,
        data_servico: registro.data_servico,
        turno: registro.turno,
        guarda_id: guarda.id,
        guarda_nome: guarda.nome,
        matricula: guarda.matricula,
        equipe: registro.equipe,
        funcao: membro.funcao,
        observacao:
          "Gerado automaticamente pela Escala Mensal",
      });
    }
  }

  if (registrosServico.length > 0) {
    const { error: insertServicoError } =
      await supabaseAdmin
        .from("escalas_servico")
        .insert(registrosServico);

    if (insertServicoError) {
      return responder(
        {
          ok: false,
          erro:
            "A escala mensal foi gerada, mas ocorreu erro ao gerar a escala operacional.",
        },
        500
      );
    }
  }

  const { error: auditoriaError } =
    await supabaseAdmin.from("auditoria").insert({
      municipio_id: municipioId,
      usuario_id: usuario.id,
      usuario_nome:
        usuario.nome || "Usuário não identificado",
      usuario_email: usuario.email || "",
      perfil,
      modulo: "Escalas",
      acao: "GERAR",
      descricao: `Gerou a escala ${tipoEscala} referente a ${mes}/${ano}.`,
      status: "SUCESSO",
      tabela: "escala_mensal",
      detalhes: {
        mes,
        ano,
        registros_mensais:
          novosRegistros.length,
        registros_operacionais:
          registrosServico.length,
      },
    });

  if (auditoriaError) {
    console.error(
      "Erro ao registrar auditoria da escala:",
      auditoriaError
    );
  }

  return responder(
    {
      ok: true,
      mensagem:
        "Escala mensal e operacional geradas com sucesso.",
      total_dias: novosRegistros.length,
      total_plantões:
        registrosServico.length,
    },
    201
  );
}