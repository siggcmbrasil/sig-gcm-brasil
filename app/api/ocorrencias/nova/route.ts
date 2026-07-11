import {
  NextRequest,
  NextResponse,
} from "next/server";

import { randomUUID } from "node:crypto";

import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_FOTOS = "fotos-ocorrencias";
const PREFIXO_PUBLICO =
  `/storage/v1/object/public/${BUCKET_FOTOS}/`;

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
  pode_criar: boolean;
};

type Envolvido = {
  nome?: unknown;
  tipo_documento?: unknown;
  documento?: unknown;
  telefone?: unknown;
  endereco?: unknown;
  tipo?: unknown;
  observacao?: unknown;
};

type VeiculoEnvolvido = {
  placa?: unknown;
  tipo_especie?: unknown;
  marca?: unknown;
  modelo?: unknown;
  cor?: unknown;
  ano?: unknown;
  renavam?: unknown;
  chassi?: unknown;
  proprietario?: unknown;
  cpf_proprietario?: unknown;
  telefone_proprietario?: unknown;
  email_proprietario?: unknown;
  endereco_proprietario?: unknown;
  cidade_proprietario?: unknown;
  uf_proprietario?: unknown;
  cep_proprietario?: unknown;
  condutor?: unknown;
  tipo_documento_condutor?: unknown;
  documento_condutor?: unknown;
  situacao?: unknown;
  observacao?: unknown;
  situacao_consulta?: unknown;
};

type ItemOcorrencia = Record<string, unknown>;

type ContextoAutenticado = {
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  authEmail: string;
};

type ResultadoAutenticacao =
  | {
      ok: true;
      contexto: ContextoAutenticado;
    }
  | {
      ok: false;
      resposta: NextResponse;
    };

const STATUS_VALIDOS = [
  "RASCUNHO",
  "Aberta",
  "Em andamento",
  "Finalizada",
  "Cancelada",
] as const;

const PRIORIDADES_VALIDAS = [
  "BAIXA",
  "MEDIA",
  "ALTA",
] as const;

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
    request.headers.get("user-agent") ||
    "Não identificado"
  ).slice(0, 500);
}

function texto(
  valor: unknown,
  limite: number
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
}

function inteiroOpcional(valor: unknown) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isSafeInteger(numero) ||
    numero <= 0
  ) {
    return null;
  }

  return numero;
}

function numeroDecimalOpcional(
  valor: unknown,
  minimo: number,
  maximo: number
) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  const numero = Number(valor);

  if (
    !Number.isFinite(numero) ||
    numero < minimo ||
    numero > maximo
  ) {
    return null;
  }

  return numero;
}


function listaObjetos<T>(
  valor: unknown,
  limite: number
): T[] {
  if (!Array.isArray(valor)) {
    return [];
  }

  return valor
    .filter(
      (item) =>
        item &&
        typeof item === "object" &&
        !Array.isArray(item)
    )
    .slice(0, limite) as T[];
}

function limparEnvolvido(
  pessoa: Envolvido
) {
  return {
    nome: texto(pessoa.nome, 200),
    tipo_documento: texto(
      pessoa.tipo_documento,
      40
    ),
    documento: texto(
      pessoa.documento,
      50
    ),
    telefone: texto(
      pessoa.telefone,
      30
    ),
    endereco: texto(
      pessoa.endereco,
      500
    ),
    tipo: texto(pessoa.tipo, 80),
    observacao: texto(
      pessoa.observacao,
      2000
    ),
  };
}

function limparVeiculo(
  veiculo: VeiculoEnvolvido
) {
  return {
    placa: texto(veiculo.placa, 10)
      .toUpperCase(),
    tipo_especie: texto(
      veiculo.tipo_especie,
      80
    ),
    marca: texto(veiculo.marca, 100),
    modelo: texto(veiculo.modelo, 100),
    cor: texto(veiculo.cor, 50),
    ano: texto(veiculo.ano, 10),
    renavam: texto(
      veiculo.renavam,
      20
    ),
    chassi: texto(
      veiculo.chassi,
      30
    ).toUpperCase(),
    proprietario: texto(
      veiculo.proprietario,
      200
    ),
    cpf_proprietario: texto(
      veiculo.cpf_proprietario,
      30
    ),
    telefone_proprietario: texto(
      veiculo.telefone_proprietario,
      30
    ),
    email_proprietario: texto(
      veiculo.email_proprietario,
      200
    ),
    endereco_proprietario: texto(
      veiculo.endereco_proprietario,
      500
    ),
    cidade_proprietario: texto(
      veiculo.cidade_proprietario,
      150
    ),
    uf_proprietario: texto(
      veiculo.uf_proprietario,
      2
    ).toUpperCase(),
    cep_proprietario: texto(
      veiculo.cep_proprietario,
      20
    ),
    condutor: texto(
      veiculo.condutor,
      200
    ),
    tipo_documento_condutor: texto(
      veiculo.tipo_documento_condutor,
      40
    ),
    documento_condutor: texto(
      veiculo.documento_condutor,
      50
    ),
    situacao: texto(
      veiculo.situacao,
      100
    ),
    observacao: texto(
      veiculo.observacao,
      3000
    ),
    situacao_consulta: texto(
      veiculo.situacao_consulta,
      100
    ),
  };
}

function limparItem(
  item: ItemOcorrencia
) {
  const resultado: Record<string, string> =
    {};

  const campos = [
    "categoria",
    "subcategoria",
    "descricao",
    "marca",
    "modelo",
    "cor",
    "imei",
    "calibre",
    "numeracao",
    "quantidade",
    "peso",
    "unidade_peso",
    "valor_estimado",
    "procedencia",
    "situacao",
    "observacao",
  ];

  for (const campo of campos) {
    resultado[campo] = texto(
      item[campo],
      campo === "observacao" ||
        campo === "descricao"
        ? 3000
        : 200
    );
  }

  return resultado;
}


function extrairCaminhoFoto(
  valor: unknown
) {
  const textoUrl = texto(valor, 3000);

  if (!textoUrl) {
    return null;
  }

  if (!textoUrl.startsWith("http")) {
    return textoUrl
      .replace(/^\/+/, "")
      .trim();
  }

  try {
    const url = new URL(textoUrl);
    const indice =
      url.pathname.indexOf(
        PREFIXO_PUBLICO
      );

    if (indice < 0) {
      return null;
    }

    return decodeURIComponent(
      url.pathname.slice(
        indice + PREFIXO_PUBLICO.length
      )
    )
      .replace(/^\/+/, "")
      .trim();
  } catch {
    return null;
  }
}

async function validarFotosDaOcorrencia({
  corpo,
  municipioId,
}: {
  corpo: Record<string, unknown>;
  municipioId: number;
}) {
  const valores = Array.isArray(
    corpo.fotos_paths
  )
    ? corpo.fotos_paths
    : Array.isArray(corpo.fotos_urls)
      ? corpo.fotos_urls
      : [];

  const caminhos = Array.from(
    new Set(
      valores
        .map(extrairCaminhoFoto)
        .filter(
          (
            caminho
          ): caminho is string =>
            Boolean(caminho)
        )
    )
  ).slice(0, 10);

  if (caminhos.length === 0) {
    return {
      ok: true as const,
      caminhos: [] as string[],
      urls: [] as string[],
    };
  }

  const prefixoPermitido =
    `${municipioId}/temporarios/`;

  for (const caminho of caminhos) {
    if (
      !caminho.startsWith(
        prefixoPermitido
      )
    ) {
      return {
        ok: false as const,
        erro:
          "Uma das fotos não pertence ao município autorizado.",
      };
    }

    if (
      !/\.(jpg|jpeg|png|webp)$/i.test(
        caminho
      )
    ) {
      return {
        ok: false as const,
        erro:
          "Uma das fotos possui formato inválido.",
      };
    }

    const ultimaBarra =
      caminho.lastIndexOf("/");

    const pasta = caminho.slice(
      0,
      ultimaBarra
    );

    const arquivo = caminho.slice(
      ultimaBarra + 1
    );

    const {
      data: objetos,
      error: listaError,
    } = await supabaseAdmin.storage
      .from(BUCKET_FOTOS)
      .list(pasta, {
        limit: 10,
        search: arquivo,
      });

    if (listaError) {
      console.error(
        "Erro ao validar foto enviada:",
        {
          message:
            listaError.message,
          caminho,
          municipio_id:
            municipioId,
        }
      );

      return {
        ok: false as const,
        erro:
          "Não foi possível validar as fotos enviadas.",
      };
    }

    const existe = (objetos || []).some(
      (objeto) =>
        objeto.name === arquivo
    );

    if (!existe) {
      return {
        ok: false as const,
        erro:
          "Uma das fotos informadas não foi encontrada no armazenamento.",
      };
    }
  }

  const urls = caminhos.map(
    (caminho) =>
      supabaseAdmin.storage
        .from(BUCKET_FOTOS)
        .getPublicUrl(caminho)
        .data.publicUrl
  );

  return {
    ok: true as const,
    caminhos,
    urls,
  };
}

async function autenticar(
  request: NextRequest
): Promise<ResultadoAutenticacao> {
  const accessToken = obterToken(request);

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
  } = await supabaseAdmin.auth.getUser(
    accessToken
  );

  if (authError || !authUser) {
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
      "Erro ao validar usuário para criar ocorrência:",
      {
        message: usuarioError.message,
        details: usuarioError.details,
        hint: usuarioError.hint,
        code: usuarioError.code,
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

  let municipioId = Number(
    usuario.municipio_id || 0
  );

  if (perfil === "DESENVOLVEDOR") {
    const corpo = await request
      .clone()
      .json()
      .catch(() => null);

    const municipioInformado = Number(
      corpo?.municipio_id || 0
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
          "Erro ao validar município da ocorrência:",
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
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Usuário sem município vinculado.",
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
        "Erro ao validar permissão para criar ocorrência:",
        {
          message: permissaoError.message,
          details: permissaoError.details,
          hint: permissaoError.hint,
          code: permissaoError.code,
        }
      );

      return {
        ok: false,
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
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Você não possui permissão para registrar ocorrências.",
          },
          403
        ),
      };
    }
  }

  return {
    ok: true,
    contexto: {
      usuario,
      perfil,
      municipioId,
      authEmail:
        authUser.email ||
        usuario.email ||
        "",
    },
  };
}

async function validarVinculoMunicipal(
  tabela: string,
  id: number | null,
  municipioId: number
) {
  if (!id) {
    return true;
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(tabela)
    .select("id")
    .eq("id", id)
    .eq("municipio_id", municipioId)
    .maybeSingle();

  if (error) {
    console.error(
      `Erro ao validar ${tabela}:`,
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        id,
        municipio_id: municipioId,
      }
    );

    return false;
  }

  return Boolean(data);
}

async function registrarAuditoria({
  request,
  contexto,
  ocorrenciaId,
  protocolo,
  acao,
  descricao,
  detalhes,
}: {
  request: NextRequest;
  contexto: ContextoAutenticado;
  ocorrenciaId: number;
  protocolo: string;
  acao: string;
  descricao: string;
  detalhes: Record<string, unknown>;
}) {
  const { error } = await supabaseAdmin
    .from("auditoria")
    .insert({
      municipio_id:
        contexto.municipioId,
      guarda_id:
        contexto.usuario.id,
      usuario_nome:
        contexto.usuario.nome ||
        "Usuário",
      usuario_email:
        contexto.authEmail,
      perfil: contexto.perfil,
      modulo: "Ocorrências",
      acao,
      descricao,
      status: "SUCESSO",
      ip: obterIp(request),
      dispositivo:
        obterDispositivo(request),
      tabela: "ocorrencias",
      registro_id:
        String(ocorrenciaId),
      detalhes: {
        protocolo,
        ...detalhes,
      },
    });

  if (error) {
    console.error(
      "Erro ao registrar auditoria da nova ocorrência:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        ocorrencia_id:
          ocorrenciaId,
      }
    );

    return false;
  }

  return true;
}

async function sincronizarVeiculos({
  contexto,
  veiculos,
  local,
  data,
  hora,
}: {
  contexto: ContextoAutenticado;
  veiculos: ReturnType<
    typeof limparVeiculo
  >[];
  local: string;
  data: string;
  hora: string;
}) {
  const falhas: string[] = [];

  for (const veiculo of veiculos) {
    if (!veiculo.placa) {
      continue;
    }

    let consulta = supabaseAdmin
      .from("veiculos_abordados")
      .select("id")
      .eq(
        "municipio_id",
        contexto.municipioId
      );

    consulta = consulta.eq(
      "placa",
      veiculo.placa
    );

    const {
      data: existente,
      error: consultaError,
    } = await consulta.maybeSingle();

    if (consultaError) {
      falhas.push(
        `Consulta do veículo ${
          veiculo.placa ||
          veiculo.renavam
        }`
      );
      continue;
    }

    const dados = {
      placa: veiculo.placa || null,
      tipo_especie:
        veiculo.tipo_especie || null,
      marca: veiculo.marca || null,
      modelo: veiculo.modelo || null,
      ano: veiculo.ano || null,
      cor: veiculo.cor || null,
      renavam:
        veiculo.renavam || null,
      chassi:
        veiculo.chassi || null,
      proprietario:
        veiculo.proprietario || null,
      cpf_proprietario:
        veiculo.cpf_proprietario ||
        null,
      telefone_proprietario:
        veiculo.telefone_proprietario ||
        null,
      situacao:
        veiculo.situacao || null,
      local,
      data,
      hora,
      observacao:
        veiculo.observacao || null,
      atualizado_em:
        new Date().toISOString(),
    };

    if (existente) {
      const { error } =
        await supabaseAdmin
          .from("veiculos_abordados")
          .update(dados)
          .eq("id", existente.id)
          .eq(
            "municipio_id",
            contexto.municipioId
          );

      if (error) {
        falhas.push(
          `Atualização do veículo ${
            veiculo.placa ||
            veiculo.renavam
          }`
        );
      }
    } else {
      const { error } =
        await supabaseAdmin
          .from("veiculos_abordados")
          .insert({
            municipio_id:
              contexto.municipioId,
            criado_por:
              contexto.usuario.auth_id ||
              null,
            criado_em:
              new Date().toISOString(),
            ...dados,
          });

      if (error) {
        falhas.push(
          `Cadastro do veículo ${
            veiculo.placa ||
            veiculo.renavam
          }`
        );
      }
    }
  }

  return falhas;
}

async function sincronizarPessoas({
  contexto,
  pessoas,
  local,
  data,
  hora,
  equipeEmpenhada,
}: {
  contexto: ContextoAutenticado;
  pessoas: ReturnType<
    typeof limparEnvolvido
  >[];
  local: string;
  data: string;
  hora: string;
  equipeEmpenhada: string;
}) {
  const falhas: string[] = [];

  for (const pessoa of pessoas) {
    if (!pessoa.documento) {
      continue;
    }

    const {
      data: existente,
      error: consultaError,
    } = await supabaseAdmin
      .from("pessoas_abordadas")
      .select("id")
      .eq(
        "municipio_id",
        contexto.municipioId
      )
      .eq(
        "documento",
        pessoa.documento
      )
      .maybeSingle();

    if (consultaError) {
      falhas.push(
        `Consulta da pessoa ${pessoa.documento}`
      );
      continue;
    }

    const dados = {
      nome: pessoa.nome || null,
      tipo_documento:
        pessoa.tipo_documento ||
        null,
      documento:
        pessoa.documento,
      telefone:
        pessoa.telefone || null,
      endereco:
        pessoa.endereco || null,
      observacao:
        pessoa.observacao || null,
      atualizado_em:
        new Date().toISOString(),
    };

    if (existente) {
      const { error } =
        await supabaseAdmin
          .from("pessoas_abordadas")
          .update(dados)
          .eq("id", existente.id)
          .eq(
            "municipio_id",
            contexto.municipioId
          );

      if (error) {
        falhas.push(
          `Atualização da pessoa ${pessoa.documento}`
        );
      }
    } else {
      const { error } =
        await supabaseAdmin
          .from("pessoas_abordadas")
          .insert({
            municipio_id:
              contexto.municipioId,
            usuario_id:
              contexto.usuario.id,
            criado_em:
              new Date().toISOString(),
            local,
            data,
            hora,
            guarda:
              equipeEmpenhada,
            ...dados,
          });

      if (error) {
        falhas.push(
          `Cadastro da pessoa ${pessoa.documento}`
        );
      }
    }
  }

  return falhas;
}

export async function POST(
  request: NextRequest
) {
  try {
    const autenticacao =
      await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    const contexto =
      autenticacao.contexto;

    const corpo = await request
      .json()
      .catch(() => null);

    if (!corpo || typeof corpo !== "object") {
      return responder(
        {
          ok: false,
          erro:
            "Dados da ocorrência não informados.",
        },
        400
      );
    }

    const tipo = texto(
      corpo.tipo,
      200
    );

    const status = texto(
      corpo.status,
      30
    );

    const prioridade = texto(
      corpo.prioridade,
      20
    ).toUpperCase();

    const bairro = texto(
      corpo.bairro,
      200
    );

    const local = texto(
      corpo.local,
      500
    );

    const numero = texto(
      corpo.numero,
      50
    );

    const descricao = texto(
      corpo.descricao,
      30000
    );

    const guarnicaoId =
      inteiroOpcional(
        corpo.guarnicao_id
      );

    const viaturaId =
      inteiroOpcional(
        corpo.viatura_id
      );

    const guardaResponsavelId =
      inteiroOpcional(
        corpo.guarda_responsavel_id
      );

    const localId =
      inteiroOpcional(
        corpo.local_id
      );

    const viaturaEmpenhada = texto(
      corpo.viatura_empenhada,
      100
    );

    const equipeEmpenhada = texto(
      corpo.equipe_empenhada,
      5000
    );


    const latitudeInformada =
      corpo.latitude !== null &&
      corpo.latitude !== undefined &&
      corpo.latitude !== "";

    const longitudeInformada =
      corpo.longitude !== null &&
      corpo.longitude !== undefined &&
      corpo.longitude !== "";

    const latitude =
      numeroDecimalOpcional(
        corpo.latitude,
        -90,
        90
      );

    const longitude =
      numeroDecimalOpcional(
        corpo.longitude,
        -180,
        180
      );

    if (
      !tipo ||
      !local ||
      !descricao
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Preencha tipo, local e descrição.",
        },
        400
      );
    }


    if (
      (latitudeInformada &&
        latitude === null) ||
      (longitudeInformada &&
        longitude === null)
    ) {
      return responder(
        {
          ok: false,
          erro:
            "As coordenadas GPS informadas são inválidas.",
        },
        400
      );
    }

    if (
      (latitude === null) !==
      (longitude === null)
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Informe latitude e longitude juntas.",
        },
        400
      );
    }

    if (
      !STATUS_VALIDOS.includes(
        status as (typeof STATUS_VALIDOS)[number]
      )
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Status da ocorrência inválido.",
        },
        400
      );
    }

    if (
      !PRIORIDADES_VALIDAS.includes(
        prioridade as (typeof PRIORIDADES_VALIDAS)[number]
      )
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Prioridade da ocorrência inválida.",
        },
        400
      );
    }

    const [
      guarnicaoValida,
      viaturaValida,
      guardaValido,
      localValido,
    ] = await Promise.all([
      validarVinculoMunicipal(
        "guarnicoes",
        guarnicaoId,
        contexto.municipioId
      ),
      validarVinculoMunicipal(
        "viaturas",
        viaturaId,
        contexto.municipioId
      ),
      validarVinculoMunicipal(
        "guardas",
        guardaResponsavelId,
        contexto.municipioId
      ),
      validarVinculoMunicipal(
        "locais",
        localId,
        contexto.municipioId
      ),
    ]);

    if (
      !guarnicaoValida ||
      !viaturaValida ||
      !guardaValido ||
      !localValido
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Um dos vínculos operacionais não pertence ao município autorizado.",
        },
        403
      );
    }

    const envolvidos = listaObjetos<
      Envolvido
    >(corpo.envolvidos, 30)
      .map(limparEnvolvido)
      .filter(
        (pessoa) =>
          pessoa.nome ||
          pessoa.documento ||
          pessoa.telefone ||
          pessoa.endereco ||
          pessoa.observacao
      );

    const veiculos = listaObjetos<
      VeiculoEnvolvido
    >(corpo.veiculos_envolvidos, 20)
      .map(limparVeiculo)
      .filter(
        (veiculo) =>
          veiculo.placa ||
          veiculo.renavam ||
          veiculo.modelo ||
          veiculo.condutor
      );

    const itens = listaObjetos<
      ItemOcorrencia
    >(corpo.armas_objetos, 50)
      .map(limparItem)
      .filter(
        (item) =>
          item.categoria ||
          item.descricao ||
          item.numeracao
      );

    const fotosValidadas =
      await validarFotosDaOcorrencia({
        corpo,
        municipioId:
          contexto.municipioId,
      });

    if (!fotosValidadas.ok) {
      return responder(
        {
          ok: false,
          erro:
            fotosValidadas.erro,
        },
        403
      );
    }

    const fotosUrls =
      fotosValidadas.urls;

    const agora = new Date();

    const data =
      agora.toLocaleDateString(
        "en-CA",
        {
          timeZone:
            "America/Bahia",
        }
      );

    const hora =
      agora.toLocaleTimeString(
        "pt-BR",
        {
          timeZone:
            "America/Bahia",
          hour12: false,
        }
      );

    const protocolo = `OC-${Date.now()}-${randomUUID()
      .slice(0, 6)
      .toUpperCase()}`;

    const {
      data: ocorrencia,
      error: ocorrenciaError,
    } = await supabaseAdmin
      .from("ocorrencias")
      .insert({
        municipio_id:
          contexto.municipioId,
        criado_por:
          String(
            contexto.usuario.id
          ),
        criado_em:
          agora.toISOString(),
        atualizado_em:
          agora.toISOString(),
        guarnicao_id:
          guarnicaoId,
        viatura_id:
          viaturaId,
        guarda_responsavel_id:
          guardaResponsavelId,
        protocolo,
        tipo,
        status,
        prioridade,
        data,
        hora,
        bairro:
          bairro || null,
        local,
        local_id: localId,
        numero:
          numero || null,
        envolvidos:
          JSON.stringify(
            envolvidos
          ),
        veiculos_envolvidos:
          veiculos,
        armas_objetos:
          itens,
        descricao,
        foto_url:
          fotosUrls[0] || "",
        fotos_urls:
          JSON.stringify(
            fotosUrls
          ),
        viatura_empenhada:
          viaturaEmpenhada ||
          null,
        equipe_empenhada:
          equipeEmpenhada ||
          null,
        latitude,
        longitude,
      })
      .select(
        "id,protocolo,municipio_id"
      )
      .single();

    if (
      ocorrenciaError ||
      !ocorrencia
    ) {
      console.error(
        "Erro ao criar ocorrência:",
        {
          message:
            ocorrenciaError?.message,
          details:
            ocorrenciaError?.details,
          hint:
            ocorrenciaError?.hint,
          code:
            ocorrenciaError?.code,
          municipio_id:
            contexto.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível registrar a ocorrência.",
        },
        500
      );
    }

    const [
      falhasVeiculos,
      falhasPessoas,
    ] = await Promise.all([
      sincronizarVeiculos({
        contexto,
        veiculos,
        local,
        data,
        hora,
      }),
      sincronizarPessoas({
        contexto,
        pessoas: envolvidos,
        local,
        data,
        hora,
        equipeEmpenhada,
      }),
    ]);

    const auditoriaRegistrada =
      await registrarAuditoria({
        request,
        contexto,
        ocorrenciaId:
          ocorrencia.id,
        protocolo,
        acao: "CRIAR",
        descricao: `Registrou a ocorrência ${protocolo}.`,
        detalhes: {
          tipo,
          status,
          prioridade,
          guarnicao_id:
            guarnicaoId,
          viatura_id:
            viaturaId,
          guarda_responsavel_id:
            guardaResponsavelId,
          total_envolvidos:
            envolvidos.length,
          total_veiculos:
            veiculos.length,
          total_itens:
            itens.length,
          total_fotos:
            fotosUrls.length,
          gps_registrado:
            latitude !== null &&
            longitude !== null,
          latitude,
          longitude,
          falhas_sincronizacao: [
            ...falhasVeiculos,
            ...falhasPessoas,
          ],
        },
      });

    if (!auditoriaRegistrada) {
      return responder(
        {
          ok: false,
          criado: true,
          ocorrencia,
          erro:
            "A ocorrência foi registrada, mas a auditoria não pôde ser salva.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        ocorrencia,
        mensagem:
          "Ocorrência registrada com sucesso.",
        avisos: [
          ...falhasVeiculos,
          ...falhasPessoas,
        ],
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado no POST /api/ocorrencias/nova:",
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
          "Erro interno ao registrar a ocorrência.",
      },
      500
    );
  }
}