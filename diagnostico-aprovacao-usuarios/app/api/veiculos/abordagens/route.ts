import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

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

type Municipio = {
  id: number;
  nome: string | null;
  estado: string | null;
  ativo: boolean | null;
};

type RegistroVeiculoRede = {
  id: number;
  municipio_id: number;
  placa: string | null;
  data: string | null;
  hora: string | null;
  situacao: string | null;
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

const NIVEIS_ALERTA = new Set([
  "INFORMATIVO",
  "ATENCAO",
  "ALTO_RISCO",
  "RESTRITO",
]);

function responder(
  corpo: Record<string, unknown>,
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
      .trim();

  if (!normalizado) {
    return fallback;
  }

  return normalizado.slice(
    0,
    maximo
  );
}

function normalizarPlaca(
  valor: unknown
) {
  const placa =
    String(valor ?? "")
      .trim()
      .toUpperCase()
      .replace(
        /[^A-Z0-9]/g,
        ""
      );

  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(
    placa
  )
    ? placa
    : null;
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
      contexto: ContextoAutenticado;
    }
  | {
      ok: false;
      resposta: NextResponse;
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
    console.error(
      "Erro ao validar usuário do alerta de veículo:",
      {
        message:
          usuarioError?.message,
        details:
          usuarioError?.details,
        hint:
          usuarioError?.hint,
        code:
          usuarioError?.code,
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

  const perfil =
    texto(
      usuario.perfil,
      40
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
    if (!municipioSolicitado) {
      return {
        ok: false,
        resposta: responder(
          {
            ok: false,
            erro:
              "Selecione o município da abordagem.",
          },
          422
        ),
      };
    }

    municipioId =
      municipioSolicitado;
  } else if (
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

  const {
    data: municipio,
    error: municipioError,
  } = await supabaseAdmin
    .from("municipios")
    .select(
      "id,nome,estado,ativo"
    )
    .eq(
      "id",
      municipioId
    )
    .maybeSingle<Municipio>();

  if (
    municipioError ||
    !municipio ||
    municipio.ativo === false
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Município informado é inválido ou está inativo.",
        },
        422
      ),
    };
  }

  return {
    ok: true,
    contexto: {
      usuario,
      perfil,
      municipioId,
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

  const modulos =
    campo ===
    "pode_criar"
      ? [
          "veiculos_abordados",
        ]
      : [
          "veiculos_abordados",
          "consulta_placa",
          "consulta_global",
        ];

  const {
    data,
    error,
  } = await supabaseAdmin
    .from(
      "permissoes_perfis"
    )
    .select(
      `modulo,${campo}`
    )
    .eq(
      "municipio_id",
      municipioId
    )
    .eq(
      "perfil",
      perfil
    )
    .in(
      "modulo",
      modulos
    )
    .eq(
      campo,
      true
    )
    .limit(1);

  if (error) {
    console.error(
      "Erro ao validar permissão do alerta de veículo:",
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
  contexto: ContextoAutenticado;
  acao: string;
  descricao: string;
  registroId?: number | null;
  detalhes: Record<string, unknown>;
  status?: "SUCESSO" | "ERRO" | "ALERTA";
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
        "Alerta Intermunicipal de Veículo",
      acao,
      descricao,
      registro_id:
        registroId
          ? String(
              registroId
            )
          : null,
      tabela:
        "veiculos_abordados",
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
  placa,
  municipioId,
}: {
  placa: string;
  municipioId: number;
}) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from(
      "veiculos_abordados"
    )
    .select(
      `
        id,
        municipio_id,
        placa,
        data,
        hora,
        situacao,
        motivo_abordagem,
        desfecho,
        nivel_alerta,
        criado_em
      `
    )
    .eq(
      "placa",
      placa
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
    .limit(25);

  if (error) {
    throw error;
  }

  const registros =
    (data || []) as
      RegistroVeiculoRede[];

  const municipiosIds =
    Array.from(
      new Set(
        registros
          .map(
            (registro) =>
              Number(
                registro.municipio_id
              )
          )
          .filter(
            (id) =>
              Number.isSafeInteger(
                id
              ) &&
              id > 0
          )
      )
    );

  if (
    municipiosIds.length === 0
  ) {
    return {
      alerta: false,
      total_registros: 0,
      total_municipios: 0,
      ultimo_registro: null,
      registros: [],
    };
  }

  const {
    data: municipios,
    error: municipiosError,
  } = await supabaseAdmin
    .from("municipios")
    .select(
      "id,nome,estado,ativo"
    )
    .in(
      "id",
      municipiosIds
    )
    .eq(
      "ativo",
      true
    );

  if (municipiosError) {
    throw municipiosError;
  }

  const mapaMunicipios =
    new Map<
      number,
      Municipio
    >(
      (
        (municipios || []) as
          Municipio[]
      ).map(
        (municipio) => [
          Number(
            municipio.id
          ),
          municipio,
        ]
      )
    );

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

          const nivel =
            texto(
              registro.nivel_alerta,
              30,
              "INFORMATIVO"
            ).toUpperCase();

          return {
            id:
              registro.id,
            municipio_id:
              registro.municipio_id,
            municipio:
              texto(
                municipio.nome,
                200,
                "Município"
              ),
            estado:
              texto(
                municipio.estado,
                10
              ),
            data:
              registro.data ||
              null,
            hora:
              registro.hora ||
              null,
            motivo:
              texto(
                registro.motivo_abordagem,
                300
              ) ||
              texto(
                registro.situacao,
                120,
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
                nivel
              )
                ? nivel
                : "INFORMATIVO",
          };
        }
      )
      .filter(Boolean);

  const totalMunicipios =
    new Set(
      resumo.map(
        (registro) =>
          registro?.municipio_id
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
      resumo[0] || null,
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
            "Você não possui permissão para consultar alertas de veículos.",
        },
        403
      );
    }

    const placa =
      normalizarPlaca(
        request.nextUrl
          .searchParams
          .get("placa")
      );

    if (!placa) {
      return responder(
        {
          ok: false,
          erro:
            "Informe uma placa válida.",
        },
        422
      );
    }

    const alerta =
      await buscarAlertaIntermunicipal({
        placa,
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
            ? `Consultou a placa ${placa} e encontrou registro em outro município.`
            : `Consultou a placa ${placa} sem registro em outro município.`,
        detalhes: {
          placa,
          total_registros:
            alerta.total_registros,
          total_municipios:
            alerta.total_municipios,
          municipios:
            alerta.registros.map(
              (registro) =>
                `${registro?.municipio}-${registro?.estado}`
            ),
        },
        status:
          alerta.alerta
            ? "ALERTA"
            : "SUCESSO",
      });

    if (auditoriaError) {
      console.error(
        "Erro ao auditar consulta intermunicipal:",
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
        placa,
        ...alerta,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado ao consultar alerta intermunicipal:",
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
          "Erro interno ao consultar a rede de veículos.",
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
            "Você não possui permissão para registrar abordagens de veículos.",
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

    const placa =
      normalizarPlaca(
        corpo.placa
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

    if (
      !placa ||
      !local ||
      !motivo
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Informe placa, local e motivo da abordagem.",
        },
        422
      );
    }

    const alertaAnterior =
      await buscarAlertaIntermunicipal({
        placa,
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
            `Alerta intermunicipal exibido antes do registro da placa ${placa}.`,
          detalhes: {
            placa,
            total_registros:
              alertaAnterior.total_registros,
            total_municipios:
              alertaAnterior.total_municipios,
          },
          status: "ALERTA",
        });

      if (auditoriaError) {
        console.error(
          "Erro ao auditar alerta anterior:",
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
          placa,
          ...alertaAnterior,
        },
        409
      );
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
        "veiculos_abordados"
      )
      .insert({
        municipio_id:
          autenticacao
            .contexto
            .municipioId,
        placa,
        tipo_especie:
          texto(
            corpo.tipo_especie,
            120
          ) || null,
        marca:
          texto(
            corpo.marca,
            120
          ) || null,
        modelo:
          texto(
            corpo.modelo,
            120
          ) || null,
        cor:
          texto(
            corpo.cor,
            80
          ) || null,
        ano:
          texto(
            corpo.ano,
            10
          ) || null,
        renavam:
          texto(
            corpo.renavam,
            20
          ) || null,
        chassi:
          texto(
            corpo.chassi,
            30
          ) || null,
        proprietario:
          texto(
            corpo.proprietario,
            200
          ) || null,
        cpf_proprietario:
          texto(
            corpo.cpf_proprietario,
            30
          ) || null,
        condutor:
          texto(
            corpo.condutor,
            200
          ) || null,
        documento_condutor:
          texto(
            corpo.documento_condutor,
            50
          ) || null,
        situacao:
          texto(
            corpo.situacao,
            100,
            "ABORDADO"
          ),
        local,
        data:
          dataHora.data,
        hora:
          dataHora.hora,
        observacao:
          texto(
            corpo.observacao,
            5000
          ) || null,
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
        criado_por:
          autenticacao
            .contexto
            .usuario.auth_id ||
          null,
        criado_em:
          new Date()
            .toISOString(),
        atualizado_em:
          new Date()
            .toISOString(),
      })
      .select(
        `
          id,
          municipio_id,
          placa,
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
        "Erro ao registrar abordagem de veículo:",
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
          placa,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível registrar a abordagem do veículo.",
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
          "CRIAR_ABORDAGEM_VEICULO",
        descricao:
          `Registrou abordagem do veículo ${placa}.`,
        registroId:
          Number(
            registro.id
          ),
        detalhes: {
          placa,
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
            alertaAnterior.total_registros,
          total_municipios_anteriores:
            alertaAnterior.total_municipios,
        },
      });

    if (auditoriaError) {
      console.error(
        "Erro ao auditar abordagem de veículo:",
        auditoriaError.message
      );

      await supabaseAdmin
        .from(
          "veiculos_abordados"
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
      "Erro inesperado ao registrar abordagem de veículo:",
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
          "Erro interno ao registrar a abordagem do veículo.",
      },
      500
    );
  }
}
