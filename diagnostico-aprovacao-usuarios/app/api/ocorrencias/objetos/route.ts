import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioSistema = {
  id: number;
  auth_id: string | null;
  nome: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type PermissaoOcorrencias = {
  pode_ver: boolean;
};

type OcorrenciaComObjetos = {
  id: number;
  protocolo: string | null;
  data: string | null;
  tipo: string | null;
  armas_objetos: unknown;
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

function texto(
  valor: unknown,
  limite = 500
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
}

function obterIp(request: NextRequest) {
  const valor =
    request.headers.get(
      "x-vercel-forwarded-for"
    ) ||
    request.headers.get(
      "x-forwarded-for"
    ) ||
    request.headers.get(
      "x-real-ip"
    ) ||
    "Não identificado";

  return valor
    .split(",")[0]
    .trim()
    .slice(0, 64);
}

function obterDispositivo(
  request: NextRequest
) {
  return (
    request.headers.get(
      "user-agent"
    ) ||
    "Não identificado"
  ).slice(0, 500);
}

function converterObjetos(
  valor: unknown
): Record<string, unknown>[] {
  if (Array.isArray(valor)) {
    return valor.filter(
      (
        item
      ): item is Record<string, unknown> =>
        Boolean(item) &&
        typeof item === "object" &&
        !Array.isArray(item)
    );
  }

  if (typeof valor !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(valor);

    return Array.isArray(parsed)
      ? parsed.filter(
          (
            item
          ): item is Record<
            string,
            unknown
          > =>
            Boolean(item) &&
            typeof item === "object" &&
            !Array.isArray(item)
        )
      : [];
  } catch {
    return [];
  }
}

async function autenticar(
  request: NextRequest
) {
  const accessToken = obterToken(request);

  if (!accessToken) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Token de autenticação não informado.",
        },
        401
      ),
    };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseAdmin.auth.getUser(
    accessToken
  );

  if (authError || !authUser) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Sessão inválida ou expirada.",
        },
        401
      ),
    };
  }

  const {
    data: usuario,
    error: usuarioError,
  } = await supabaseAdmin
    .from("usuarios")
    .select(
      `
        id,
        auth_id,
        nome,
        email,
        perfil,
        status,
        municipio_id
      `
    )
    .eq("auth_id", authUser.id)
    .maybeSingle<UsuarioSistema>();

  if (usuarioError) {
    console.error(
      "Erro ao validar usuário dos objetos apreendidos:",
      {
        message:
          usuarioError.message,
        details:
          usuarioError.details,
        hint:
          usuarioError.hint,
        code:
          usuarioError.code,
      }
    );

    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Não foi possível validar o usuário.",
        },
        500
      ),
    };
  }

  if (!usuario) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Usuário não cadastrado no sistema.",
        },
        404
      ),
    };
  }

  const perfil = texto(
    usuario.perfil,
    50
  ).toUpperCase();

  const status = texto(
    usuario.status,
    30
  ).toUpperCase();

  if (status !== "ATIVO") {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Usuário sem acesso ativo.",
        },
        403
      ),
    };
  }

  let municipioId = Number(
    usuario.municipio_id || 0
  );

  if (perfil === "DESENVOLVEDOR") {
    const municipioParametro =
      Number(
        request.nextUrl
          .searchParams
          .get("municipio_id")
      );

    if (
      Number.isSafeInteger(
        municipioParametro
      ) &&
      municipioParametro > 0
    ) {
      const {
        data: municipio,
        error:
          municipioError,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq(
          "id",
          municipioParametro
        )
        .maybeSingle();

      if (municipioError) {
        console.error(
          "Erro ao validar município dos objetos apreendidos:",
          municipioError
        );
      }

      if (municipio) {
        municipioId =
          municipioParametro;
      }
    }
  }

  if (!municipioId) {
    return {
      ok: false as const,
      resposta: responder(
        {
          ok: false,
          erro:
            "Município não identificado.",
        },
        422
      ),
    };
  }

  if (perfil !== "DESENVOLVEDOR") {
    const {
      data: permissao,
      error:
        permissaoError,
    } = await supabaseAdmin
      .from(
        "permissoes_perfis"
      )
      .select("pode_ver")
      .eq(
        "municipio_id",
        municipioId
      )
      .eq("perfil", perfil)
      .eq(
        "modulo",
        "ocorrencias"
      )
      .maybeSingle<PermissaoOcorrencias>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissão dos objetos apreendidos:",
        {
          message:
            permissaoError.message,
          details:
            permissaoError.details,
          hint:
            permissaoError.hint,
          code:
            permissaoError.code,
        }
      );

      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Não foi possível validar a permissão.",
          },
          500
        ),
      };
    }

    if (!permissao?.pode_ver) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para consultar objetos apreendidos.",
          },
          403
        ),
      };
    }
  }

  return {
    ok: true as const,
    usuario,
    perfil,
    municipioId,
    authEmail:
      authUser.email ||
      usuario.email ||
      "",
  };
}

async function auditarConsulta({
  request,
  usuario,
  perfil,
  municipioId,
  email,
  total,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  email: string;
  total: number;
}) {
  const { error } =
    await supabaseAdmin
      .from("auditoria")
      .insert({
        municipio_id:
          municipioId,
        guarda_id:
          usuario.id,
        usuario_nome:
          usuario.nome ||
          "Usuário",
        usuario_email:
          email,
        perfil,
        modulo:
          "Ocorrências",
        acao:
          "VISUALIZAR_OBJETOS",
        descricao:
          "Consultou a relação de objetos apreendidos.",
        status:
          "SUCESSO",
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(
            request
          ),
        tabela:
          "ocorrencias",
        registro_id:
          null,
        detalhes: {
          total_objetos:
            total,
        },
      });

  if (error) {
    console.error(
      "Erro ao auditar consulta de objetos apreendidos:",
      {
        message:
          error.message,
        details:
          error.details,
        hint:
          error.hint,
        code:
          error.code,
      }
    );
  }
}

export async function GET(
  request: NextRequest
) {
  try {
    const autenticacao =
      await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("ocorrencias")
      .select(
        `
          id,
          protocolo,
          data,
          tipo,
          armas_objetos
        `
      )
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .not(
        "armas_objetos",
        "is",
        null
      )
      .order("data", {
        ascending: false,
      })
      .limit(100);

    if (error) {
      console.error(
        "Erro ao carregar objetos apreendidos:",
        {
          message:
            error.message,
          details:
            error.details,
          hint:
            error.hint,
          code:
            error.code,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível carregar os objetos apreendidos.",
        },
        500
      );
    }

    const objetos = (
      (data ||
        []) as OcorrenciaComObjetos[]
    ).flatMap(
      (ocorrencia) =>
        converterObjetos(
          ocorrencia.armas_objetos
        )
          .map(
            (
              objeto,
              indice
            ) => ({
              id:
                `${ocorrencia.id}-${indice}`,
              ocorrencia_id:
                ocorrencia.id,
              protocolo:
                ocorrencia.protocolo ||
                "",
              data:
                ocorrencia.data ||
                "",
              tipo_ocorrencia:
                ocorrencia.tipo ||
                "",
              categoria:
                texto(
                  objeto.categoria,
                  100
                ),
              subcategoria:
                texto(
                  objeto.subcategoria,
                  100
                ),
              descricao:
                texto(
                  objeto.descricao,
                  3000
                ),
              marca:
                texto(
                  objeto.marca,
                  100
                ),
              modelo:
                texto(
                  objeto.modelo,
                  100
                ),
              cor:
                texto(
                  objeto.cor,
                  50
                ),
              numeracao:
                texto(
                  objeto.numeracao,
                  100
                ),
              quantidade:
                texto(
                  objeto.quantidade,
                  30
                ),
              situacao:
                texto(
                  objeto.situacao,
                  100
                ),
              procedencia:
                texto(
                  objeto.procedencia,
                  100
                ),
              observacao:
                texto(
                  objeto.observacao,
                  3000
                ),
            })
          )
          .filter(
            (objeto) =>
              objeto.categoria ||
              objeto.descricao ||
              objeto.numeracao ||
              objeto.marca ||
              objeto.modelo
          )
    );

    await auditarConsulta({
      request,
      usuario:
        autenticacao.usuario,
      perfil:
        autenticacao.perfil,
      municipioId:
        autenticacao.municipioId,
      email:
        autenticacao.authEmail,
      total:
        objetos.length,
    });

    return responder(
      {
        ok: true,
        contexto: {
          usuario_id:
            autenticacao.usuario.id,
          usuario_nome:
            autenticacao.usuario.nome,
          perfil:
            autenticacao.perfil,
          municipio_id:
            autenticacao.municipioId,
        },
        objetos,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/ocorrencias/objetos:",
      {
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        error,
      }
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao carregar os objetos apreendidos.",
      },
      500
    );
  }
}