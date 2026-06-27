import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { saldo: 0, erro: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { saldo: 0, erro: "Sessão inválida." },
        { status: 401 }
      );
    }

    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .select("id, municipio_id, status")
      .eq("auth_id", authData.user.id)
      .single();

    if (usuarioError || !usuario) {
      return NextResponse.json(
        { saldo: 0, erro: "Usuário não encontrado no sistema." },
        { status: 403 }
      );
    }

    if (usuario.status !== "Ativo") {
      return NextResponse.json(
        { saldo: 0, erro: "Usuário sem permissão de acesso." },
        { status: 403 }
      );
    }

    const municipioId = Number(usuario.municipio_id);

    if (!municipioId) {
      return NextResponse.json(
        { saldo: 0, erro: "Usuário sem município vinculado." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ia_creditos_municipio")
      .select("saldo")
      .eq("municipio_id", municipioId)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar créditos IA:", error);

      return NextResponse.json(
        { saldo: 0, erro: "Erro ao buscar créditos." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        saldo: 0,
        erro: "Município sem créditos cadastrados.",
      });
    }

    return NextResponse.json({
      saldo: data.saldo || 0,
    });
  } catch (error) {
    console.error("Erro geral créditos IA:", error);

    return NextResponse.json(
      { saldo: 0, erro: "Erro ao carregar créditos." },
      { status: 500 }
    );
  }
}