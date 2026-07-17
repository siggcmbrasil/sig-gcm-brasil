import {
  NextRequest,
  NextResponse,
} from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioSistema = {
  id: number;
  nome: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type Permissoes = {
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type AutenticacaoSucesso = {
  ok: true;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  permissoes: Permissoes;
};

type AutenticacaoFalha = {
  ok: false;
  resposta: NextResponse;
};

type PontoRonda = {
  id: number;
  municipio_id: number;
  plano_id: number | null;
  latitude: number | string | null;
  longitude: number | string | null;
  nome_local: string | null;
  ordem: number | null;
  obrigatorio: boolean | null;
};

const RAIO_PERMITIDO_METROS = 200;
const PRECISAO_MAXIMA_METROS = 200;
const TAMANHO_MAXIMO_FOTO = 5 * 1024 * 1024;
const BUCKET_FOTOS_RONDA = "documentos-guardas";
const OFFSET_OPERACIONAL_MINUTOS = -180;

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

function texto(
  valor: unknown,
  limite = 1000
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
}

function normalizar(valor: unknown) {
  return texto(valor, 100)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function numeroId(valor: unknown) {
  const numero = Number(valor);

  if (
    !Number.isSafeInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function numeroFinito(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : null;
}

function obterToken(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  return (
    authorization.slice(7).trim() ||
    null
  );
}

function obterIp(
  request: NextRequest
) {
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
    request.headers.get("user-agent") ||
    "Não identificado"
  ).slice(0, 500);
}

function calcularDistanciaMetros(
  latitudeAtual: number,
  longitudeAtual: number,
  latitudePonto: number,
  longitudePonto: number
) {
  const raioTerra = 6371000;

  const deltaLatitude =
    ((latitudePonto - latitudeAtual) *
      Math.PI) /
    180;

  const deltaLongitude =
    ((longitudePonto - longitudeAtual) *
      Math.PI) /
    180;

  const calculo =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(
      (latitudeAtual * Math.PI) /
        180
    ) *
      Math.cos(
        (latitudePonto * Math.PI) /
          180
      ) *
      Math.sin(deltaLongitude / 2) **
        2;

  return (
    raioTerra *
    (2 *
      Math.atan2(
        Math.sqrt(calculo),
        Math.sqrt(1 - calculo)
      ))
  );
}

function obterIntervaloDiaOperacional() {
  const agora = new Date();

  const horarioLocal = new Date(
    agora.getTime() +
      OFFSET_OPERACIONAL_MINUTOS *
        60 *
        1000
  );

  const ano =
    horarioLocal.getUTCFullYear();

  const mes =
    horarioLocal.getUTCMonth();

  const dia =
    horarioLocal.getUTCDate();

  const inicioUtc = new Date(
    Date.UTC(
      ano,
      mes,
      dia,
      0,
      0,
      0,
      0
    ) -
      OFFSET_OPERACIONAL_MINUTOS *
        60 *
        1000
  );

  const fimUtc = new Date(
    Date.UTC(
      ano,
      mes,
      dia + 1,
      0,
      0,
      0,
      0
    ) -
      OFFSET_OPERACIONAL_MINUTOS *
        60 *
        1000
  );

  return {
    inicio: inicioUtc.toISOString(),
    fim: fimUtc.toISOString(),
  };
}

function extensaoPorMime(
  mime: string
) {
  const extensoes:
    Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

  return extensoes[mime] || null;
}

function assinaturaImagemValida(
  buffer: Uint8Array,
  mime: string
) {
  if (
    mime === "image/jpeg"
  ) {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (
    mime === "image/png"
  ) {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (
    mime === "image/webp"
  ) {
    return (
      buffer.length >= 12 &&
      String.fromCharCode(
        ...buffer.slice(0, 4)
      ) === "RIFF" &&
      String.fromCharCode(
        ...buffer.slice(8, 12)
      ) === "WEBP"
    );
  }

  return false;
}

async function resolverMunicipio({
  request,
  usuario,
  perfil,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
}) {
  let municipioId = Number(
    usuario.municipio_id || 0
  );

  if (
    perfil === "DESENVOLVEDOR"
  ) {
    const parametro =
      numeroId(
        request.nextUrl.searchParams.get(
          "municipio_id"
        )
      );

    if (parametro) {
      const {
        data: municipio,
        error,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", parametro)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao validar município do check-in:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );
      }

      if (municipio) {
        municipioId = parametro;
      }
    }

    if (!municipioId) {
      const {
        data: primeiroMunicipio,
        error,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .order("id", {
          ascending: true,
        })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao localizar município padrão do check-in:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );
      }

      municipioId = Number(
        primeiroMunicipio?.id || 0
      );
    }
  }

  return municipioId;
}

async function autenticar(
  request: NextRequest
): Promise<
  AutenticacaoSucesso |
  AutenticacaoFalha
> {
  const accessToken =
    obterToken(request);

  if (!accessToken) {
    return {
      ok: false,
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
  } =
    await supabaseAdmin.auth.getUser(
      accessToken
    );

  if (
    authError ||
    !authUser
  ) {
    return {
      ok: false,
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
        nome,
        email,
        perfil,
        status,
        municipio_id
      `
    )
    .eq(
      "auth_id",
      authUser.id
    )
    .maybeSingle<UsuarioSistema>();

  if (usuarioError) {
    console.error(
      "Erro ao validar usuário do check-in:",
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
      ok: false,
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
      ok: false,
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

  const perfil =
    normalizar(
      usuario.perfil
    );

  if (
    normalizar(
      usuario.status
    ) !== "ATIVO"
  ) {
    return {
      ok: false,
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

  const municipioId =
    await resolverMunicipio({
      request,
      usuario,
      perfil,
    });

  if (!municipioId) {
    return {
      ok: false,
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

  let permissoes: Permissoes = {
    pode_ver: true,
    pode_criar: true,
    pode_editar: true,
    pode_excluir: true,
  };

  if (
    perfil !== "DESENVOLVEDOR"
  ) {
    const {
      data: permissao,
      error: permissaoError,
    } = await supabaseAdmin
      .from(
        "permissoes_perfis"
      )
      .select(
        `
          pode_ver,
          pode_criar,
          pode_editar,
          pode_excluir
        `
      )
      .eq(
        "municipio_id",
        municipioId
      )
      .eq("perfil", perfil)
      .eq(
        "modulo",
        "patrulhamento"
      )
      .maybeSingle<Permissoes>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissões do check-in:",
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
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Não foi possível validar as permissões.",
          },
          500
        ),
      };
    }

    permissoes =
      permissao || {
        pode_ver: false,
        pode_criar: false,
        pode_editar: false,
        pode_excluir: false,
      };
  }

  return {
    ok: true,
    usuario,
    perfil,
    municipioId,
    permissoes,
  };
}

async function buscarPonto({
  pontoId,
  municipioId,
}: {
  pontoId: number;
  municipioId: number;
}) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("pontos_ronda")
    .select(
      `
        id,
        municipio_id,
        plano_id,
        latitude,
        longitude,
        nome_local,
        ordem,
        obrigatorio
      `
    )
    .eq("id", pontoId)
    .eq(
      "municipio_id",
      municipioId
    )
    .maybeSingle<PontoRonda>();

  if (error) {
    throw error;
  }

  return data;
}

async function buscarCheckinHoje({
  municipioId,
  pontoId,
  usuarioId,
}: {
  municipioId: number;
  pontoId: number;
  usuarioId: number;
}) {
  const intervalo =
    obterIntervaloDiaOperacional();

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("checkins_ronda")
    .select(
      `
        id,
        criado_em
      `
    )
    .eq(
      "municipio_id",
      municipioId
    )
    .eq("ponto_id", pontoId)
    .eq(
      "usuario_id",
      usuarioId
    )
    .gte(
      "criado_em",
      intervalo.inicio
    )
    .lt(
      "criado_em",
      intervalo.fim
    )
    .order("criado_em", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function auditar({
  request,
  autenticacao,
  acao,
  descricao,
  status,
  registroId,
  detalhes,
}: {
  request: NextRequest;
  autenticacao: AutenticacaoSucesso;
  acao: string;
  descricao: string;
  status:
    | "SUCESSO"
    | "BLOQUEADO"
    | "ERRO";
  registroId?: number | null;
  detalhes?: Record<string, unknown>;
}) {
  const { error } =
    await supabaseAdmin
      .from("auditoria")
      .insert({
        municipio_id:
          autenticacao.municipioId,
        guarda_id:
          autenticacao.usuario.id,
        usuario_nome:
          autenticacao.usuario.nome ||
          "Usuário",
        usuario_email:
          autenticacao.usuario.email ||
          "",
        perfil:
          autenticacao.perfil,
        modulo:
          "Patrulhamento",
        acao,
        descricao,
        status,
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(request),
        tabela:
          "checkins_ronda",
        registro_id:
          registroId
            ? String(registroId)
            : null,
        detalhes:
          detalhes || {},
      });

  if (error) {
    console.error(
      "Erro ao auditar check-in de visita:",
      {
        message:
          error.message,
        details:
          error.details,
        hint:
          error.hint,
        code:
          error.code,
        registro_id:
          registroId || null,
      }
    );
  }
}

async function enviarFoto({
  arquivo,
  municipioId,
  pontoId,
}: {
  arquivo: File;
  municipioId: number;
  pontoId: number;
}) {
  if (
    arquivo.size <= 0
  ) {
    throw new Error(
      "A foto está vazia."
    );
  }

  if (
    arquivo.size >
    TAMANHO_MAXIMO_FOTO
  ) {
    throw new Error(
      "A foto deve ter no máximo 5 MB."
    );
  }

  const extensao =
    extensaoPorMime(
      arquivo.type
    );

  if (!extensao) {
    throw new Error(
      "Formato de foto não permitido. Use JPG, PNG ou WEBP."
    );
  }

  const arrayBuffer =
    await arquivo.arrayBuffer();

  const bytes =
    new Uint8Array(
      arrayBuffer
    );

  if (
    !assinaturaImagemValida(
      bytes,
      arquivo.type
    )
  ) {
    throw new Error(
      "O conteúdo do arquivo não corresponde a uma imagem válida."
    );
  }

  const caminho =
    `municipios/${municipioId}/patrulhamento/visitas/checkins/${pontoId}/${crypto.randomUUID()}.${extensao}`;

  const {
    error: uploadError,
  } = await supabaseAdmin.storage
    .from(
      BUCKET_FOTOS_RONDA
    )
    .upload(
      caminho,
      arrayBuffer,
      {
        contentType:
          arquivo.type,
        cacheControl: "3600",
        upsert: false,
      }
    );

  if (uploadError) {
    console.error(
      "Erro no upload da foto do check-in:",
      {
        message:
          uploadError.message,
        ponto_id: pontoId,
        municipio_id:
          municipioId,
      }
    );

    throw new Error(
      "Não foi possível enviar a foto."
    );
  }

  const { data } =
    supabaseAdmin.storage
      .from(
        BUCKET_FOTOS_RONDA
      )
      .getPublicUrl(caminho);

  return {
    caminho,
    url:
      data.publicUrl || null,
  };
}

async function removerFoto(
  caminho: string | null
) {
  if (!caminho) {
    return;
  }

  const { error } =
    await supabaseAdmin.storage
      .from(
        BUCKET_FOTOS_RONDA
      )
      .remove([caminho]);

  if (error) {
    console.error(
      "Erro ao remover foto após falha no check-in:",
      {
        message:
          error.message,
        caminho,
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

    if (
      !autenticacao.permissoes
        .pode_ver
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para visualizar este ponto de visita.",
        },
        403
      );
    }

    const pontoId =
      numeroId(
        request.nextUrl.searchParams.get(
          "ponto"
        )
      );

    if (!pontoId) {
      return responder(
        {
          ok: false,
          erro:
            "Identificador do ponto de visita inválido.",
        },
        400
      );
    }

    const ponto =
      await buscarPonto({
        pontoId,
        municipioId:
          autenticacao.municipioId,
      });

    if (!ponto) {
      return responder(
        {
          ok: false,
          erro:
            "Ponto de visita não encontrado neste município.",
        },
        404
      );
    }

    const checkinHoje =
      await buscarCheckinHoje({
        municipioId:
          autenticacao.municipioId,
        pontoId,
        usuarioId:
          autenticacao.usuario.id,
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
        permissoes:
          autenticacao.permissoes,
        ponto,
        raio_permitido_metros:
          RAIO_PERMITIDO_METROS,
        precisao_maxima_metros:
          PRECISAO_MAXIMA_METROS,
        checkin_realizado_hoje:
          Boolean(checkinHoje),
        ultimo_checkin_hoje:
          checkinHoje || null,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/patrulhamento/visitas/checkin:",
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
          "Erro interno ao carregar o ponto de visita.",
      },
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  let caminhoFoto:
    string | null = null;

  try {
    const autenticacao =
      await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    if (
      !autenticacao.permissoes
        .pode_criar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para registrar check-ins de visita.",
        },
        403
      );
    }

    const formData =
      await request.formData();

    const pontoId =
      numeroId(
        formData.get("ponto_id")
      );

    const latitude =
      numeroFinito(
        formData.get("latitude")
      );

    const longitude =
      numeroFinito(
        formData.get("longitude")
      );

    const precisao =
      numeroFinito(
        formData.get("precisao")
      );

    const observacao =
      texto(
        formData.get("observacao"),
        1000
      ) ||
      "Check-in via QR Code";

    const arquivo =
      formData.get("foto");

    if (!pontoId) {
      return responder(
        {
          ok: false,
          erro:
            "Identificador do ponto de visita inválido.",
        },
        400
      );
    }

    if (
      latitude === null ||
      latitude < -90 ||
      latitude > 90
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Latitude atual inválida.",
        },
        400
      );
    }

    if (
      longitude === null ||
      longitude < -180 ||
      longitude > 180
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Longitude atual inválida.",
        },
        400
      );
    }

    if (
      precisao === null ||
      precisao <= 0 ||
      precisao >
        PRECISAO_MAXIMA_METROS
    ) {
      await auditar({
        request,
        autenticacao,
        acao:
          "CHECKIN_VISITA_BLOQUEADO",
        descricao:
          "Check-in bloqueado por baixa precisão do GPS.",
        status: "BLOQUEADO",
        detalhes: {
          ponto_id: pontoId,
          latitude,
          longitude,
          precisao,
          precisao_maxima_metros:
            PRECISAO_MAXIMA_METROS,
        },
      });

      return responder(
        {
          ok: false,
          erro:
            `Precisão do GPS insuficiente. Aguarde o aparelho atingir precisão de até ${PRECISAO_MAXIMA_METROS} metros.`,
          precisao,
          precisao_maxima_metros:
            PRECISAO_MAXIMA_METROS,
        },
        422
      );
    }

    const ponto =
      await buscarPonto({
        pontoId,
        municipioId:
          autenticacao.municipioId,
      });

    if (!ponto) {
      return responder(
        {
          ok: false,
          erro:
            "Ponto de visita não encontrado neste município.",
        },
        404
      );
    }

    const latitudePonto =
      numeroFinito(
        ponto.latitude
      );

    const longitudePonto =
      numeroFinito(
        ponto.longitude
      );

    if (
      latitudePonto === null ||
      longitudePonto === null
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Este ponto não possui coordenadas válidas.",
        },
        422
      );
    }

    const distancia =
      calcularDistanciaMetros(
        latitude,
        longitude,
        latitudePonto,
        longitudePonto
      );

    const distanciaArredondada =
      Math.round(distancia);

    if (
      distancia >
      RAIO_PERMITIDO_METROS
    ) {
      await auditar({
        request,
        autenticacao,
        acao:
          "CHECKIN_VISITA_BLOQUEADO",
        descricao:
          "Check-in bloqueado por distância.",
        status: "BLOQUEADO",
        detalhes: {
          ponto_id: pontoId,
          plano_id:
            ponto.plano_id,
          ponto_nome:
            ponto.nome_local,
          distancia_metros:
            distanciaArredondada,
          raio_permitido_metros:
            RAIO_PERMITIDO_METROS,
          latitude,
          longitude,
          precisao,
        },
      });

      return responder(
        {
          ok: false,
          erro:
            `Check-in bloqueado. Você está a ${distanciaArredondada} metros do ponto. Aproxime-se até ${RAIO_PERMITIDO_METROS} metros.`,
          distancia_metros:
            distanciaArredondada,
          raio_permitido_metros:
            RAIO_PERMITIDO_METROS,
        },
        422
      );
    }

    const checkinExistente =
      await buscarCheckinHoje({
        municipioId:
          autenticacao.municipioId,
        pontoId,
        usuarioId:
          autenticacao.usuario.id,
      });

    if (checkinExistente) {
      await auditar({
        request,
        autenticacao,
        acao:
          "CHECKIN_VISITA_DUPLICADO",
        descricao:
          "Check-in duplicado bloqueado.",
        status: "BLOQUEADO",
        registroId:
          Number(
            checkinExistente.id
          ),
        detalhes: {
          ponto_id: pontoId,
          plano_id:
            ponto.plano_id,
          ponto_nome:
            ponto.nome_local,
          checkin_existente:
            checkinExistente,
        },
      });

      return responder(
        {
          ok: false,
          erro:
            "Você já realizou check-in neste ponto hoje.",
          checkin_existente:
            checkinExistente,
        },
        409
      );
    }

    if (
      arquivo instanceof File &&
      arquivo.size > 0
    ) {
      const resultadoFoto =
        await enviarFoto({
          arquivo,
          municipioId:
            autenticacao.municipioId,
          pontoId,
        });

      caminhoFoto =
        resultadoFoto.caminho;

      var fotoUrl =
        resultadoFoto.url;
    } else {
      var fotoUrl:
        string | null = null;
    }

    const {
      data: checkin,
      error: insertError,
    } = await supabaseAdmin
      .from("checkins_ronda")
      .insert({
        municipio_id:
          autenticacao.municipioId,
        ponto_id: pontoId,
        plano_id:
          ponto.plano_id,
        usuario_id:
          autenticacao.usuario.id,
        nome:
          autenticacao.usuario.nome ||
          "Usuário não identificado",
        latitude,
        longitude,
        precisao,
        distancia_metros:
          distanciaArredondada,
        observacao,
        foto_url:
          fotoUrl,
        criado_em:
          new Date().toISOString(),
      })
      .select(
        `
          id,
          criado_em
        `
      )
      .single();

    if (insertError) {
      await removerFoto(
        caminhoFoto
      );

      await auditar({
        request,
        autenticacao,
        acao:
          "CHECKIN_VISITA_ERRO",
        descricao:
          "Erro ao registrar check-in de visita.",
        status: "ERRO",
        detalhes: {
          erro:
            insertError.message,
          codigo:
            insertError.code,
          ponto_id: pontoId,
          plano_id:
            ponto.plano_id,
        },
      });

      console.error(
        "Erro ao inserir check-in de visita:",
        {
          message:
            insertError.message,
          details:
            insertError.details,
          hint:
            insertError.hint,
          code:
            insertError.code,
          ponto_id: pontoId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível registrar o check-in.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao:
        "CHECKIN_VISITA",
      descricao:
        `Realizou check-in no ponto ${ponto.nome_local || ponto.id}.`,
      status: "SUCESSO",
      registroId:
        Number(checkin.id),
      detalhes: {
        ponto_id: pontoId,
        plano_id:
          ponto.plano_id,
        ponto_nome:
          ponto.nome_local,
        distancia_metros:
          distanciaArredondada,
        raio_permitido_metros:
          RAIO_PERMITIDO_METROS,
        latitude,
        longitude,
        precisao,
        foto_url:
          fotoUrl,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Check-in registrado com sucesso.",
        checkin: {
          id:
            checkin.id,
          criado_em:
            checkin.criado_em,
          ponto_id:
            pontoId,
          ponto_nome:
            ponto.nome_local,
          distancia_metros:
            distanciaArredondada,
          foto_url:
            fotoUrl,
        },
      },
      201
    );
  } catch (error) {
    await removerFoto(
      caminhoFoto
    );

    console.error(
      "Erro inesperado no POST /api/patrulhamento/visitas/checkin:",
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
          error instanceof Error
            ? error.message
            : "Erro interno ao registrar o check-in.",
      },
      500
    );
  }
}