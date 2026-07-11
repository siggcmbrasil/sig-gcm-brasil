import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIPOS_PERMITIDOS = new Set([
  "CPF",
  "PLACA",
  "RENAVAM",
  "TELEFONE",
]);

const PERFIS_GESTAO = new Set([
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
]);

type UsuarioSistema = {
  id: number;
  auth_id: string | null;
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

function texto(
  valor: unknown,
  maximo: number,
  obrigatorio = false
) {
  const normalizado = String(valor || "").trim();

  if (obrigatorio && !normalizado) {
    return null;
  }

  return normalizado
    ? normalizado.slice(0, maximo)
    : null;
}

function normalizarConsulta(
  tipo: string,
  valor: unknown
) {
  const informado = String(valor || "")
    .trim()
    .toUpperCase();

  if (tipo === "CPF") {
    const numeros = informado.replace(/\D/g, "");

    return numeros.length === 11 ? numeros : null;
  }

  if (tipo === "PLACA") {
    const placa = informado.replace(/[^A-Z0-9]/g, "");

    return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(
      placa
    )
      ? placa
      : null;
  }

  if (tipo === "RENAVAM") {
    const numeros = informado.replace(/\D/g, "");

    return numeros.length === 11 ? numeros : null;
  }

  if (tipo === "TELEFONE") {
    const numeros = informado.replace(/\D/g, "");

    return numeros.length === 10 ||
      numeros.length === 11
      ? numeros
      : null;
  }

  return null;
}

function modulosDoTipo(tipo: string) {
  if (tipo === "CPF") {
    return ["consulta_cpf", "consulta_global"];
  }

  if (tipo === "PLACA") {
    return ["consulta_placa", "consulta_global"];
  }

  return ["consulta_global"];
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
      "id,auth_id,nome,email,perfil,status,municipio_id"
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
              "Selecione um município válido para registrar a consulta.",
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
    authUser,
    usuario,
    perfil,
    municipioId: Number(municipioId),
  };
}

async function possuiPermissao(
  perfil: string,
  municipioId: number,
  modulos: string[]
) {
  if (perfil === "DESENVOLVEDOR") {
    return true;
  }

  const { data, error } = await supabaseAdmin
    .from("permissoes_perfis")
    .select("modulo,pode_ver")
    .eq("municipio_id", municipioId)
    .eq("perfil", perfil)
    .in("modulo", modulos)
    .eq("pode_ver", true)
    .limit(1);

  if (error) {
    console.error(
      "Erro ao verificar permissão de consulta:",
      error.message
    );

    return false;
  }

  return Boolean(data?.length);
}

async function registrarLogAuditoria({
  request,
  usuario,
  perfil,
  municipioId,
  acao,
  descricao,
  registroId,
  detalhes,
  status = "SUCESSO",
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  acao: string;
  descricao: string;
  registroId?: number | null;
  detalhes: Record<string, unknown>;
  status?: "SUCESSO" | "ERRO";
}) {
  return supabaseAdmin.from("auditoria").insert({
    municipio_id: municipioId,
    guarda_id: Number(usuario.id),
    usuario_nome:
      String(usuario.nome || "").trim() ||
      "Usuário não informado",
    usuario_email: usuario.email || null,
    perfil,
    modulo: "Consultas Operacionais",
    acao,
    descricao,
    registro_id: registroId
      ? String(registroId)
      : null,
    tabela: "consultas_operacionais",
    status,
    ip: obterIp(request),
    dispositivo: obterDispositivo(request),
    detalhes,
  });
}

export async function GET(request: NextRequest) {
  try {
    const autorizacao = await autenticar(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const autorizado = await possuiPermissao(
      autorizacao.perfil,
      autorizacao.municipioId,
      [
        "consulta_global",
        "consulta_cpf",
        "consulta_placa",
      ]
    );

    if (!autorizado) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para acessar consultas operacionais.",
        },
        403
      );
    }

    const { data, error } = await supabaseAdmin
      .from("consultas_operacionais")
      .select(
        "id,tipo,consulta,motivo,resultado,criado_em"
      )
      .eq(
        "municipio_id",
        autorizacao.municipioId
      )
      .eq(
        "usuario_id",
        String(autorizacao.usuario.id)
      )
      .order("criado_em", {
        ascending: false,
      })
      .limit(5);

    if (error) {
      console.error(
        "Erro ao carregar histórico de consultas:",
        error.message
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar o histórico de consultas.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        historico: data || [],
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao listar consultas:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao carregar consultas operacionais.",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const autorizacao = await autenticar(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return responder(
        {
          ok: false,
          erro: "Dados da consulta inválidos.",
        },
        400
      );
    }

    const tipo = String(
      body.tipo || ""
    ).toUpperCase();

    if (!TIPOS_PERMITIDOS.has(tipo)) {
      return responder(
        {
          ok: false,
          erro: "Tipo de consulta inválido.",
        },
        422
      );
    }

    const consulta = normalizarConsulta(
      tipo,
      body.consulta
    );

    if (!consulta) {
      return responder(
        {
          ok: false,
          erro:
            "O dado informado não corresponde ao tipo de consulta selecionado.",
        },
        422
      );
    }

    const motivo = texto(body.motivo, 500, true);

    if (!motivo || motivo.length < 10) {
      return responder(
        {
          ok: false,
          erro:
            "Informe um motivo com pelo menos 10 caracteres.",
        },
        422
      );
    }

    const modulosPermitidos = modulosDoTipo(tipo);
    const autorizado = await possuiPermissao(
      autorizacao.perfil,
      autorizacao.municipioId,
      modulosPermitidos
    );

    if (!autorizado) {
      return responder(
        {
          ok: false,
          erro:
            "Seu perfil não possui permissão para este tipo de consulta.",
        },
        403
      );
    }

    const { data, error } = await supabaseAdmin
      .from("consultas_operacionais")
      .insert({
        municipio_id: autorizacao.municipioId,
        usuario_id: String(autorizacao.usuario.id),
        tipo,
        consulta,
        motivo,
        resultado: "EM_DESENVOLVIMENTO",
      })
      .select(
        "id,tipo,consulta,motivo,resultado,criado_em"
      )
      .single();

    if (error || !data) {
      console.error(
        "Erro ao registrar consulta operacional:",
        error?.message
      );

      await registrarLogAuditoria({
        request,
        usuario: autorizacao.usuario,
        perfil: autorizacao.perfil,
        municipioId: autorizacao.municipioId,
        acao: "ERRO",
        descricao:
          "Erro ao registrar consulta operacional.",
        detalhes: {
          tipo,
          consulta,
          erro: error?.message || "Erro desconhecido",
        },
        status: "ERRO",
      });

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível registrar a consulta operacional.",
        },
        500
      );
    }

    const { error: auditoriaError } =
      await registrarLogAuditoria({
        request,
        usuario: autorizacao.usuario,
        perfil: autorizacao.perfil,
        municipioId: autorizacao.municipioId,
        acao: "CONSULTAR",
        descricao:
          `Registrou consulta operacional do tipo ${tipo}.`,
        registroId: Number(data.id),
        detalhes: {
          tipo,
          consulta,
          motivo,
        },
      });

    if (auditoriaError) {
      console.error(
        "Erro ao auditar consulta operacional:",
        auditoriaError.message
      );

      await supabaseAdmin
        .from("consultas_operacionais")
        .delete()
        .eq("id", data.id)
        .eq(
          "municipio_id",
          autorizacao.municipioId
        );

      return responder(
        {
          ok: false,
          erro:
            "A consulta não foi registrada porque a auditoria falhou.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        consulta: data,
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao registrar consulta:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao registrar consulta operacional.",
      },
      500
    );
  }
}
