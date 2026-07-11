import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_PERMITIDOS = new Set([
  "SUCESSO",
  "ERRO",
  "ALERTA",
]);

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

function inteiroPositivo(valor: unknown) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) && numero > 0
    ? numero
    : null;
}

export async function POST(request: NextRequest) {
  try {
    const token = obterToken(request);

    if (!token) {
      return responder(
        {
          ok: false,
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
          erro: "Sessão inválida ou expirada.",
        },
        401
      );
    }

    const { data: usuario, error: usuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .select(
          "id,auth_id,nome,email,perfil,status,municipio_id"
        )
        .eq("auth_id", authUser.id)
        .maybeSingle();

    if (usuarioError || !usuario) {
      return responder(
        {
          ok: false,
          erro: "Usuário responsável não localizado.",
        },
        403
      );
    }

    const perfil = String(
      usuario.perfil || ""
    ).toUpperCase();

    if (
      String(usuario.status || "").toUpperCase() !==
      "ATIVO"
    ) {
      return responder(
        {
          ok: false,
          erro: "Usuário sem acesso ativo.",
        },
        403
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return responder(
        {
          ok: false,
          erro: "Dados da auditoria inválidos.",
        },
        400
      );
    }

    const modulo = texto(body.modulo, 100, true);
    const acao = texto(body.acao, 100, true);
    const descricao = texto(
      body.descricao,
      2000,
      true
    );

    if (!modulo || !acao || !descricao) {
      return responder(
        {
          ok: false,
          erro:
            "Módulo, ação e descrição são obrigatórios.",
        },
        422
      );
    }

    const statusSolicitado = String(
      body.status || "SUCESSO"
    ).toUpperCase();

    if (!STATUS_PERMITIDOS.has(statusSolicitado)) {
      return responder(
        {
          ok: false,
          erro: "Status da auditoria inválido.",
        },
        422
      );
    }

    let municipioId = usuario.municipio_id
      ? Number(usuario.municipio_id)
      : null;

    if (perfil === "DESENVOLVEDOR") {
      const municipioSolicitado = inteiroPositivo(
        body.municipio_id
      );

      if (municipioSolicitado) {
        const { data: municipio, error: municipioError } =
          await supabaseAdmin
            .from("municipios")
            .select("id")
            .eq("id", municipioSolicitado)
            .eq("ativo", true)
            .maybeSingle();

        if (municipioError || !municipio) {
          return responder(
            {
              ok: false,
              erro: "Município de auditoria inválido.",
            },
            422
          );
        }

        municipioId = Number(municipio.id);
      }
    }

    if (!municipioId) {
      return responder(
        {
          ok: false,
          erro:
            "Não foi possível identificar o município da auditoria.",
        },
        422
      );
    }

    const detalhes =
      body.detalhes === undefined
        ? null
        : body.detalhes;

    if (
      detalhes !== null &&
      JSON.stringify(detalhes).length > 20000
    ) {
      return responder(
        {
          ok: false,
          erro: "Detalhes da auditoria muito extensos.",
        },
        413
      );
    }

    const { error: insertError } =
      await supabaseAdmin.from("auditoria").insert({
        municipio_id: municipioId,
        guarda_id: Number(usuario.id),
        usuario_nome:
          String(usuario.nome || "").trim() ||
          "Usuário não informado",
        usuario_email:
          authUser.email ||
          usuario.email ||
          null,
        perfil,
        modulo,
        acao,
        descricao,
        registro_id: texto(
          body.registro_id,
          200
        ),
        tabela: texto(body.tabela, 150),
        status: statusSolicitado,
        ip: obterIp(request),
        dispositivo: obterDispositivo(request),
        detalhes,
      });

    if (insertError) {
      console.error(
        "Erro ao registrar auditoria:",
        insertError.message
      );

      return responder(
        {
          ok: false,
          erro: "Não foi possível registrar a auditoria.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado na API de auditoria:",
      error
    );

    return responder(
      {
        ok: false,
        erro: "Erro interno ao registrar auditoria.",
      },
      500
    );
  }
}
