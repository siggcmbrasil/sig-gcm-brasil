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

type PermissaoModulo = {
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
  permissoes: PermissaoModulo;
};

type AutenticacaoFalha = {
  ok: false;
  resposta: NextResponse;
};

type CoordenadasFinais = {
  latitude: number | null;
  longitude: number | null;
  precisao: number | null;
  velocidade: number | null;
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

function texto(
  valor: unknown,
  limite = 500
) {
  return String(valor ?? "")
    .trim()
    .slice(0, limite);
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

function numeroOpcional(
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
    request.headers.get(
      "user-agent"
    ) ||
    "Não identificado"
  ).slice(0, 500);
}

function lerCoordenadas(
  corpo: Record<string, unknown>
): CoordenadasFinais | {
  erro: string;
} {
  const latitudeInformada =
    corpo.latitude !== null &&
    corpo.latitude !== undefined &&
    corpo.latitude !== "";

  const longitudeInformada =
    corpo.longitude !== null &&
    corpo.longitude !== undefined &&
    corpo.longitude !== "";

  const latitude =
    numeroOpcional(
      corpo.latitude,
      -90,
      90
    );

  const longitude =
    numeroOpcional(
      corpo.longitude,
      -180,
      180
    );

  if (
    latitudeInformada &&
    latitude === null
  ) {
    return {
      erro:
        "A latitude informada é inválida.",
    };
  }

  if (
    longitudeInformada &&
    longitude === null
  ) {
    return {
      erro:
        "A longitude informada é inválida.",
    };
  }

  if (
    (latitude === null) !==
    (longitude === null)
  ) {
    return {
      erro:
        "Informe latitude e longitude juntas.",
    };
  }

  const precisao =
    numeroOpcional(
      corpo.precisao,
      0,
      100000
    );

  const velocidade =
    numeroOpcional(
      corpo.velocidade,
      0,
      1000
    );

  return {
    latitude,
    longitude,
    precisao,
    velocidade,
  };
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
        error,
      } = await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq(
          "id",
          municipioParametro
        )
        .maybeSingle();

      if (error) {
        console.error(
          "Erro ao validar município do patrulhamento:",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
        );
      }

      if (municipio) {
        municipioId =
          municipioParametro;
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
          "Erro ao localizar município padrão do patrulhamento:",
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
  | AutenticacaoSucesso
  | AutenticacaoFalha
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
      "Erro ao validar usuário do patrulhamento:",
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

  let permissoes: PermissaoModulo = {
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
      .maybeSingle<PermissaoModulo>();

    if (permissaoError) {
      console.error(
        "Erro ao validar permissões do patrulhamento:",
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

    permissoes = permissao || {
      pode_ver: false,
      pode_criar: false,
      pode_editar: false,
      pode_excluir: false,
    };
  }

  if (!permissoes.pode_ver) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para visualizar patrulhamentos.",
        },
        403
      ),
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

async function auditar({
  request,
  autenticacao,
  acao,
  descricao,
  registroId,
  detalhes,
}: {
  request: NextRequest;
  autenticacao:
    AutenticacaoSucesso;
  acao: string;
  descricao: string;
  registroId:
    string | number | null;
  detalhes?: Record<
    string,
    unknown
  >;
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
        status:
          "SUCESSO",
        ip: obterIp(request),
        dispositivo:
          obterDispositivo(
            request
          ),
        tabela:
          "patrulhamentos",
        registro_id:
          registroId === null
            ? null
            : String(registroId),
        detalhes:
          detalhes || {},
      });

  if (error) {
    console.error(
      "Erro ao registrar auditoria do patrulhamento:",
      {
        message:
          error.message,
        details:
          error.details,
        hint:
          error.hint,
        code:
          error.code,
        acao,
        registro_id:
          registroId,
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
      .from("patrulhamentos")
      .select(
        `
          id,
          municipio_id,
          data,
          hora,
          local,
          guarda,
          equipe,
          viatura,
          latitude,
          longitude,
          observacao,
          status,
          finalizado_em
        `
      )
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .order("id", {
        ascending: false,
      })
      .limit(300);

    if (error) {
      console.error(
        "Erro ao carregar patrulhamentos:",
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
            "Não foi possível carregar os patrulhamentos.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao: "ACESSO",
      descricao:
        "Acessou a Central de Patrulhamento.",
      registroId: null,
      detalhes: {
        total_registros:
          data?.length || 0,
      },
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
        patrulhamentos:
          data || [],
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no GET /api/patrulhamento:",
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
          "Erro interno ao carregar os patrulhamentos.",
      },
      500
    );
  }
}

export async function PATCH(
  request: NextRequest
) {
  let pontoFinalId:
    number | null = null;

  try {
    const autenticacao =
      await autenticar(request);

    if (!autenticacao.ok) {
      return autenticacao.resposta;
    }

    if (
      !autenticacao.permissoes
        .pode_editar
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para finalizar patrulhamentos.",
        },
        403
      );
    }

    const corpo = (await request
      .json()
      .catch(
        () => null
      )) as Record<
      string,
      unknown
    > | null;

    if (!corpo) {
      return responder(
        {
          ok: false,
          erro:
            "Dados da finalização não informados.",
        },
        400
      );
    }

    const id = numeroId(
      corpo.id
    );

    if (!id) {
      return responder(
        {
          ok: false,
          erro:
            "Patrulhamento inválido.",
        },
        400
      );
    }

    const coordenadas =
      lerCoordenadas(corpo);

    if ("erro" in coordenadas) {
      return responder(
        {
          ok: false,
          erro:
            coordenadas.erro,
        },
        400
      );
    }

    const {
      data: patrulhamento,
      error:
        patrulhamentoError,
    } = await supabaseAdmin
      .from("patrulhamentos")
      .select(
        `
          id,
          status,
          guarda,
          equipe,
          viatura
        `
      )
      .eq("id", id)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .maybeSingle();

    if (patrulhamentoError) {
      console.error(
        "Erro ao localizar patrulhamento para finalização:",
        {
          message:
            patrulhamentoError.message,
          details:
            patrulhamentoError.details,
          hint:
            patrulhamentoError.hint,
          code:
            patrulhamentoError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar o patrulhamento.",
        },
        500
      );
    }

    if (!patrulhamento) {
      return responder(
        {
          ok: false,
          erro:
            "Patrulhamento não encontrado neste município.",
        },
        404
      );
    }

    if (
      texto(
        patrulhamento.status,
        30
      ).toUpperCase() ===
      "FINALIZADO"
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Este patrulhamento já está finalizado.",
        },
        409
      );
    }

    if (
      coordenadas.latitude !==
        null &&
      coordenadas.longitude !==
        null
    ) {
      const {
        data: pontoFinal,
        error:
          pontoFinalError,
      } = await supabaseAdmin
        .from(
          "gps_patrulhamento"
        )
        .insert({
          municipio_id:
            autenticacao.municipioId,
          patrulhamento_id: id,
          guarda_id:
            autenticacao.usuario.id,
          viatura_id: null,
          latitude:
            coordenadas.latitude,
          longitude:
            coordenadas.longitude,
          velocidade:
            coordenadas.velocidade,
          precisao:
            coordenadas.precisao,
          tipo: "FINAL",
          observacao:
            "Ponto final do patrulhamento",
          criado_em:
            new Date().toISOString(),
        })
        .select("id")
        .single();

      if (
        pontoFinalError ||
        !pontoFinal
      ) {
        console.error(
          "Erro ao salvar ponto final do patrulhamento:",
          {
            message:
              pontoFinalError?.message,
            details:
              pontoFinalError?.details,
            hint:
              pontoFinalError?.hint,
            code:
              pontoFinalError?.code,
            patrulhamento_id:
              id,
          }
        );

        return responder(
          {
            ok: false,
            erro:
              "Não foi possível salvar o ponto final do patrulhamento.",
          },
          500
        );
      }

      pontoFinalId = Number(
        pontoFinal.id
      );
    }

    const finalizadoEm =
      new Date().toISOString();

    const {
      data: atualizado,
      error:
        atualizacaoError,
    } = await supabaseAdmin
      .from("patrulhamentos")
      .update({
        status:
          "FINALIZADO",
        finalizado_em:
          finalizadoEm,
      })
      .eq("id", id)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .select(
        `
          id,
          status,
          finalizado_em
        `
      )
      .single();

    if (
      atualizacaoError ||
      !atualizado
    ) {
      if (pontoFinalId) {
        const {
          error:
            rollbackError,
        } = await supabaseAdmin
          .from(
            "gps_patrulhamento"
          )
          .delete()
          .eq(
            "id",
            pontoFinalId
          )
          .eq(
            "municipio_id",
            autenticacao.municipioId
          );

        if (rollbackError) {
          console.error(
            "Erro ao desfazer ponto final após falha na finalização:",
            {
              message:
                rollbackError.message,
              details:
                rollbackError.details,
              hint:
                rollbackError.hint,
              code:
                rollbackError.code,
              ponto_final_id:
                pontoFinalId,
            }
          );
        }
      }

      console.error(
        "Erro ao finalizar patrulhamento:",
        {
          message:
            atualizacaoError?.message,
          details:
            atualizacaoError?.details,
          hint:
            atualizacaoError?.hint,
          code:
            atualizacaoError?.code,
          patrulhamento_id:
            id,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível finalizar o patrulhamento.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao:
        "FINALIZAR",
      descricao:
        `Finalizou o patrulhamento ${id}.`,
      registroId: id,
      detalhes: {
        gps_final_registrado:
          pontoFinalId !== null,
        ponto_final_id:
          pontoFinalId,
        latitude:
          coordenadas.latitude,
        longitude:
          coordenadas.longitude,
        precisao:
          coordenadas.precisao,
        finalizado_em:
          finalizadoEm,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Patrulhamento finalizado com sucesso.",
        patrulhamento:
          atualizado,
        gps_final_registrado:
          pontoFinalId !== null,
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no PATCH /api/patrulhamento:",
      {
        message:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
        ponto_final_id:
          pontoFinalId,
        error,
      }
    );

    return responder(
      {
        ok: false,
        erro:
          "Erro interno ao finalizar o patrulhamento.",
      },
      500
    );
  }
}

export async function DELETE(
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
        .pode_excluir
    ) {
      return responder(
        {
          ok: false,
          erro:
            "Você não possui permissão para excluir patrulhamentos.",
        },
        403
      );
    }

    const corpo = (await request
      .json()
      .catch(
        () => null
      )) as Record<
      string,
      unknown
    > | null;

    const id = numeroId(
      corpo?.id
    );

    const motivo = texto(
      corpo?.motivo,
      1000
    );

    if (!id) {
      return responder(
        {
          ok: false,
          erro:
            "Patrulhamento inválido.",
        },
        400
      );
    }

    if (motivo.length < 3) {
      return responder(
        {
          ok: false,
          erro:
            "Informe o motivo da exclusão.",
        },
        400
      );
    }

    const {
      data: patrulhamento,
      error:
        patrulhamentoError,
    } = await supabaseAdmin
      .from("patrulhamentos")
      .select(
        `
          id,
          data,
          hora,
          local,
          guarda,
          equipe,
          viatura,
          status
        `
      )
      .eq("id", id)
      .eq(
        "municipio_id",
        autenticacao.municipioId
      )
      .maybeSingle();

    if (patrulhamentoError) {
      console.error(
        "Erro ao localizar patrulhamento antes da exclusão:",
        {
          message:
            patrulhamentoError.message,
          details:
            patrulhamentoError.details,
          hint:
            patrulhamentoError.hint,
          code:
            patrulhamentoError.code,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            "Não foi possível localizar o patrulhamento.",
        },
        500
      );
    }

    if (!patrulhamento) {
      return responder(
        {
          ok: false,
          erro:
            "Patrulhamento não encontrado neste município.",
        },
        404
      );
    }

    const { error } =
      await supabaseAdmin
        .from("patrulhamentos")
        .delete()
        .eq("id", id)
        .eq(
          "municipio_id",
          autenticacao.municipioId
        );

    if (error) {
      console.error(
        "Erro ao excluir patrulhamento:",
        {
          message:
            error.message,
          details:
            error.details,
          hint:
            error.hint,
          code:
            error.code,
          patrulhamento_id:
            id,
          municipio_id:
            autenticacao.municipioId,
        }
      );

      return responder(
        {
          ok: false,
          erro:
            error.code === "23503"
              ? "Este patrulhamento possui registros vinculados e não pode ser excluído."
              : "Não foi possível excluir o patrulhamento.",
        },
        500
      );
    }

    await auditar({
      request,
      autenticacao,
      acao:
        "EXCLUIR",
      descricao:
        `Excluiu o patrulhamento ${id}.`,
      registroId: id,
      detalhes: {
        motivo,
        data:
          patrulhamento.data,
        hora:
          patrulhamento.hora,
        local:
          patrulhamento.local,
        guarda:
          patrulhamento.guarda,
        equipe:
          patrulhamento.equipe,
        viatura:
          patrulhamento.viatura,
        status:
          patrulhamento.status,
      },
    });

    return responder(
      {
        ok: true,
        mensagem:
          "Patrulhamento excluído com sucesso.",
      },
      200
    );
  } catch (error) {
    console.error(
      "Erro inesperado no DELETE /api/patrulhamento:",
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
          "Erro interno ao excluir o patrulhamento.",
      },
      500
    );
  }
}