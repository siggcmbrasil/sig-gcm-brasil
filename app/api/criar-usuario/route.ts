import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      nome,
      matricula,
      telefone,
      email,
      cpf,
      cargo,
      perfil,
      status,
      observacao,
      municipio_id,
      senha,
    } = body;

    if (!nome || !email || !senha || !perfil) {
      return NextResponse.json(
        { error: "Nome, email, senha e perfil são obrigatórios." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    const { error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .insert([
        {
          nome,
          matricula,
          telefone,
          email,
          cpf,
          cargo,
          perfil,
          status: status || "Ativo",
          observacao,
          municipio_id: municipio_id || null,
        },
      ]);

    if (usuarioError) {
      return NextResponse.json(
        { error: usuarioError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: authData.user?.id,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro interno ao criar usuário." },
      { status: 500 }
    );
  }
}