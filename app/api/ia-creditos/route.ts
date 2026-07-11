import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioSistema = {
  auth_id: string;
  municipio_id: number | null;
  perfil: string | null;
  status: string | null;
};

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          erro: "Configuração do Supabase ausente no servidor.",
          detalhes:
            "Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    const authorization = request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          erro: "Sessão não informada.",
        },
        { status: 401 }
      );
    }

    const accessToken = authorization.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          erro: "Token de acesso inválido.",
        },
        { status: 401 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      console.error("Erro ao validar usuário em /api/ia-creditos:", {
        message: userError?.message,
      });

      return NextResponse.json(
        {
          erro: "Sessão inválida ou expirada.",
        },
        { status: 401 }
      );
    }

    const { data: usuario, error: usuarioError } = await supabaseAdmin
      .from("usuarios")
      .select("auth_id,municipio_id,perfil,status")
      .eq("auth_id", user.id)
      .maybeSingle<UsuarioSistema>();

    if (usuarioError) {
      console.error("Erro ao localizar usuário em /api/ia-creditos:", {
        message: usuarioError.message,
        details: usuarioError.details,
        hint: usuarioError.hint,
        code: usuarioError.code,
      });

      return NextResponse.json(
        {
          erro: "Erro ao localizar o usuário no sistema.",
          detalhes: usuarioError.message,
        },
        { status: 500 }
      );
    }

    if (!usuario) {
      return NextResponse.json(
        {
          erro: "Usuário não cadastrado no sistema.",
        },
        { status: 404 }
      );
    }

    if (usuario.status !== "ATIVO") {
      return NextResponse.json(
        {
          erro: "Usuário sem acesso ativo.",
        },
        { status: 403 }
      );
    }

    if (!usuario.municipio_id) {
      return NextResponse.json(
        {
          erro: "Usuário sem município vinculado.",
        },
        { status: 422 }
      );
    }

    const { data: credito, error: creditoError } = await supabaseAdmin
      .from("ia_creditos_municipio")
      .select("municipio_id,saldo")
      .eq("municipio_id", usuario.municipio_id)
      .maybeSingle();

    if (creditoError) {
      console.error("Erro ao consultar créditos de IA:", {
        message: creditoError.message,
        details: creditoError.details,
        hint: creditoError.hint,
        code: creditoError.code,
        municipio_id: usuario.municipio_id,
      });

      return NextResponse.json(
        {
          erro: "Erro ao consultar os créditos de IA.",
          detalhes: creditoError.message,
          codigo: creditoError.code,
        },
        { status: 500 }
      );
    }

    if (!credito) {
      const { data: novoCredito, error: criarError } = await supabaseAdmin
        .from("ia_creditos_municipio")
        .insert({
          municipio_id: usuario.municipio_id,
          saldo: 0,
        })
        .select("municipio_id,saldo")
        .single();

      if (criarError) {
        console.error("Erro ao criar saldo inicial de IA:", {
          message: criarError.message,
          details: criarError.details,
          hint: criarError.hint,
          code: criarError.code,
        });

        return NextResponse.json(
          {
            erro: "Erro ao criar o saldo inicial de IA.",
            detalhes: criarError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          saldo: Number(novoCredito.saldo || 0),
          municipio_id: novoCredito.municipio_id,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        }
      );
    }

    return NextResponse.json(
      {
        saldo: Number(credito.saldo || 0),
        municipio_id: credito.municipio_id,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("Erro inesperado em /api/ia-creditos:", error);

    return NextResponse.json(
      {
        erro: "Erro interno ao consultar créditos de IA.",
        detalhes:
          error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
}