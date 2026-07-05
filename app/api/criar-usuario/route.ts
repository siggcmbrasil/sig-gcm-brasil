import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

const HIERARQUIA: Record<string, number> = {
  DESENVOLVEDOR: 100,
  ADMIN: 90,
  COMANDANTE: 80,
  DIRETOR: 70,
  CMT_GUARNICAO: 60,
  PLANTONISTA: 50,
  GUARDA: 40,
  CONSULTA: 10,
};

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

    const nome = String(body.nome || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const senha = String(body.senha || "");
    const perfilNovo = String(body.perfil || "").toUpperCase();
    const perfilLogado = String(usuarioLogado.perfil || "").toUpperCase();

    const {
      matricula,
      telefone,
      cpf,
      cargo,
      status,
      observacao,
      municipio_id,
    } = body;

    if (!nome || !email || !senha || !perfilNovo) {
      return NextResponse.json(
        { error: "Nome, email, senha e perfil são obrigatórios." },
        { status: 400 }
      );
    }

    if (senha.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter no mínimo 6 caracteres." },
        { status: 400 }
      );
    }

    if (!HIERARQUIA[perfilLogado] || !HIERARQUIA[perfilNovo]) {
      return NextResponse.json(
        { error: "Perfil inválido." },
        { status: 400 }
      );
    }

    if (!["DESENVOLVEDOR", "ADMIN", "COMANDANTE"].includes(perfilLogado)) {
      return NextResponse.json(
        { error: "Você não tem permissão para criar usuários." },
        { status: 403 }
      );
    }

    if (
      perfilLogado !== "DESENVOLVEDOR" &&
      HIERARQUIA[perfilNovo] >= HIERARQUIA[perfilLogado]
    ) {
      return NextResponse.json(
        { error: "Você não pode criar usuário com perfil igual ou superior ao seu." },
        { status: 403 }
      );
    }

    const municipioFinal =
      perfilLogado === "DESENVOLVEDOR"
        ? municipio_id
        : usuarioLogado.municipio_id;

    if (!municipioFinal) {
      return NextResponse.json(
        { error: "Município é obrigatório." },
        { status: 400 }
      );
    }

    if (
      perfilLogado !== "DESENVOLVEDOR" &&
      Number(municipioFinal) !== Number(usuarioLogado.municipio_id)
    ) {
      return NextResponse.json(
        { error: "Você não pode criar usuários em outro município." },
        { status: 403 }
      );
    }

    const { data: municipioExiste } = await supabaseAdmin
      .from("municipios")
      .select("id")
      .eq("id", municipioFinal)
      .eq("ativo", true)
      .single();

    if (!municipioExiste) {
      return NextResponse.json(
        { error: "Município inválido ou inativo." },
        { status: 400 }
      );
    }

    const { data: emailExistente } = await supabaseAdmin
      .from("usuarios")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (emailExistente) {
      return NextResponse.json(
        { error: "Já existe usuário com este email." },
        { status: 400 }
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

    const { data: novoUsuario, error: usuarioError } = await supabaseAdmin
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
      ])
      .select("id")
      .single();

    if (usuarioError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: usuarioError.message },
        { status: 400 }
      );
    }

    await supabaseAdmin.from("auditoria_sistema").insert({
      municipio_id: municipioFinal,
      usuario_id: usuarioLogado.id,
      modulo: "USUARIOS",
      acao: "CRIAR_USUARIO",
      registro_id: String(novoUsuario?.id || authData.user.id),
      detalhes: `Criou usuário ${nome} (${email}) com perfil ${perfilNovo}.`,
    });

    return NextResponse.json({
      success: true,
      user_id: authData.user.id,
    });
  } catch (error) {
    if (authUserId) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
    }

    console.error(error);

    return NextResponse.json(
      { error: "Erro interno ao criar usuário." },
      { status: 500 }
    );
  }
}