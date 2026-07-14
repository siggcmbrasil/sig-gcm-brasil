import { randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERFIS = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
] as const;

type Perfil = (typeof PERFIS)[number];

type UsuarioBanco = {
  id: number;
  auth_id: string | null;
  nome: string;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type Gestor = {
  authEmail: string;
  usuario: UsuarioBanco;
  perfil: Perfil;
};

type ConviteBanco = {
  id: number;
  municipio_id: number;
  token: string;
  perfil: string;
  email_destino: string | null;
  expira_em: string;
  limite_uso: number;
  usos: number;
  ativo: boolean;
  criado_em: string;
  desativado_em: string | null;
};

const PERFIS_GESTORES: Perfil[] = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
];

const NIVEL_PERFIL: Record<Perfil, number> = {
  DESENVOLVEDOR: 100,
  ADMIN: 90,
  COMANDANTE: 80,
  DIRETOR: 70,
  CMT_GUARNICAO: 60,
  PLANTONISTA: 50,
  GUARDA: 40,
  CONSULTA: 10,
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
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

function normalizarPerfil(valor: string | null): Perfil | null {
  const perfil = String(valor || "").toUpperCase();

  return PERFIS.includes(perfil as Perfil)
    ? (perfil as Perfil)
    : null;
}

function perfisPermitidos(perfilAtor: Perfil) {
  if (perfilAtor === "DESENVOLVEDOR") {
    return [...PERFIS];
  }

  return PERFIS.filter(
    (perfil) =>
      NIVEL_PERFIL[perfil] < NIVEL_PERFIL[perfilAtor]
  );
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function conviteResposta(convite: ConviteBanco) {
  return {
    id: Number(convite.id),
    municipio_id: Number(convite.municipio_id),
    token: convite.token,
    perfil:
      normalizarPerfil(convite.perfil) || "CONSULTA",
    email_destino: convite.email_destino || null,
    expira_em: convite.expira_em,
    limite_uso: Number(convite.limite_uso),
    usos: Number(convite.usos),
    ativo: Boolean(convite.ativo),
    criado_em: convite.criado_em,
    desativado_em: convite.desativado_em || null,
  };
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
  return (
    request.headers.get("user-agent") || "Não identificado"
  ).slice(0, 500);
}

function identificarNavegador(userAgent: string) {
  if (userAgent.includes("Edg/")) return "Edge";
  if (userAgent.includes("OPR/")) return "Opera";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("SamsungBrowser/")) {
    return "Samsung Internet";
  }
  if (userAgent.includes("Chrome/")) return "Chrome";

  if (
    userAgent.includes("Safari/") &&
    !userAgent.includes("Chrome/")
  ) {
    return "Safari";
  }

  return "Outro";
}

async function autenticarGestor(
  request: NextRequest
): Promise<
  | {
      ok: true;
      gestor: Gestor;
    }
  | {
      ok: false;
      resposta: NextResponse;
    }
> {
  const token = obterToken(request);

  if (!token) {
    return {
      ok: false,
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
      ok: false,
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
    .select("id,auth_id,nome,email,perfil,status,municipio_id")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário responsável não foi localizado.",
        },
        403
      ),
    };
  }

  const usuario = data as UsuarioBanco;
  const perfil = normalizarPerfil(usuario.perfil);

  if (
    String(usuario.status || "").toUpperCase() !== "ATIVO" ||
    !perfil ||
    !PERFIS_GESTORES.includes(perfil)
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário sem permissão para gerenciar convites.",
        },
        403
      ),
    };
  }

  if (
    perfil !== "DESENVOLVEDOR" &&
    !usuario.municipio_id
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Gestor sem município vinculado.",
        },
        403
      ),
    };
  }

  return {
    ok: true,
    gestor: {
      authEmail: authUser.email || usuario.email || "",
      usuario,
      perfil,
    },
  };
}

async function carregarMunicipiosPermitidos(
  gestor: Gestor
) {
  if (gestor.perfil === "DESENVOLVEDOR") {
    const { data, error } = await supabaseAdmin
      .from("municipios")
      .select("id,nome,estado")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error("Não foi possível carregar os municípios.");
    }

    return (data || []).map((item) => ({
      id: Number(item.id),
      nome: item.nome,
      estado: item.estado,
    }));
  }

  const { data, error } = await supabaseAdmin
    .from("municipios")
    .select("id,nome,estado")
    .eq("id", gestor.usuario.municipio_id)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Município do gestor não foi localizado.");
  }

  return [
    {
      id: Number(data.id),
      nome: data.nome,
      estado: data.estado,
    },
  ];
}

function municipioPermitido(
  gestor: Gestor,
  municipioId: number
) {
  return (
    gestor.perfil === "DESENVOLVEDOR" ||
    gestor.usuario.municipio_id === municipioId
  );
}

function perfilPermitido(
  gestor: Gestor,
  perfil: Perfil
) {
  return perfisPermitidos(gestor.perfil).includes(perfil);
}

async function registrarLog(
  request: NextRequest,
  gestor: Gestor,
  municipioId: number,
  acao: "CONVITE_CRIAR" | "CONVITE_DESATIVAR"
) {
  const dispositivo = obterDispositivo(request);

  return supabaseAdmin.from("logs_acesso").insert({
    usuario_id: gestor.usuario.id,
    municipio_id:
      gestor.usuario.municipio_id || municipioId,
    email: gestor.authEmail,
    ip: obterIp(request),
    dispositivo,
    navegador: identificarNavegador(dispositivo),
    acao,
    status: "SUCESSO",
  });
}

export async function GET(request: NextRequest) {
  try {
    const autorizacao = await autenticarGestor(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const gestor = autorizacao.gestor;
    const municipios = await carregarMunicipiosPermitidos(
      gestor
    );

    const solicitado = Number(
      request.nextUrl.searchParams.get("municipio_id")
    );

    let municipioSelecionado =
      Number.isSafeInteger(solicitado) && solicitado > 0
        ? solicitado
        : gestor.usuario.municipio_id ||
          municipios[0]?.id ||
          0;

    if (
      !municipioSelecionado ||
      !municipioPermitido(gestor, municipioSelecionado) ||
      !municipios.some(
        (item) => item.id === municipioSelecionado
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Município não permitido para este usuário.",
        },
        403
      );
    }

    const { data, error } = await supabaseAdmin
      .from("convites_usuarios")
      .select(
        "id,municipio_id,token,perfil,email_destino,expira_em,limite_uso,usos,ativo,criado_em,desativado_em"
      )
      .eq("municipio_id", municipioSelecionado)
      .order("criado_em", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Erro ao listar convites:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível carregar os convites.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        perfil_atual: gestor.perfil,
        perfis_permitidos: perfisPermitidos(
          gestor.perfil
        ),
        municipios,
        municipio_selecionado: municipioSelecionado,
        convites: (data || []).map((item) =>
          conviteResposta(item as ConviteBanco)
        ),
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado ao listar convites:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao carregar os convites.",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  let conviteCriadoId: number | null = null;

  try {
    const autorizacao = await autenticarGestor(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const gestor = autorizacao.gestor;
    const corpo = (await request.json().catch(() => null)) as {
      municipio_id?: number;
      perfil?: string;
      email_destino?: string | null;
      validade_dias?: number;
      limite_uso?: number;
    } | null;

    const municipioId = Number(corpo?.municipio_id);
    const perfil = normalizarPerfil(corpo?.perfil || null);
    const emailDestino = String(
      corpo?.email_destino || ""
    )
      .trim()
      .toLowerCase();
    const validadeDias = Number(corpo?.validade_dias);
    const limiteUso = Number(corpo?.limite_uso);

    if (
      !Number.isSafeInteger(municipioId) ||
      municipioId <= 0 ||
      !municipioPermitido(gestor, municipioId)
    ) {
      return responder(
        {
          ok: false,
          erro: "Município informado não é permitido.",
        },
        403
      );
    }

    if (!perfil || !perfilPermitido(gestor, perfil)) {
      return responder(
        {
          ok: false,
          erro: "Perfil informado não é permitido.",
        },
        403
      );
    }

    if (
      emailDestino &&
      (
        !emailValido(emailDestino) ||
        emailDestino.length > 160
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "E-mail de destino inválido.",
        },
        422
      );
    }

    if (![1, 2, 7, 15, 30].includes(validadeDias)) {
      return responder(
        {
          ok: false,
          erro: "Validade informada é inválida.",
        },
        422
      );
    }

    if (
      !Number.isSafeInteger(limiteUso) ||
      limiteUso < 1 ||
      limiteUso > 20
    ) {
      return responder(
        {
          ok: false,
          erro: "O limite de uso deve ficar entre 1 e 20.",
        },
        422
      );
    }

    const { data: municipio, error: municipioError } =
      await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", municipioId)
        .eq("ativo", true)
        .maybeSingle();

    if (municipioError || !municipio) {
      return responder(
        {
          ok: false,
          erro: "O município selecionado não está ativo.",
        },
        422
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiraEm = new Date(
      Date.now() + validadeDias * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data, error } = await supabaseAdmin
      .from("convites_usuarios")
      .insert({
        municipio_id: municipioId,
        token,
        perfil,
        email_destino: emailDestino || null,
        criado_por: gestor.usuario.id,
        expira_em: expiraEm,
        limite_uso: limiteUso,
        usos: 0,
        ativo: true,
      })
      .select(
        "id,municipio_id,token,perfil,email_destino,expira_em,limite_uso,usos,ativo,criado_em,desativado_em"
      )
      .single();

    if (error || !data) {
      console.error("Erro ao criar convite:", {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível gerar o convite.",
        },
        500
      );
    }

    conviteCriadoId = Number(data.id);

    const { error: logError } = await registrarLog(
      request,
      gestor,
      municipioId,
      "CONVITE_CRIAR"
    );

    if (logError) {
      await supabaseAdmin
        .from("convites_usuarios")
        .delete()
        .eq("id", conviteCriadoId);

      conviteCriadoId = null;

      console.error(
        "Convite revertido por falha de auditoria:",
        {
          message: logError.message,
          details: logError.details,
          hint: logError.hint,
          code: logError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro: "O convite não foi criado porque a auditoria falhou.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        convite: conviteResposta(data as ConviteBanco),
      },
      201
    );
  } catch (error) {
    if (conviteCriadoId) {
      await supabaseAdmin
        .from("convites_usuarios")
        .delete()
        .eq("id", conviteCriadoId);
    }

    console.error("Erro inesperado ao criar convite:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao criar o convite.",
      },
      500
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const autorizacao = await autenticarGestor(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const gestor = autorizacao.gestor;
    const corpo = (await request.json().catch(() => null)) as {
      id?: number;
      acao?: string;
    } | null;

    const conviteId = Number(corpo?.id);
    const acao = String(corpo?.acao || "").toUpperCase();

    if (
      !Number.isSafeInteger(conviteId) ||
      conviteId <= 0 ||
      acao !== "DESATIVAR"
    ) {
      return responder(
        {
          ok: false,
          erro: "Solicitação de desativação inválida.",
        },
        422
      );
    }

    const { data: conviteData, error: conviteError } =
      await supabaseAdmin
        .from("convites_usuarios")
        .select(
          "id,municipio_id,token,perfil,email_destino,expira_em,limite_uso,usos,ativo,criado_em,desativado_em"
        )
        .eq("id", conviteId)
        .maybeSingle();

    if (conviteError || !conviteData) {
      return responder(
        {
          ok: false,
          erro: "Convite não encontrado.",
        },
        404
      );
    }

    const convite = conviteData as ConviteBanco;
    const perfilConvite =
      normalizarPerfil(convite.perfil) || "CONSULTA";

    if (
      !municipioPermitido(
        gestor,
        Number(convite.municipio_id)
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido gerenciar convite de outro município.",
        },
        403
      );
    }

    if (!perfilPermitido(gestor, perfilConvite)) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido gerenciar convite deste nível.",
        },
        403
      );
    }

    if (!convite.ativo) {
      return responder(
        {
          ok: false,
          erro: "Este convite já está inativo.",
        },
        409
      );
    }

    const agora = new Date().toISOString();

    const { data: conviteAtualizado, error: updateError } =
      await supabaseAdmin
        .from("convites_usuarios")
        .update({
          ativo: false,
          desativado_por: gestor.usuario.auth_id,
          desativado_em: agora,
        })
        .eq("id", convite.id)
        .select(
          "id,municipio_id,token,perfil,email_destino,expira_em,limite_uso,usos,ativo,criado_em,desativado_em"
        )
        .single();

    if (updateError || !conviteAtualizado) {
      return responder(
        {
          ok: false,
          erro: "Não foi possível desativar o convite.",
        },
        500
      );
    }

    const { error: logError } = await registrarLog(
      request,
      gestor,
      Number(convite.municipio_id),
      "CONVITE_DESATIVAR"
    );

    if (logError) {
      await supabaseAdmin
        .from("convites_usuarios")
        .update({
          ativo: true,
          desativado_por: null,
          desativado_em: null,
        })
        .eq("id", convite.id);

      console.error(
        "Desativação revertida por falha de auditoria:",
        {
          message: logError.message,
          details: logError.details,
          hint: logError.hint,
          code: logError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro: "O convite permaneceu ativo porque a auditoria falhou.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        convite: conviteResposta(
          conviteAtualizado as ConviteBanco
        ),
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado ao desativar convite:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao desativar o convite.",
      },
      500
    );
  }
}
