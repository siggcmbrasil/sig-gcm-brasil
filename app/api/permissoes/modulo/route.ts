import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioSistema = {
  id: number;
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

function normalizarModulo(valor: unknown) {
  const modulo = String(valor || "")
    .trim()
    .toLowerCase();

  if (
    modulo.length < 2 ||
    modulo.length > 100 ||
    !/^[a-z0-9_]+$/.test(modulo)
  ) {
    return null;
  }

  return modulo;
}

export async function GET(request: NextRequest) {
  try {
    const token = obterToken(request);

    if (!token) {
      return responder(
        {
          ok: false,
          permitido: false,
          erro: "Token de autenticação não informado.",
        },
        401
      );
    }

    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !authUser) {
      return responder(
        {
          ok: false,
          permitido: false,
          erro: "Sessão inválida ou expirada.",
        },
        401
      );
    }

    const modulo = normalizarModulo(
      request.nextUrl.searchParams.get("modulo")
    );

    if (!modulo) {
      return responder(
        {
          ok: false,
          permitido: false,
          erro: "Módulo informado é inválido.",
        },
        422
      );
    }

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select("id,perfil,status,municipio_id")
      .eq("auth_id", authUser.id)
      .maybeSingle();

    const usuario = data as UsuarioSistema | null;

    if (error || !usuario) {
      return responder(
        {
          ok: false,
          permitido: false,
          erro: "Usuário não localizado no sistema.",
        },
        403
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
          permitido: false,
          erro: "Usuário sem acesso ativo.",
        },
        403
      );
    }

    if (perfil === "DESENVOLVEDOR") {
      return responder(
        {
          ok: true,
          permitido: true,
          modulo,
          perfil,
        },
        200
      );
    }

    const municipioId = Number(usuario.municipio_id);

    if (
      !Number.isSafeInteger(municipioId) ||
      municipioId <= 0
    ) {
      return responder(
        {
          ok: false,
          permitido: false,
          erro: "Usuário sem município vinculado.",
        },
        403
      );
    }

    const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

const {
  data: assinatura,
  error: assinaturaError,
} = await supabaseAdmin
  .from("assinaturas_municipios")
  .select(
    "id, plano_id, status, data_inicio, data_vencimento"
  )
  .eq("municipio_id", municipioId)
  .eq("status", "ATIVA")
  .order("data_inicio", {
    ascending: false,
  })
  .limit(1)
  .maybeSingle();

if (assinaturaError) {
  console.error(
    "Erro ao verificar assinatura do município:",
    {
      message: assinaturaError.message,
      municipio_id: municipioId,
      modulo,
    }
  );

  return responder(
    {
      ok: false,
      permitido: false,
      erro: "Não foi possível verificar a assinatura do município.",
    },
    500
  );
}

if (!assinatura?.plano_id) {
  return responder(
    {
      ok: true,
      permitido: false,
      motivo: "ASSINATURA_INATIVA",
      erro:
        "O município não possui uma assinatura ativa.",
    },
    200
  );
}

if (assinatura.data_vencimento) {
  const vencimento = new Date(
    `${assinatura.data_vencimento}T23:59:59`
  );

  if (
    Number.isFinite(vencimento.getTime()) &&
    vencimento < hoje
  ) {
    return responder(
      {
        ok: true,
        permitido: false,
        motivo: "ASSINATURA_VENCIDA",
        erro:
          "A assinatura do município está vencida.",
      },
      200
    );
  }
}

const {
  data: plano,
  error: planoError,
} = await supabaseAdmin
  .from("planos_sistema")
  .select("id, nome, ativo")
  .eq("id", assinatura.plano_id)
  .maybeSingle();

if (planoError) {
  console.error(
    "Erro ao verificar plano contratado:",
    {
      message: planoError.message,
      municipio_id: municipioId,
      plano_id: assinatura.plano_id,
      modulo,
    }
  );

  return responder(
    {
      ok: false,
      permitido: false,
      erro:
        "Não foi possível verificar o plano contratado.",
    },
    500
  );
}

if (!plano || plano.ativo !== true) {
  return responder(
    {
      ok: true,
      permitido: false,
      motivo: "PLANO_INATIVO",
      erro:
        "O plano contratado está inativo.",
    },
    200
  );
}

const {
  data: moduloPlano,
  error: moduloPlanoError,
} = await supabaseAdmin
  .from("planos_modulos")
  .select("id, ativo")
  .eq("plano_id", assinatura.plano_id)
  .eq("modulo", modulo)
  .eq("ativo", true)
  .maybeSingle();

if (moduloPlanoError) {
  console.error(
    "Erro ao verificar módulo contratado:",
    {
      message: moduloPlanoError.message,
      municipio_id: municipioId,
      plano_id: assinatura.plano_id,
      modulo,
    }
  );

  return responder(
    {
      ok: false,
      permitido: false,
      erro:
        "Não foi possível verificar os módulos do plano.",
    },
    500
  );
}

if (!moduloPlano) {
  return responder(
    {
      ok: true,
      permitido: false,
      motivo: "MODULO_NAO_CONTRATADO",
      modulo,
      plano: plano.nome,
      erro:
        "Este módulo não está incluído no plano contratado.",
    },
    200
  );
}

    const {
      data: permissao,
      error: permissaoError,
    } = await supabaseAdmin
      .from("permissoes_perfis")
      .select("pode_ver")
      .eq("municipio_id", municipioId)
      .eq("perfil", perfil)
      .eq("modulo", modulo)
      .maybeSingle();

    if (permissaoError) {
      console.error(
        "Erro ao verificar permissão do módulo:",
        {
          message: permissaoError.message,
          perfil,
          modulo,
          municipio_id: municipioId,
        }
      );

      return responder(
        {
          ok: false,
          permitido: false,
          erro: "Não foi possível verificar a permissão.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        permitido: Boolean(permissao?.pode_ver),
        modulo,
        perfil,
        municipio_id: municipioId,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao verificar módulo:",
      error
    );

    return responder(
      {
        ok: false,
        permitido: false,
        erro: "Erro interno ao verificar a permissão.",
      },
      500
    );
  }
}
