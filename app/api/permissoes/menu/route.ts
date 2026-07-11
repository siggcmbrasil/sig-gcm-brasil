import { NextRequest, NextResponse } from "next/server";

import { MODULOS_CATALOGO } from "@/lib/permissoes/catalogo";
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

type Municipio = {
  id: number;
  nome: string | null;
  brasao_gcm: string | null;
  ativo: boolean | null;
};

function responder(corpo: Record<string, unknown>, status: number) {
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

function numeroId(valor: unknown) {
  const numero = Number(valor);

  if (!Number.isSafeInteger(numero) || numero <= 0) {
    return null;
  }

  return numero;
}

export async function GET(request: NextRequest) {
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

    const { data, error } = await supabaseAdmin
      .from("usuarios")
      .select("id,nome,email,perfil,status,municipio_id")
      .eq("auth_id", authUser.id)
      .maybeSingle<UsuarioSistema>();

    if (error || !data) {
      return responder(
        {
          ok: false,
          erro: "Usuário não localizado no sistema.",
        },
        403
      );
    }

    const perfil = String(data.perfil || "")
      .trim()
      .toUpperCase();

    const status = String(data.status || "")
      .trim()
      .toUpperCase();

    if (status !== "ATIVO") {
      return responder(
        {
          ok: false,
          erro: "Usuário sem acesso ativo.",
        },
        403
      );
    }

    let municipioId = numeroId(data.municipio_id);

    if (perfil === "DESENVOLVEDOR") {
      const municipioContexto = numeroId(
        request.nextUrl.searchParams.get("municipio_id")
      );

      if (municipioContexto) {
        municipioId = municipioContexto;
      }
    }

    let municipioNome: string | null = null;
    let brasaoGcm: string | null = null;

    if (municipioId) {
      const { data: municipio, error: municipioError } = await supabaseAdmin
        .from("municipios")
        .select("id,nome,brasao_gcm,ativo")
        .eq("id", municipioId)
        .maybeSingle<Municipio>();

      if (municipioError) {
        console.error("Erro ao carregar município do menu:", {
          message: municipioError.message,
          details: municipioError.details,
          hint: municipioError.hint,
          code: municipioError.code,
          municipio_id: municipioId,
        });

        return responder(
          {
            ok: false,
            erro: "Não foi possível carregar o município do menu.",
          },
          500
        );
      }

      if (!municipio || municipio.ativo === false) {
        return responder(
          {
            ok: false,
            erro: "Município inexistente ou inativo.",
          },
          404
        );
      }

      municipioNome = String(municipio.nome || "").trim() || null;
      brasaoGcm = String(municipio.brasao_gcm || "").trim() || null;
    }

    if (perfil === "DESENVOLVEDOR") {
      return responder(
        {
          ok: true,
          perfil,
          municipio_id: municipioId,
          municipio_nome: municipioNome,
          brasao_gcm: brasaoGcm,
          modulos: [...MODULOS_CATALOGO],
        },
        200
      );
    }

    if (!municipioId) {
      return responder(
        {
          ok: false,
          erro: "Usuário sem município vinculado.",
        },
        403
      );
    }

    const { data: permissoes, error: permissoesError } = await supabaseAdmin
      .from("permissoes_perfis")
      .select("modulo")
      .eq("municipio_id", municipioId)
      .eq("perfil", perfil)
      .eq("pode_ver", true);

    if (permissoesError) {
      console.error("Erro ao carregar permissões do menu:", {
        message: permissoesError.message,
        perfil,
        municipio_id: municipioId,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível carregar as permissões do menu.",
        },
        500
      );
    }

    const modulos = Array.from(
      new Set(
        (permissoes || [])
          .map((item) =>
            String(item.modulo || "")
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      )
    );

    return responder(
      {
        ok: true,
        perfil,
        municipio_id: municipioId,
        municipio_nome: municipioNome,
        brasao_gcm: brasaoGcm,
        modulos,
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado ao carregar menu:", {
      message:
        error instanceof Error ? error.message : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao carregar o menu.",
      },
      500
    );
  }
}
