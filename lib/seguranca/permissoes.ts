import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  HIERARQUIA_PERFIS,
  Perfil,
  perfilValido,
} from "@/lib/permissoes/catalogo";

export type GestorPermissoes = {
  authEmail: string;
  perfil: Perfil;
  usuario: {
    id: number;
    auth_id: string;
    nome: string;
    municipio_id: number | null;
  };
};

const PERFIS_GESTORES: Perfil[] = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
];

export function responderPermissoes(
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

export function obterIp(request: NextRequest) {
  const valor =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "Não identificado";

  return valor.split(",")[0].trim().slice(0, 64);
}

export function obterDispositivo(request: NextRequest) {
  return String(
    request.headers.get("user-agent") ||
      "Não identificado"
  ).slice(0, 500);
}

export async function autenticarGestorPermissoes(
  request: NextRequest
): Promise<
  | {
      ok: true;
      gestor: GestorPermissoes;
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
      resposta: responderPermissoes(
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
      resposta: responderPermissoes(
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

  if (error || !data) {
    return {
      ok: false,
      resposta: responderPermissoes(
        {
          ok: false,
          erro: "Usuário responsável não localizado.",
        },
        403
      ),
    };
  }

  const perfilTexto = String(
    data.perfil || ""
  ).toUpperCase();

  if (
    String(data.status || "").toUpperCase() !== "ATIVO" ||
    !perfilValido(perfilTexto) ||
    !PERFIS_GESTORES.includes(perfilTexto)
  ) {
    return {
      ok: false,
      resposta: responderPermissoes(
        {
          ok: false,
          erro:
            "Usuário sem permissão para gerenciar a matriz de acesso.",
        },
        403
      ),
    };
  }

  if (
    perfilTexto !== "DESENVOLVEDOR" &&
    !data.municipio_id
  ) {
    return {
      ok: false,
      resposta: responderPermissoes(
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
      authEmail:
        authUser.email || data.email || "",
      perfil: perfilTexto,
      usuario: {
        id: Number(data.id),
        auth_id: authUser.id,
        nome: String(data.nome || ""),
        municipio_id: data.municipio_id
          ? Number(data.municipio_id)
          : null,
      },
    },
  };
}

export function nivelPerfil(perfil: Perfil) {
  return HIERARQUIA_PERFIS[perfil];
}
