import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime =
  "nodejs";
export const dynamic =
  "force-dynamic";

type UsuarioSistema = {
  id: number;
  auth_id: string | null;
  nome: string | null;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type Municipio = {
  id: number;
  nome: string | null;
  estado: string | null;
  ativo: boolean | null;
};

type RegistroPessoaRede = {
  id: number;
  municipio_id: number;
  tipo_documento: string | null;
  documento_normalizado: string | null;
  data: string | null;
  hora: string | null;
  motivo_abordagem: string | null;
  desfecho: string | null;
  nivel_alerta: string | null;
  criado_em: string | null;
};

type ContextoAutenticado = {
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
};

const NIVEIS_ALERTA =
  new Set([
    "INFORMATIVO",
    "ATENCAO",
    "ALTO_RISCO",
    "RESTRITO",
  ]);

const TIPOS_DOCUMENTO =
  new Set([
    "CPF",
    "RG",
    "CNH",
    "PASSAPORTE",
    "OUTRO",
  ]);

function responder(
  corpo: Record<
    string,
    unknown
  >,
  status: number
) {
  return NextResponse.json(
    corpo,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store",
      },
    }
  );
}

function tokenBearer(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  return (
    authorization
      .slice(7)
      .trim() || null
  );
}

function inteiroPositivo(
  valor: unknown
) {
  const numero =
    Number(valor);

  return Number.isSafeInteger(
    numero
  ) && numero > 0
    ? numero
    : null;
}

function texto(
  valor: unknown,
  maximo: number,
  fallback = ""
) {
  const normalizado =
    String(valor ?? "")
      .replace(
        /[\u0000-\u001F\u007F]/g,
        " "
      )
      .replace(/\s+/g, " ")
      .trim();

  if (!normalizado) {
    return fallback;
  }

  return normalizado.slice(
    0,
    maximo
  );
}

function normalizarDocumento(
  valor: unknown
) {
  return String(
    valor ?? ""
  )
    .trim()
    .toUpperCase()
    .replace(
      /[^A-Z0-9]/g,
      ""
    )
    .slice(0, 40);
}

function normalizarTipoDocumento(
  valor: unknown
) {
  const tipo =
    texto(
      valor,
      30
    ).toUpperCase();

  return TIPOS_DOCUMENTO.has(
    tipo
  )
    ? tipo
    : null;
}

function documentoValido(
  tipo: string,
  documento: string
) {
  if (
    tipo === "CPF" ||
    tipo === "CNH"
  ) {
    return /^\d{11}$/.test(
      documento
    );
  }

  if (tipo === "RG") {
    return (
      documento.length >= 5 &&
      documento.length <= 20
    );
  }

  return (
    documento.length >= 5 &&
    documento.length <= 40
  );
}

function dataIsoOpcional(
  valor: unknown
) {
  const data =
    String(
      valor ?? ""
    ).trim();

  if (!data) {
    return null;
  }

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      data
    )
  ) {
    return undefined;
  }

  const teste =
    new Date(
      `${data}T12:00:00Z`
    );

  if (
    Number.isNaN(
      teste.getTime()
    ) ||
    teste
      .toISOString()
      .slice(0, 10) !==
      data
  ) {
    return undefined;
  }

  return data;
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
  return String(
    request.headers.get(
      "user-agent"
    ) ||
      "Não identificado"
  ).slice(0, 500);
}

async function autenticar(
  request: NextRequest
): Promise<
  | {
      ok: true;
      contexto:
        ContextoAutenticado;
    }
  | {
      ok: false;
      resposta:
        NextResponse;
    }
> {
  const token =
    tokenBearer(request);

  if (!token) {
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
      token
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
    data: usuarioData,
    error: usuarioError,
  } = await supabaseAdmin
    .from("usuarios")
    .select(
      "id,auth_id,nome,email,perfil,status,municipio_id"
    )
    .eq(
      "auth_id",
      authUser.id
    )
    .maybeSingle();

  const usuario =
    usuarioData as
      | UsuarioSistema
      | null;

  if (
    usuarioError ||
    !usuario
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Usuário responsável não localizado.",
        },
        403
      ),
    };
  }

  const perfil =
    texto(
      usuario.perfil,
      50
    ).toUpperCase();

  const status =
    texto(
      usuario.status,
      30
    ).toUpperCase();

  if (
    status !== "ATIVO"
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

  const municipioSolicitado =
    inteiroPositivo(
      request.nextUrl
        .searchParams
        .get(
          "municipio_id"
        )
    );

  let municipioId =
    inteiroPositivo(
      usuario.municipio_id
    );

  if (
    perfil ===
    "DESENVOLVEDOR"
  ) {
    if (
      !municipioSolicitado
    ) {
      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Selecione um município válido.",
          },
          422
        ),
      };
    }

    const {
      data: municipio,
      error:
        municipioError,
    } = await supabaseAdmin
      .from("municipios")
      .select("id")
      .eq(
        "id",
        municipioSolicitado
      )
      .eq("ativo", true)
      .maybeSingle();

    if (
      municipioError ||
      !municipio
    ) {
      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Município informado é inválido.",
          },
          422
        ),
      };
    }

    municipioId =
      Number(municipio.id);
  } else {
    if (!municipioId) {
      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Usuário sem município vinculado.",
          },
          403
        ),
      };
    }

    if (
      municipioSolicitado &&
      municipioSolicitado !==
        municipioId
    ) {
      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Você não possui acesso ao município informado.",
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
      municipioId:
        Number(
          municipioId
        ),
    },
  };
}

async function possuiPermissao({
  perfil,
  municipioId,
  campo,
}: {
  perfil: string;
  municipioId: number;
  campo:
    | "pode_ver"
    | "pode_criar";
}) {
  if (
    perfil ===
    "DESENVOLVEDOR"
  ) {
    return true;
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(
      "permissoes_perfis"
    )
    .select("id")
    .eq(
      "municipio_id",
      municipioId
    )
    .eq(
      "perfil",
      perfil
    )
    .eq(
      "modulo",
      "pessoas_abordadas"
    )
    .eq(
      campo,
      true
    )
    .limit(1);

  if (error) {
    console.error(
      "Erro ao validar permissão do alerta de pessoa:",
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
          municipioId,
        perfil,
        campo,
      }
    );

    return false;
  }

  return Boolean(
    data?.length
  );
}

async function registrarAuditoria({
  request,
  contexto,
  acao,
  descricao,
  registroId,
  detalhes,
  status = "SUCESSO",
}: {
  request: NextRequest;
  contexto:
    ContextoAutenticado;
  acao: string;
  descricao: string;
  registroId?: number | null;
  detalhes:
    Record<
      string,
      unknown
    >;
  status?:
    | "SUCESSO"
    | "ERRO"
    | "ALERTA";
}) {
  return supabaseAdmin
    .from("auditoria")
    .insert({
      municipio_id:
        contexto.municipioId,
      guarda_id:
        contexto.usuario.id,
      usuario_nome:
        texto(
          contexto.usuario.nome,
          200,
          "Usuário"
        ),
      usuario_email:
        contexto.usuario.email ||
        null,
      perfil:
        contexto.perfil,
      modulo:
        "Alerta Intermunicipal de Pessoa",
      acao,
      descricao,
      registro_id:
        registroId
          ? String(
              registroId
            )
          : null,
      tabela:
        "pessoas_abordadas",
      status,
      ip:
        obterIp(request),
      dispositivo:
        obterDispositivo(
          request
        ),
      detalhes,
    });
}

function dataHoraBahia() {
  const agora =
    new Date();

  const data =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone:
          "America/Bahia",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(agora);

  const hora =
    new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          "America/Bahia",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }
    ).format(agora);

  return {
    data,
    hora,
  };
}

async function buscarAlertaIntermunicipal({
  tipoDocumento,
  documento,
  municipioId,
}: {
  tipoDocumento: string;
  documento: string;
  municipioId: number;
}) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from(
      "pessoas_abordadas"
    )
    .select(
      `
        id,
        municipio_id,
        tipo_documento,
        documento_normalizado,
        data,
        hora,
        motivo_abordagem,
        desfecho,
        nivel_alerta,
        criado_em
      `
    )
    .eq(
      "tipo_documento",
      tipoDocumento
    )
    .eq(
      "documento_normalizado",
      documento
    )
    .eq(
      "compartilhar_rede",
      true
    )
    .neq(
      "municipio_id",
      municipioId
    )
    .order(
      "data",
      {
        ascending: false,
        nullsFirst: false,
      }
    )
    .order(
      "hora",
      {
        ascending: false,
        nullsFirst: false,
      }
    )
    .order(
      "criado_em",
      {
        ascending: false,
      }
    )
    .limit(20);

  if (error) {
    throw new Error(
      error.message
    );
  }

  const registros =
    (data || []) as
      RegistroPessoaRede[];

  const municipioIds =
    Array.from(
      new Set(
        registros.map(
          (registro) =>
            Number(
              registro.municipio_id
            )
        )
      )
    ).filter(
      (id) =>
        Number.isSafeInteger(
          id
        ) &&
        id > 0
    );

  const mapaMunicipios =
    new Map<
      number,
      Municipio
    >();

  if (
    municipioIds.length > 0
  ) {
    const {
      data:
        municipiosData,
      error:
        municipiosError,
    } = await supabaseAdmin
      .from("municipios")
      .select(
        "id,nome,estado,ativo"
      )
      .in(
        "id",
        municipioIds
      )
      .eq("ativo", true);

    if (municipiosError) {
      throw new Error(
        municipiosError.message
      );
    }

    for (
      const municipio of
        (municipiosData ||
          []) as Municipio[]
    ) {
      mapaMunicipios.set(
        Number(
          municipio.id
        ),
        municipio
      );
    }
  }

  const resumo =
    registros
      .map(
        (registro) => {
          const municipio =
            mapaMunicipios.get(
              Number(
                registro.municipio_id
              )
            );

          if (!municipio) {
            return null;
          }

          return {
            id:
              Number(
                registro.id
              ),
            municipio_id:
              Number(
                registro.municipio_id
              ),
            municipio:
              texto(
                municipio.nome,
                160,
                "Município"
              ),
            estado:
              texto(
                municipio.estado,
                10
              ),
            data:
              registro.data ||
              (
                registro.criado_em
                  ? registro.criado_em
                      .slice(0, 10)
                  : null
              ),
            hora:
              registro.hora ||
              (
                registro.criado_em
                  ? registro.criado_em
                      .slice(11, 19)
                  : null
              ),
            motivo:
              texto(
                registro
                  .motivo_abordagem,
                300,
                "ABORDAGEM REGISTRADA"
              ),
            desfecho:
              texto(
                registro.desfecho,
                300,
                "NÃO INFORMADO"
              ),
            nivel_alerta:
              NIVEIS_ALERTA.has(
                texto(
                  registro
                    .nivel_alerta,
                  30
                ).toUpperCase()
              )
                ? texto(
                    registro
                      .nivel_alerta,
                    30
                  ).toUpperCase()
                : "INFORMATIVO",
          };
        }
      )
      .filter(
        (
          registro
        ): registro is
          NonNullable<
            typeof registro
          > =>
          Boolean(registro)
      );

  const totalMunicipios =
    new Set(
      resumo.map(
        (registro) =>
          registro.municipio_id
      )
    ).size;

  return {
    alerta:
      resumo.length > 0,
    total_registros:
      resumo.length,
    total_municipios:
      totalMunicipios,
    ultimo_registro:
  resumo.length > 0
    ? resumo[0]
    : null,
    registros:
      resumo,
  };
}

export async function GET(
  request: NextRequest
) {
  try {
    const autenticacao =
      await autenticar(
        request
      );

    if (
      !autenticacao.ok
    ) {
      return autenticacao.resposta;
    }

    const autorizado =
      await possuiPermissao({
        perfil:
          autenticacao
            .contexto.perfil,
        municipioId:
          autenticacao
            .contexto
            .municipioId,
        campo: "pode_ver",
      });

    if (!autorizado) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para consultar alertas de pessoas.",
        },
        403
      );
    }

    const tipoDocumento =
      normalizarTipoDocumento(
        request.nextUrl
          .searchParams
          .get(
            "tipo_documento"
          )
      );

    const documento =
      normalizarDocumento(
        request.nextUrl
          .searchParams
          .get(
            "documento"
          )
      );

    if (
      !tipoDocumento ||
      !documento ||
      !documentoValido(
        tipoDocumento,
        documento
      )
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Informe um documento válido.",
        },
        422
      );
    }

    const alerta =
      await buscarAlertaIntermunicipal({
        tipoDocumento,
        documento,
        municipioId:
          autenticacao
            .contexto
            .municipioId,
      });

    const {
      error:
        auditoriaError,
    } =
      await registrarAuditoria({
        request,
        contexto:
          autenticacao.contexto,
        acao:
          "CONSULTAR_ALERTA_INTERMUNICIPAL",
        descricao:
          alerta.alerta
            ? "Consultou documento de pessoa e encontrou registro em outro município."
            : "Consultou documento de pessoa sem registro em outro município.",
        detalhes: {
          tipo_documento:
            tipoDocumento,
          tamanho_documento:
            documento.length,
          total_registros:
            alerta.total_registros,
          total_municipios:
            alerta.total_municipios,
          municipios:
            alerta.registros.map(
              (registro) =>
                `${registro.municipio}-${registro.estado}`
            ),
        },
        status:
          alerta.alerta
            ? "ALERTA"
            : "SUCESSO",
      });

    if (auditoriaError) {
      console.error(
        "Erro ao auditar consulta intermunicipal de pessoa:",
        auditoriaError.message
      );

      return responder(
        {
          ok: false,
          erro:
            "A consulta não foi exibida porque a auditoria falhou.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        tipo_documento:
          tipoDocumento,
        ...alerta,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao consultar alerta intermunicipal de pessoa:",
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
          "Erro interno ao consultar a rede de pessoas.",
      },
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  try {
    const autenticacao =
      await autenticar(
        request
      );

    if (
      !autenticacao.ok
    ) {
      return autenticacao.resposta;
    }

    const autorizado =
      await possuiPermissao({
        perfil:
          autenticacao
            .contexto.perfil,
        municipioId:
          autenticacao
            .contexto
            .municipioId,
        campo: "pode_criar",
      });

    if (!autorizado) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para registrar pessoas abordadas.",
        },
        403
      );
    }

    const corpo =
      (await request
        .json()
        .catch(
          () => null
        )) as
        | Record<
            string,
            unknown
          >
        | null;

    if (!corpo) {
      return responder(
        {
          ok: false,
          erro:
            "Dados da abordagem não informados.",
        },
        400
      );
    }

    const nome =
      texto(
        corpo.nome,
        200
      );

    const tipoDocumento =
      normalizarTipoDocumento(
        corpo.tipo_documento
      );

    const documento =
      normalizarDocumento(
        corpo.documento
      );

    const local =
      texto(
        corpo.local,
        500
      );

    const motivo =
      texto(
        corpo.motivo_abordagem,
        300
      );

    const dataNascimento =
      dataIsoOpcional(
        corpo.data_nascimento
      );

    if (
      dataNascimento ===
      undefined
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Data de nascimento inválida.",
        },
        422
      );
    }

    if (
      nome.length < 3 ||
      !local ||
      !motivo
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Informe nome, local e motivo da abordagem.",
        },
        422
      );
    }

    if (
      documento &&
      (
        !tipoDocumento ||
        !documentoValido(
          tipoDocumento,
          documento
        )
      )
    ) {
      return responder(
        {
          ok: false,
          erro:
            "O documento informado é inválido.",
        },
        422
      );
    }

let alertaAnterior: Awaited<
  ReturnType<
    typeof buscarAlertaIntermunicipal
  >
> = {
  alerta: false,
  total_registros: 0,
  total_municipios: 0,
  ultimo_registro: null,
  registros: [],
};

    if (
      tipoDocumento &&
      documento
    ) {
      alertaAnterior =
        await buscarAlertaIntermunicipal({
          tipoDocumento,
          documento,
          municipioId:
            autenticacao
              .contexto
              .municipioId,
        });

      if (
        alertaAnterior.alerta &&
        corpo.alerta_confirmado !==
          true
      ) {
        const {
          error:
            auditoriaError,
        } =
          await registrarAuditoria({
            request,
            contexto:
              autenticacao.contexto,
            acao:
              "ALERTA_INTERMUNICIPAL_EXIBIDO",
            descricao:
              "Alerta intermunicipal exibido antes do registro de pessoa.",
            detalhes: {
              tipo_documento:
                tipoDocumento,
              total_registros:
                alertaAnterior
                  .total_registros,
              total_municipios:
                alertaAnterior
                  .total_municipios,
            },
            status: "ALERTA",
          });

        if (auditoriaError) {
          console.error(
            "Erro ao auditar alerta anterior de pessoa:",
            auditoriaError.message
          );
        }

        return responder(
          {
            ok: false,
            exige_confirmacao:
              true,
            erro:
              "Confirme que tomou ciência do alerta intermunicipal antes de salvar.",
            tipo_documento:
              tipoDocumento,
            ...alertaAnterior,
          },
          409
        );
      }

      const {
        data: existente,
        error:
          duplicidadeError,
      } = await supabaseAdmin
        .from(
          "pessoas_abordadas"
        )
        .select("id")
        .eq(
          "municipio_id",
          autenticacao
            .contexto
            .municipioId
        )
        .eq(
          "tipo_documento",
          tipoDocumento
        )
        .eq(
          "documento_normalizado",
          documento
        )
        .limit(1)
        .maybeSingle();

      if (duplicidadeError) {
        console.error(
          "Erro ao verificar duplicidade de pessoa:",
          duplicidadeError.message
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível verificar a duplicidade.",
          },
          500
        );
      }

      if (existente) {
        return responder(
          {
            ok: false,
            erro:
              "Já existe pessoa com este documento neste município.",
          },
          409
        );
      }
    }

    const nivelInformado =
      texto(
        corpo.nivel_alerta,
        30,
        "INFORMATIVO"
      ).toUpperCase();

    const nivelAlerta =
      NIVEIS_ALERTA.has(
        nivelInformado
      )
        ? nivelInformado
        : "INFORMATIVO";

    const dataHora =
      dataHoraBahia();

    const {
      data: registro,
      error,
    } = await supabaseAdmin
      .from(
        "pessoas_abordadas"
      )
      .insert({
        municipio_id:
          autenticacao
            .contexto
            .municipioId,
        criado_por:
          String(
            autenticacao
              .contexto
              .usuario.id
          ),
        criado_em:
          new Date()
            .toISOString(),
        atualizado_em:
          new Date()
            .toISOString(),
        nome,
        tipo_documento:
          tipoDocumento ||
          null,
        documento:
          documento ||
          null,
        documento_normalizado:
          documento ||
          null,
        data_nascimento:
          dataNascimento,
        telefone:
          texto(
            corpo.telefone,
            30
          ) || null,
        endereco:
          texto(
            corpo.endereco,
            500
          ) || null,
        profissao:
          texto(
            corpo.profissao,
            120
          ) || null,
        observacao:
          texto(
            corpo.observacao,
            5000
          ) || null,
        local,
        data:
          dataHora.data,
        hora:
          dataHora.hora,
        guarda:
          texto(
            autenticacao
              .contexto
              .usuario.nome,
            200,
            "Usuário"
          ),
        motivo_abordagem:
          motivo,
        desfecho:
          texto(
            corpo.desfecho,
            300,
            "NÃO INFORMADO"
          ),
        nivel_alerta:
          nivelAlerta,
        compartilhar_rede:
          corpo.compartilhar_rede !==
          false,
      })
      .select(
        `
          id,
          municipio_id,
          nome,
          tipo_documento,
          documento,
          motivo_abordagem,
          desfecho,
          nivel_alerta,
          data,
          hora
        `
      )
      .single();

    if (
      error ||
      !registro
    ) {
      console.error(
        "Erro ao registrar pessoa abordada:",
        {
          message:
            error?.message,
          details:
            error?.details,
          hint:
            error?.hint,
          code:
            error?.code,
          municipio_id:
            autenticacao
              .contexto
              .municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível registrar a pessoa abordada.",
        },
        500
      );
    }

    const {
      error:
        auditoriaError,
    } =
      await registrarAuditoria({
        request,
        contexto:
          autenticacao.contexto,
        acao:
          "CRIAR_ABORDAGEM_PESSOA",
        descricao:
          "Registrou abordagem de pessoa.",
        registroId:
          Number(
            registro.id
          ),
        detalhes: {
          tipo_documento:
            tipoDocumento,
          motivo_abordagem:
            motivo,
          desfecho:
            registro.desfecho,
          nivel_alerta:
            nivelAlerta,
          compartilhar_rede:
            corpo.compartilhar_rede !==
            false,
          alerta_anterior:
            alertaAnterior.alerta,
          total_registros_anteriores:
            alertaAnterior
              .total_registros,
          total_municipios_anteriores:
            alertaAnterior
              .total_municipios,
        },
      });

    if (auditoriaError) {
      console.error(
        "Erro ao auditar abordagem de pessoa:",
        auditoriaError.message
      );

      await supabaseAdmin
        .from(
          "pessoas_abordadas"
        )
        .delete()
        .eq(
          "id",
          registro.id
        )
        .eq(
          "municipio_id",
          autenticacao
            .contexto
            .municipioId
        );

      return responder(
        {
          ok: false,
          erro:
            "A abordagem não foi salva porque a auditoria falhou.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        registro,
        alerta_anterior:
          alertaAnterior,
      },
      201
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao registrar abordagem de pessoa:",
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
          "Erro interno ao registrar a abordagem da pessoa.",
      },
      500
    );
  }
}
