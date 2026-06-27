import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function POST(req: Request) {
  let authUserId: string | undefined;

  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { error: "Usuário não autenticado." },
        { status: 401 }
      );
    }

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Sessão inválida." },
        { status: 401 }
      );
    }

    const { data: usuarioLogado, error: usuarioLogadoError } =
      await supabaseAdmin
        .from("usuarios")
        .select("id, nome, perfil, municipio_id, status")
        .eq("auth_id", userData.user.id)
        .single();

    if (usuarioLogadoError || !usuarioLogado) {
      return NextResponse.json(
        { error: "Usuário logado não encontrado no sistema." },
        { status: 403 }
      );
    }

    if (usuarioLogado.status !== "Ativo") {
      return NextResponse.json(
        { error: "Usuário sem permissão de acesso." },
        { status: 403 }
      );
    }

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

    const perfilLogado = String(usuarioLogado.perfil || "").toUpperCase();
    const perfilNovo = String(perfil || "").toUpperCase();

    if (!nome || !email || !senha || !perfilNovo) {
      return NextResponse.json(
        { error: "Nome, email, senha e perfil são obrigatórios." },
        { status: 400 }
      );
    }

    if (!["DESENVOLVEDOR", "ADMIN", "COMANDANTE"].includes(perfilLogado)) {
      return NextResponse.json(
        { error: "Você não tem permissão para criar usuários." },
        { status: 403 }
      );
    }

    if (perfilNovo === "DESENVOLVEDOR" && perfilLogado !== "DESENVOLVEDOR") {
      return NextResponse.json(
        { error: "Somente DESENVOLVEDOR pode criar outro DESENVOLVEDOR." },
        { status: 403 }
      );
    }

    const municipioFinal =
      perfilLogado === "DESENVOLVEDOR"
        ? municipio_id || null
        : usuarioLogado.municipio_id;

    if (
      perfilLogado !== "DESENVOLVEDOR" &&
      Number(municipioFinal) !== Number(usuarioLogado.municipio_id)
    ) {
      return NextResponse.json(
        { error: "Você não pode criar usuários em outro município." },
        { status: 403 }
      );
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Erro ao criar usuário no Auth." },
        { status: 400 }
      );
    }

    authUserId = authData.user.id;

    const { error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .insert([
        {
          auth_id: authData.user.id,
          nome,
          matricula,
          telefone,
          email,
          cpf,
          cargo,
          perfil: perfilNovo,
          status: status || "Ativo",
          observacao,
          municipio_id: municipioFinal,
        },
      ]);

    if (usuarioError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: usuarioError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user_id: authData.user.id,
    });
  } catch (error) {
    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }

    return NextResponse.json(
      { error: "Erro interno ao criar usuário." },
      { status: 500 }
    );
  }
}