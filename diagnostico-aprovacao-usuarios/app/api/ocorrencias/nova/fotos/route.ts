import {
  NextRequest,
  NextResponse,
} from "next/server";

import { randomUUID } from "node:crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "fotos-ocorrencias";
const LIMITE_ARQUIVOS = 10;
const LIMITE_BYTES = 5 * 1024 * 1024;

const TIPOS_PERMITIDOS = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

type UsuarioSistema = {
  id: number;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type PermissaoOcorrencias = {
  pode_criar: boolean;
};

type ArquivoRecebido = {
  nome?: unknown;
  tamanho?: unknown;
  tipo?: unknown;
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
  limite = 300
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
}

function nomeSeguro(valor: unknown) {
  const nome = texto(valor, 180)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return nome || "imagem";
}

async function autenticar(
  request: NextRequest,
  corpo: Record<string, unknown>
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
      "id,perfil,status,municipio_id"
    )
    .eq("auth_id", authUser.id)
    .maybeSingle<UsuarioSistema>();

  if (usuarioError) {
    console.error(
      "Erro ao validar usuário para upload de fotos:",
      {
        message: usuarioError.message,
        details: usuarioError.details,
        hint: usuarioError.hint,
        code: usuarioError.code,
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
    const municipioInformado = Number(
      corpo.municipio_id || 0
    );

    if (
      Number.isSafeInteger(
        municipioInformado
      ) &&
      municipioInformado > 0
    ) {
      const {
        data: municipio,
        error: municipioError,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", municipioInformado)
        .maybeSingle();

      if (municipioError) {
        console.error(
          "Erro ao validar município do upload:",
          municipioError
        );
      }

      if (municipio) {
        municipioId = municipioInformado;
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
      error: permissaoError,
    } = await supabaseAdmin
      .from("permissoes_perfis")
      .select("pode_criar")
      .eq("municipio_id", municipioId)
      .eq("perfil", perfil)
      .eq("modulo", "ocorrencias")
      .maybeSingle<PermissaoOcorrencias>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissão para upload de fotos:",
        {
          message: permissaoError.message,
          details: permissaoError.details,
          hint: permissaoError.hint,
          code: permissaoError.code,
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

    if (!permissao?.pode_criar) {
      return {
        ok: false as const,
        resposta: responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para enviar fotos de ocorrências.",
          },
          403
        ),
      };
    }
  }

  return {
    ok: true as const,
    usuarioId: usuario.id,
    municipioId,
  };
}

export async function POST(
  request: NextRequest
) {
  try {
    const corpo = await request
      .json()
      .catch(() => null);

    if (
      !corpo ||
      typeof corpo !== "object" ||
      Array.isArray(corpo)
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Dados do upload não informados.",
        },
        400
      );
    }

    const autenticacao =
      await autenticar(
        request,
        corpo as Record<string, unknown>
      );

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const arquivos = Array.isArray(
      (corpo as Record<string, unknown>)
        .arquivos
    )
      ? (
          (corpo as Record<string, unknown>)
            .arquivos as ArquivoRecebido[]
        )
      : [];

    if (
      arquivos.length === 0 ||
      arquivos.length > LIMITE_ARQUIVOS
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Envie entre 1 e 10 imagens.",
        },
        400
      );
    }

    const preparados: Array<{
      indice: number;
      nome_original: string;
      tipo: string;
      tamanho: number;
      extensao: string;
    }> = [];

    for (
      let indice = 0;
      indice < arquivos.length;
      indice++
    ) {
      const arquivo =
        arquivos[indice];

      const nomeOriginal =
        nomeSeguro(arquivo.nome);

      const tipo = texto(
        arquivo.tipo,
        100
      ).toLowerCase();

      const tamanho = Number(
        arquivo.tamanho
      );

      const extensao =
        TIPOS_PERMITIDOS.get(tipo);

      if (!extensao) {
        return responder(
          {
            ok: false,
            erro:
              `A imagem "${nomeOriginal}" possui formato não permitido. Use JPG, PNG ou WEBP.`,
          },
          400
        );
      }

      if (
        !Number.isFinite(tamanho) ||
        tamanho <= 0 ||
        tamanho > LIMITE_BYTES
      ) {
        return responder(
          {
            ok: false,
            erro:
              `A imagem "${nomeOriginal}" deve ter no máximo 5MB.`,
          },
          400
        );
      }

      preparados.push({
        indice,
        nome_original:
          nomeOriginal,
        tipo,
        tamanho,
        extensao,
      });
    }

    const uploads = [];

    for (const arquivo of preparados) {
      const caminho =
        `${autenticacao.municipioId}/temporarios/` +
        `${Date.now()}-${randomUUID()}.${arquivo.extensao}`;

      const {
        data,
        error,
      } = await supabaseAdmin.storage
        .from(BUCKET)
        .createSignedUploadUrl(
          caminho,
          {
            upsert: false,
          }
        );

      if (
        error ||
        !data?.token
      ) {
        console.error(
          "Erro ao gerar URL assinada para foto da ocorrência:",
          {
            message: error?.message,
            caminho,
            municipio_id:
              autenticacao.municipioId,
            usuario_id:
              autenticacao.usuarioId,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível preparar o envio das fotos.",
          },
          500
        );
      }

      const { data: publicData } =
        supabaseAdmin.storage
          .from(BUCKET)
          .getPublicUrl(caminho);

      uploads.push({
        indice: arquivo.indice,
        nome_original:
          arquivo.nome_original,
        path: caminho,
        token: data.token,
        public_url:
          publicData.publicUrl,
        content_type:
          arquivo.tipo,
        tamanho:
          arquivo.tamanho,
      });
    }

    return responder(
      {
        ok: true,
        bucket: BUCKET,
        uploads,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no POST /api/ocorrencias/nova/fotos:",
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
          "Erro interno ao preparar o envio das fotos.",
      },
      500
    );
  }
}