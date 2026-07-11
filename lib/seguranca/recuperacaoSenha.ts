import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

export type Perfil = (typeof PERFIS)[number];

export type GestorRecuperacao = {
  authEmail: string;
  usuario: {
    id: number;
    auth_id: string | null;
    nome: string;
    email: string | null;
    perfil: string | null;
    status: string | null;
    municipio_id: number | null;
  };
  perfil: Perfil;
};

const PERFIS_GESTORES: Perfil[] = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
];

export function responder(
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

export async function autenticarGestorRecuperacao(
  request: NextRequest
): Promise<
  | {
      ok: true;
      gestor: GestorRecuperacao;
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

  const perfil = normalizarPerfil(data.perfil);

  if (
    String(data.status || "").toUpperCase() !== "ATIVO" ||
    !perfil ||
    !PERFIS_GESTORES.includes(perfil)
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário sem permissão para gerenciar recuperações.",
        },
        403
      ),
    };
  }

  if (perfil !== "DESENVOLVEDOR" && !data.municipio_id) {
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
      authEmail: authUser.email || data.email || "",
      usuario: {
        id: Number(data.id),
        auth_id: data.auth_id || null,
        nome: data.nome || "",
        email: data.email || null,
        perfil: data.perfil || null,
        status: data.status || null,
        municipio_id: data.municipio_id
          ? Number(data.municipio_id)
          : null,
      },
      perfil,
    },
  };
}

export function municipioPermitido(
  gestor: GestorRecuperacao,
  municipioId: number
) {
  return (
    gestor.perfil === "DESENVOLVEDOR" ||
    gestor.usuario.municipio_id === municipioId
  );
}

export async function registrarLogRecuperacao(
  request: NextRequest,
  gestor: GestorRecuperacao,
  municipioId: number,
  acao: string,
  status: "SUCESSO" | "FALHA" = "SUCESSO"
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
    acao: acao.slice(0, 120),
    status,
  });
}
