import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type UsuarioApiAutenticado = {
  id: string | number;
  auth_id: string;
  nome: string;
  email: string;
  perfil: string;
  status: string;
  municipio_id: number | null;
  nivel_acesso: number;
};

function respostaErro(mensagem: string, status: number) {
  return NextResponse.json(
    { erro: mensagem },
    {
      status,
      headers: { "Cache-Control": "no-store" },
    }
  );
}

function obterToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

export async function autenticarUsuarioApi(
  request: NextRequest
): Promise<
  | { ok: true; usuario: UsuarioApiAutenticado; token: string }
  | { ok: false; resposta: NextResponse }
> {
  const token = obterToken(request);

  if (!token) {
    return {
      ok: false,
      resposta: respostaErro("Token de autenticação não informado.", 401),
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return {
      ok: false,
      resposta: respostaErro("Sessão inválida ou expirada.", 401),
    };
  }

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select(
      "id,auth_id,nome,email,perfil,status,municipio_id,nivel_acesso,nivel"
    )
    .eq("auth_id", user.id)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      resposta: respostaErro("Usuário não localizado no sistema.", 403),
    };
  }

  const status = String(data.status || "").toUpperCase();

  if (status !== "ATIVO") {
    return {
      ok: false,
      resposta: respostaErro("Usuário sem acesso ativo.", 403),
    };
  }

  const perfil = String(data.perfil || "").toUpperCase();
  const municipioId = data.municipio_id
    ? Number(data.municipio_id)
    : null;

  if (perfil !== "DESENVOLVEDOR" && !municipioId) {
    return {
      ok: false,
      resposta: respostaErro("Usuário sem município vinculado.", 403),
    };
  }

  return {
    ok: true,
    token,
    usuario: {
      id: data.id,
      auth_id: user.id,
      nome: String(data.nome || ""),
      email: String(user.email || data.email || ""),
      perfil,
      status,
      municipio_id: municipioId,
      nivel_acesso: Number(data.nivel_acesso || data.nivel || 40),
    },
  };
}
