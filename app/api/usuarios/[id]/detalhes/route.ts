import { NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

type Perfil = (typeof PERFIS)[number];

type UsuarioBanco = {
  id: number;
  auth_id: string | null;
  nome: string;
  matricula: string | null;
  telefone: string | null;
  email: string | null;
  cpf: string | null;
  cargo: string | null;
  perfil: string | null;
  status: string | null;
  observacao: string | null;
  municipio_id: number | null;
  foto_url: string | null;
  ultimo_login: string | null;
  ultimo_ip: string | null;
  ultimo_dispositivo: string | null;
  ultimo_navegador: string | null;
  tentativas_login: number | null;
};

type MunicipioBanco = {
  id: number;
  nome: string;
  estado: string;
};

type LogBanco = {
  id: number;
  acao: string | null;
  status: string | null;
  ip: string | null;
  navegador: string | null;
  dispositivo: string | null;
  criado_em: string | null;
};

const PERFIS_GESTORES: Perfil[] = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
];

const NIVEL_PERFIL: Record<Perfil, number> = {
  DESENVOLVEDOR: 100,
  ADMIN: 90,
  COMANDANTE: 80,
  DIRETOR: 70,
  CMT_GUARNICAO: 60,
  PLANTONISTA: 50,
  GUARDA: 40,
  CONSULTA: 10,
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

function mascararCpf(valor: string | null) {
  const numeros = String(valor || "").replace(/\D/g, "");

  if (numeros.length !== 11) return null;

  return `***.***.***-${numeros.slice(-2)}`;
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

export async function GET(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
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

    const { id } = await context.params;
    const usuarioAlvoId = Number(id);

    if (
      !Number.isSafeInteger(usuarioAlvoId) ||
      usuarioAlvoId <= 0
    ) {
      return responder(
        {
          ok: false,
          erro: "Identificador do usuário inválido.",
        },
        400
      );
    }

    const [atorResposta, alvoResposta] = await Promise.all([
      supabaseAdmin
        .from("usuarios")
        .select(
          "id,auth_id,nome,matricula,telefone,email,cpf,cargo,perfil,status,observacao,municipio_id,foto_url,ultimo_login,ultimo_ip,ultimo_dispositivo,ultimo_navegador,tentativas_login"
        )
        .eq("auth_id", authUser.id)
        .maybeSingle(),

      supabaseAdmin
        .from("usuarios")
        .select(
          "id,auth_id,nome,matricula,telefone,email,cpf,cargo,perfil,status,observacao,municipio_id,foto_url,ultimo_login,ultimo_ip,ultimo_dispositivo,ultimo_navegador,tentativas_login"
        )
        .eq("id", usuarioAlvoId)
        .maybeSingle(),
    ]);

    if (atorResposta.error || !atorResposta.data) {
      return responder(
        {
          ok: false,
          erro: "Usuário responsável não foi localizado.",
        },
        403
      );
    }

    if (alvoResposta.error || !alvoResposta.data) {
      return responder(
        {
          ok: false,
          erro: "Usuário não encontrado.",
        },
        404
      );
    }

    const ator = atorResposta.data as UsuarioBanco;
    const alvo = alvoResposta.data as UsuarioBanco;
    const perfilAtor = normalizarPerfil(ator.perfil);
    const perfilAlvo =
      normalizarPerfil(alvo.perfil) || "CONSULTA";

    if (
      String(ator.status || "").toUpperCase() !== "ATIVO" ||
      !perfilAtor ||
      !PERFIS_GESTORES.includes(perfilAtor)
    ) {
      return responder(
        {
          ok: false,
          erro: "Usuário sem permissão para visualizar acessos.",
        },
        403
      );
    }

    if (
      perfilAtor !== "DESENVOLVEDOR" &&
      (
        !ator.municipio_id ||
        ator.municipio_id !== alvo.municipio_id
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido visualizar usuário de outro município.",
        },
        403
      );
    }

    const podeVerSeguranca =
      ator.id === alvo.id ||
      perfilAtor === "DESENVOLVEDOR" ||
      NIVEL_PERFIL[perfilAtor] > NIVEL_PERFIL[perfilAlvo];

    const podeEditar =
      ator.id !== alvo.id &&
      (
        perfilAtor === "DESENVOLVEDOR" ||
        (
          ator.municipio_id === alvo.municipio_id &&
          NIVEL_PERFIL[perfilAtor] > NIVEL_PERFIL[perfilAlvo]
        )
      );

    let municipio: MunicipioBanco | null = null;

    if (alvo.municipio_id) {
      const { data, error } = await supabaseAdmin
        .from("municipios")
        .select("id,nome,estado")
        .eq("id", alvo.municipio_id)
        .maybeSingle();

      if (error) {
        return responder(
          {
            ok: false,
            erro: "Não foi possível carregar o município.",
          },
          500
        );
      }

      municipio = (data as MunicipioBanco | null) || null;
    }

    let logs: LogBanco[] = [];

    if (podeVerSeguranca) {
      const { data, error } = await supabaseAdmin
        .from("logs_acesso")
        .select(
          "id,acao,status,ip,navegador,dispositivo,criado_em"
        )
        .eq("usuario_id", alvo.id)
        .order("criado_em", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Erro ao carregar logs do usuário:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        return responder(
          {
            ok: false,
            erro: "Não foi possível carregar o histórico de acessos.",
          },
          500
        );
      }

      logs = (data || []) as LogBanco[];
    }

    const dispositivo = obterDispositivo(request);

    const { error: logVisualizacaoError } = await supabaseAdmin
      .from("logs_acesso")
      .insert({
        usuario_id: ator.id,
        municipio_id: ator.municipio_id || alvo.municipio_id,
        email: authUser.email || ator.email || "",
        ip: obterIp(request),
        dispositivo,
        navegador: identificarNavegador(dispositivo),
        acao: "USUARIO_VISUALIZAR",
        status: "SUCESSO",
      });

    if (logVisualizacaoError) {
      console.warn("Visualização concluída, mas o log falhou:", {
        message: logVisualizacaoError.message,
      });
    }

    return responder(
      {
        ok: true,
        usuario: {
          id: alvo.id,
          nome: alvo.nome,
          email: alvo.email,
          matricula: alvo.matricula,
          telefone: alvo.telefone,
          cpf: podeVerSeguranca
            ? alvo.cpf
            : mascararCpf(alvo.cpf),
          cargo: alvo.cargo,
          perfil: perfilAlvo,
          status: String(alvo.status || "").toUpperCase(),
          observacao: alvo.observacao,
          municipio_id: alvo.municipio_id,
          municipio_nome: municipio?.nome || null,
          municipio_estado: municipio?.estado || null,
          foto_url: alvo.foto_url,
          ultimo_login: podeVerSeguranca
            ? alvo.ultimo_login
            : null,
          ultimo_ip: podeVerSeguranca
            ? alvo.ultimo_ip
            : null,
          ultimo_dispositivo: podeVerSeguranca
            ? alvo.ultimo_dispositivo
            : null,
          ultimo_navegador: podeVerSeguranca
            ? alvo.ultimo_navegador
            : null,
          tentativas_login: podeVerSeguranca
            ? alvo.tentativas_login || 0
            : 0,
        },
        logs,
        pode_editar: podeEditar,
        pode_ver_seguranca: podeVerSeguranca,
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado nos detalhes do usuário:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao carregar os detalhes do usuário.",
      },
      500
    );
  }
}
