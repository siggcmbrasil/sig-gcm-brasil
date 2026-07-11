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
      .select(
        "id,nome,email,perfil,status,municipio_id"
      )
      .eq("auth_id", authUser.id)
      .maybeSingle();

    const usuario = data as UsuarioSistema | null;

    if (error || !usuario) {
      return responder(
        {
          ok: false,
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
          erro: "Usuário sem acesso ativo.",
        },
        403
      );
    }

    let municipioNome: string | null = null;
    let brasaoGcm: string | null = null;

    if (usuario.municipio_id) {
      const { data: municipio, error: municipioError } =
        await supabaseAdmin
          .from("municipios")
          .select("id,nome,brasao_gcm")
          .eq("id", usuario.municipio_id)
          .maybeSingle();

      if (municipioError) {
        console.error(
          "Erro ao carregar município do menu:",
          municipioError.message
        );
      } else if (municipio) {
        municipioNome =
          String(municipio.nome || "").trim() || null;
        brasaoGcm =
          String(municipio.brasao_gcm || "").trim() ||
          null;
      }
    }

    if (perfil === "DESENVOLVEDOR") {
      return responder(
        {
          ok: true,
          perfil,
          municipio_id: usuario.municipio_id,
          municipio_nome: municipioNome,
          brasao_gcm: brasaoGcm,
          modulos: [...MODULOS_CATALOGO],
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
          erro: "Usuário sem município vinculado.",
        },
        403
      );
    }

    const {
      data: permissoes,
      error: permissoesError,
    } = await supabaseAdmin
      .from("permissoes_perfis")
      .select("modulo")
      .eq("municipio_id", municipioId)
      .eq("perfil", perfil)
      .eq("pode_ver", true);

    if (permissoesError) {
      console.error(
        "Erro ao carregar permissões do menu:",
        {
          message: permissoesError.message,
          perfil,
          municipio_id: municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar as permissões do menu.",
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
    console.error(
      "Erro inesperado ao carregar menu:",
      error
    );

    return responder(
      {
        ok: false,
        erro: "Erro interno ao carregar o menu.",
      },
      500
    );
  }
}
