import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  supabaseAdmin,
} from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERFIS_COMANDO = new Set([
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
]);

type UsuarioSistema = {
  id: number;
  nome: string | null;
  email: string | null;
  cpf: string | null;
  matricula: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
  guarda_id: number | null;
};

type Guarda = {
  id: number;
  nome: string;
  matricula: string | null;
  cpf: string | null;
  email: string | null;
  cargo: string | null;
  status: string | null;
  ativo: boolean | null;
};

type EscalaServico = {
  id: number;
  data_servico: string;
  turno: string | null;
  guarda_id: number | null;
  guarda_nome: string | null;
  matricula: string | null;
  equipe: string | null;
  funcao: string | null;
};

type ContextoAutenticado = {
  ok: true;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  comando: boolean;
};

type ContextoNegado = {
  ok: false;
  resposta: NextResponse;
};

type ResultadoAutenticacao =
  | ContextoAutenticado
  | ContextoNegado;

function responder(
  corpo: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json(corpo, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function tokenBearer(
  request: NextRequest
) {
  const cabecalho =
    request.headers.get(
      "authorization"
    );

  if (
    !cabecalho?.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  return cabecalho
    .slice(7)
    .trim();
}

function numeroId(
  valor: unknown
) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) &&
    numero > 0
    ? numero
    : null;
}

function texto(
  valor: unknown
) {
  return String(valor ?? "").trim();
}

function normalizar(
  valor: unknown
) {
  return texto(valor).toUpperCase();
}

function dataHoje() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

async function autenticar(
  request: NextRequest
): Promise<ResultadoAutenticacao> {
  const token = tokenBearer(request);

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
    data: { user },
    error: authError,
  } =
    await supabaseAdmin.auth.getUser(
      token
    );

  if (
    authError ||
    !user
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
    data,
    error,
  } = await supabaseAdmin
    .from("usuarios")
    .select(
      "id,nome,email,cpf,matricula,perfil,status,municipio_id,guarda_id"
    )
    .eq("auth_id", user.id)
    .maybeSingle();

  const usuario = data as
    | UsuarioSistema
    | null;

  if (
    error ||
    !usuario
  ) {
    console.error(
      "Erro ao validar usuário em permutas:",
      error
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

  const perfil = normalizar(
    usuario.perfil
  );

  let municipioId = numeroId(
    usuario.municipio_id
  );

  if (
    perfil ===
    "DESENVOLVEDOR"
  ) {
    municipioId = numeroId(
      request.nextUrl.searchParams.get(
        "municipio_id"
      )
    );
  }

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

  return {
    ok: true,
    usuario,
    perfil,
    municipioId,
    comando:
      PERFIS_COMANDO.has(perfil),
  };
}

async function localizarGuarda(
  usuario: UsuarioSistema,
  municipioId: number
) {
  const guardaId =
    numeroId(usuario.guarda_id);

  if (!guardaId) {
    return null;
  }

  const {
    data,
    error,
  } = await supabaseAdmin
    .from("guardas")
    .select(
      "id,nome,matricula,cpf,email,cargo,status,ativo"
    )
    .eq("id", guardaId)
    .eq(
      "municipio_id",
      municipioId
    )
    .maybeSingle();

  if (error) {
    console.error(
      "Erro ao localizar guarda pelo vínculo direto:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        usuario_id: usuario.id,
        guarda_id: guardaId,
        municipio_id: municipioId,
      }
    );

    throw error;
  }

  return data
    ? (data as Guarda)
    : null;
}

async function buscarPermuta(
  id: number,
  municipioId: number
) {
  const {
    data,
    error,
  } = await supabaseAdmin
    .from("permutas_plantao")
    .select("*")
    .eq("id", id)
    .eq(
      "municipio_id",
      municipioId
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function auditarPermuta({
  request,
  usuario,
  perfil,
  municipioId,
  acao,
  descricao,
  registroId,
  detalhes,
}: {
  request: NextRequest;
  usuario: UsuarioSistema;
  perfil: string;
  municipioId: number;
  acao: string;
  descricao: string;
  registroId: number | null;
  detalhes?: Record<string, unknown>;
}) {
  const encaminhado =
    request.headers.get("x-vercel-forwarded-for") ||
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "Não identificado";

  const ip = encaminhado
    .split(",")[0]
    .trim()
    .slice(0, 64);

  const dispositivo = (
    request.headers.get("user-agent") ||
    "Não identificado"
  ).slice(0, 500);

  const { error } = await supabaseAdmin
    .from("auditoria")
    .insert({
      municipio_id: municipioId,
      guarda_id: usuario.guarda_id || null,
      usuario_nome: usuario.nome || "Usuário",
      usuario_email: usuario.email || "",
      perfil,
      modulo: "Permutas de Plantão",
      acao,
      descricao,
      status: "SUCESSO",
      ip,
      dispositivo,
      tabela: "permutas_plantao",
      registro_id:
        registroId === null
          ? null
          : String(registroId),
      detalhes: detalhes || {},
    });

  if (error) {
    console.error(
      "Ação da permuta concluída, mas a auditoria falhou:",
      {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        acao,
        registro_id: registroId,
        usuario_id: usuario.id,
        municipio_id: municipioId,
      }
    );
  }
}

export async function GET(
  request: NextRequest
) {
  const contexto =
    await autenticar(request);

  if (!contexto.ok) {
    return contexto.resposta;
  }

  const {
    usuario,
    perfil,
    municipioId,
    comando,
  } = contexto;

  try {
    const guardaAtual =
      await localizarGuarda(
        usuario,
        municipioId
      );

    const [
      guardasResposta,
      escalasResposta,
    ] = await Promise.all([
      supabaseAdmin
        .from("guardas")
        .select(
          "id,nome,matricula,cargo,status,ativo"
        )
        .eq(
          "municipio_id",
          municipioId
        )
        .order("nome"),
      supabaseAdmin
        .from("escalas_servico")
        .select(
          "id,data_servico,turno,guarda_id,guarda_nome,matricula,equipe,funcao"
        )
        .eq(
          "municipio_id",
          municipioId
        )
        .gte(
          "data_servico",
          dataHoje()
        )
        .order("data_servico", {
          ascending: true,
        })
        .limit(2000),
    ]);

    if (guardasResposta.error) {
      throw guardasResposta.error;
    }

    if (escalasResposta.error) {
      throw escalasResposta.error;
    }

    let consultaPermutas =
      supabaseAdmin
        .from("permutas_plantao")
        .select("*")
        .eq(
          "municipio_id",
          municipioId
        )
        .order("criado_em", {
          ascending: false,
        })
        .limit(300);

    if (
      !comando &&
      guardaAtual
    ) {
      consultaPermutas =
        consultaPermutas.or(
          `guarda_solicitante_id.eq.${guardaAtual.id},guarda_substituto_id.eq.${guardaAtual.id}`
        );
    }

    if (
      !comando &&
      !guardaAtual
    ) {
      return responder({
        ok: true,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          perfil,
          comando,
        },
        municipio_id:
          municipioId,
        guarda_atual: null,
        guardas:
          guardasResposta.data || [],
        escalas:
          escalasResposta.data || [],
        permutas: [],
        historico: [],
        aviso:
          "Seu usuário ainda não possui vínculo funcional em usuarios.guarda_id.",
      });
    }

    const {
      data: permutas,
      error: permutasError,
    } = await consultaPermutas;

    if (permutasError) {
      throw permutasError;
    }

    const ids = (permutas || [])
      .map((item) =>
        numeroId(item.id)
      )
      .filter(
        (id): id is number =>
          Boolean(id)
      );

    let historico: Record<
      string,
      unknown
    >[] = [];

    if (ids.length) {
      const {
        data,
        error,
      } = await supabaseAdmin
        .from(
          "permutas_plantao_historico"
        )
        .select("*")
        .in("permuta_id", ids)
        .order("criado_em", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      historico = data || [];
    }

    return responder({
      ok: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        perfil,
        comando,
      },
      municipio_id:
        municipioId,
      guarda_atual:
        guardaAtual,
      guardas:
        guardasResposta.data || [],
      escalas:
        escalasResposta.data || [],
      permutas:
        permutas || [],
      historico,
    });
  } catch (error) {
    console.error(
      "Erro ao carregar permutas:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          "Não foi possível carregar as permutas.",
      },
      500
    );
  }
}

export async function POST(
  request: NextRequest
) {
  const contexto =
    await autenticar(request);

  if (!contexto.ok) {
    return contexto.resposta;
  }

const {
  usuario,
  perfil,
  municipioId,
  comando,
} = contexto;

  let corpo: Record<
    string,
    unknown
  >;

  try {
    corpo = await request.json();
  } catch {
    return responder(
      {
        ok: false,
        erro:
          "Corpo da requisição inválido.",
      },
      400
    );
  }

  const acao = normalizar(
    corpo.acao
  );

  try {
    const guardaAtual =
      await localizarGuarda(
        usuario,
        municipioId
      );

    if (acao === "SOLICITAR") {
      if (!guardaAtual) {
        return responder(
          {
            ok: false,
            erro:
              "Seu usuário não está vinculado a um guarda.",
          },
          422
        );
      }

      const escalaOrigemId =
        numeroId(
          corpo.escala_origem_id
        );
      const escalaTrocaId =
        numeroId(
          corpo.escala_troca_id
        );
      const motivo = texto(
        corpo.motivo
      );

      if (
        !escalaOrigemId ||
        !escalaTrocaId
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Selecione os dois plantões da permuta.",
          },
          422
        );
      }

      if (
        escalaOrigemId ===
        escalaTrocaId
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Selecione plantões diferentes.",
          },
          422
        );
      }

      if (motivo.length < 5) {
        return responder(
          {
            ok: false,
            erro:
              "Informe o motivo da permuta.",
          },
          422
        );
      }

      const {
        data: escalas,
        error: escalasError,
      } = await supabaseAdmin
        .from("escalas_servico")
        .select(
          "id,data_servico,turno,guarda_id,guarda_nome,matricula"
        )
        .eq(
          "municipio_id",
          municipioId
        )
        .in("id", [
          escalaOrigemId,
          escalaTrocaId,
        ]);

      if (escalasError) {
        throw escalasError;
      }

      const origem = (
        escalas || []
      ).find(
        (item) =>
          item.id ===
          escalaOrigemId
      ) as
        | EscalaServico
        | undefined;

      const troca = (
        escalas || []
      ).find(
        (item) =>
          item.id ===
          escalaTrocaId
      ) as
        | EscalaServico
        | undefined;

      if (!origem || !troca) {
        return responder(
          {
            ok: false,
            erro:
              "Um dos plantões não foi encontrado.",
          },
          404
        );
      }

      if (
        origem.guarda_id !==
        guardaAtual.id
      ) {
        return responder(
          {
            ok: false,
            erro:
              "O plantão original precisa pertencer ao solicitante.",
          },
          403
        );
      }

      if (
        !troca.guarda_id ||
        troca.guarda_id ===
          guardaAtual.id
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Selecione o plantão de outro guarda.",
          },
          422
        );
      }

      if (
        origem.data_servico ===
        troca.data_servico
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Os plantões precisam ocorrer em datas diferentes.",
          },
          422
        );
      }

      const {
        data: conflito,
        error: conflitoError,
      } = await supabaseAdmin
        .from("permutas_plantao")
        .select("id")
        .eq(
          "municipio_id",
          municipioId
        )
        .in("status", [
          "AGUARDANDO_SUBSTITUTO",
          "ACEITA_PELO_SUBSTITUTO",
        ])
        .or(
          `escala_origem_id.in.(${escalaOrigemId},${escalaTrocaId}),escala_troca_id.in.(${escalaOrigemId},${escalaTrocaId})`
        )
        .limit(1)
        .maybeSingle();

      if (conflitoError) {
        throw conflitoError;
      }

      if (conflito) {
        return responder(
          {
            ok: false,
            erro:
              "Um dos plantões já está envolvido em outra permuta pendente.",
          },
          409
        );
      }

      const {
        data: criada,
        error: inserirError,
      } = await supabaseAdmin
        .from("permutas_plantao")
        .insert({
          municipio_id:
            municipioId,
          tipo_solicitacao:
            "PERMUTA",
          origem: "SOLICITADA",
          data_original:
            origem.data_servico,
          data_troca:
            troca.data_servico,
          escala_origem_id:
            origem.id,
          escala_troca_id:
            troca.id,
          guarda_solicitante_id:
            origem.guarda_id,
          guarda_substituto_id:
            troca.guarda_id,
          motivo,
          status:
            "AGUARDANDO_SUBSTITUTO",
          criado_por_usuario_id:
            usuario.id,
        })
        .select("id,status")
        .single();

      if (inserirError) {
        throw inserirError;
      }

      await auditarPermuta({
        request,
        usuario,
        perfil,
        municipioId,
        acao: "SOLICITAR",
        descricao: `Criou a solicitação de permuta ${criada.id}.`,
        registroId: numeroId(criada.id),
        detalhes: {
          escala_origem_id: origem.id,
          escala_troca_id: troca.id,
          guarda_solicitante_id: origem.guarda_id,
          guarda_substituto_id: troca.guarda_id,
          motivo,
          status: "AGUARDANDO_SUBSTITUTO",
        },
      });

      return responder(
        {
          ok: true,
          mensagem:
            "Solicitação enviada ao guarda substituto.",
          permuta: criada,
        },
        201
      );
    }

    if (acao === "RESPONDER") {
      if (!guardaAtual) {
        return responder(
          {
            ok: false,
            erro:
              "Seu usuário não está vinculado a um guarda.",
          },
          422
        );
      }

      const permutaId = numeroId(
        corpo.permuta_id
      );
      const resposta =
        normalizar(corpo.resposta);
      const motivo = texto(
        corpo.motivo
      );

      if (!permutaId) {
        return responder(
          {
            ok: false,
            erro:
              "Permuta inválida.",
          },
          422
        );
      }

      if (
        ![
          "ACEITA",
          "RECUSADA",
        ].includes(resposta)
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Resposta inválida.",
          },
          422
        );
      }

      if (
        resposta === "RECUSADA" &&
        motivo.length < 3
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Informe o motivo da recusa.",
          },
          422
        );
      }

      const permuta =
        await buscarPermuta(
          permutaId,
          municipioId
        );

      if (!permuta) {
        return responder(
          {
            ok: false,
            erro:
              "Permuta não encontrada.",
          },
          404
        );
      }

      if (
        permuta.guarda_substituto_id !==
        guardaAtual.id
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Somente o guarda substituto pode responder.",
          },
          403
        );
      }

      if (
        permuta.status !==
        "AGUARDANDO_SUBSTITUTO"
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Esta solicitação já foi respondida.",
          },
          409
        );
      }

      const status =
        resposta === "ACEITA"
          ? "ACEITA_PELO_SUBSTITUTO"
          : "RECUSADA_PELO_SUBSTITUTO";

      const {
        data,
        error,
      } = await supabaseAdmin
        .from("permutas_plantao")
        .update({
          status,
          resposta_substituto:
            resposta,
          respondido_por_usuario_id:
            usuario.id,
          respondido_em:
            new Date().toISOString(),
          motivo_recusa_substituto:
            resposta === "RECUSADA"
              ? motivo
              : null,
        })
        .eq("id", permutaId)
        .eq(
          "municipio_id",
          municipioId
        )
        .eq(
          "status",
          "AGUARDANDO_SUBSTITUTO"
        )
        .select("id,status")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return responder(
          {
            ok: false,
            erro:
              "A permuta foi alterada por outro usuário. Atualize a tela.",
          },
          409
        );
      }

      await auditarPermuta({
        request,
        usuario,
        perfil,
        municipioId,
        acao:
          resposta === "ACEITA"
            ? "ACEITAR"
            : "RECUSAR",
        descricao:
          resposta === "ACEITA"
            ? `Aceitou a permuta ${permutaId}.`
            : `Recusou a permuta ${permutaId}.`,
        registroId: permutaId,
        detalhes: {
          resposta,
          motivo:
            resposta === "RECUSADA"
              ? motivo
              : null,
          status_novo: status,
          guarda_substituto_id: guardaAtual.id,
        },
      });

      return responder({
        ok: true,
        mensagem:
          resposta === "ACEITA"
            ? "Permuta aceita e enviada ao comando."
            : "Permuta recusada.",
        permuta: data,
      });
    }

    if (acao === "DECIDIR") {
      if (!comando) {
        return responder(
          {
            ok: false,
            erro:
              "Somente o comando pode decidir a permuta.",
          },
          403
        );
      }

      const permutaId = numeroId(
        corpo.permuta_id
      );
      const decisao = normalizar(
        corpo.decisao
      );
      const motivo = texto(
        corpo.motivo
      );

      if (!permutaId) {
        return responder(
          {
            ok: false,
            erro:
              "Permuta inválida.",
          },
          422
        );
      }

      if (
        ![
          "APROVAR",
          "NEGAR",
        ].includes(decisao)
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Decisão inválida.",
          },
          422
        );
      }

      if (
        decisao === "NEGAR" &&
        motivo.length < 3
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Informe o motivo da negativa.",
          },
          422
        );
      }

      const {
        data,
        error,
      } = await supabaseAdmin.rpc(
        "processar_decisao_permuta",
        {
          p_permuta_id:
            permutaId,
          p_usuario_id:
            usuario.id,
          p_municipio_id:
            municipioId,
          p_aprovar:
            decisao === "APROVAR",
          p_motivo:
            motivo || null,
        }
      );

      if (error) {
        return responder(
          {
            ok: false,
            erro: error.message,
          },
          409
        );
      }

      await auditarPermuta({
        request,
        usuario,
        perfil,
        municipioId,
        acao:
          decisao === "APROVAR"
            ? "APROVAR"
            : "NEGAR",
        descricao:
          decisao === "APROVAR"
            ? `Aprovou a permuta ${permutaId} e atualizou as escalas.`
            : `Negou a permuta ${permutaId}.`,
        registroId: permutaId,
        detalhes: {
          decisao,
          motivo: motivo || null,
          resultado_rpc: data,
        },
      });

      return responder({
        ok: true,
        mensagem:
          decisao === "APROVAR"
            ? "Permuta aprovada e escalas atualizadas."
            : "Permuta negada pelo comando.",
        resultado: data,
      });
    }

    if (acao === "MANUAL") {
      if (!comando) {
        return responder(
          {
            ok: false,
            erro:
              "Somente o comando pode registrar permuta manual.",
          },
          403
        );
      }

      const escalaOrigemId =
        numeroId(
          corpo.escala_origem_id
        );
      const escalaTrocaId =
        numeroId(
          corpo.escala_troca_id
        );
      const motivo = texto(
        corpo.motivo
      );
      const observacao = texto(
        corpo.observacao
      );

      if (
        !escalaOrigemId ||
        !escalaTrocaId
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Selecione os dois plantões.",
          },
          422
        );
      }

      const {
        data,
        error,
      } = await supabaseAdmin.rpc(
        "registrar_permuta_manual",
        {
          p_municipio_id:
            municipioId,
          p_usuario_id:
            usuario.id,
          p_escala_origem_id:
            escalaOrigemId,
          p_escala_troca_id:
            escalaTrocaId,
          p_motivo: motivo,
          p_observacao:
            observacao || null,
        }
      );

      if (error) {
        return responder(
          {
            ok: false,
            erro: error.message,
          },
          409
        );
      }

      const resultadoManual =
        data && typeof data === "object"
          ? (data as Record<string, unknown>)
          : null;

      const permutaManualId =
        numeroId(resultadoManual?.permuta_id);

      await auditarPermuta({
        request,
        usuario,
        perfil,
        municipioId,
        acao: "PERMUTA_MANUAL",
        descricao:
          permutaManualId
            ? `Registrou a permuta manual ${permutaManualId} e atualizou as escalas.`
            : "Registrou uma permuta manual e atualizou as escalas.",
        registroId: permutaManualId,
        detalhes: {
          escala_origem_id: escalaOrigemId,
          escala_troca_id: escalaTrocaId,
          motivo,
          observacao: observacao || null,
          resultado_rpc: data,
        },
      });

      return responder(
        {
          ok: true,
          mensagem:
            "Permuta manual registrada e escalas atualizadas.",
          resultado: data,
        },
        201
      );
    }

    if (acao === "CANCELAR") {
      const permutaId = numeroId(
        corpo.permuta_id
      );
      const motivo = texto(
        corpo.motivo
      );

      if (!permutaId) {
        return responder(
          {
            ok: false,
            erro:
              "Permuta inválida.",
          },
          422
        );
      }

      const permuta =
        await buscarPermuta(
          permutaId,
          municipioId
        );

      if (!permuta) {
        return responder(
          {
            ok: false,
            erro:
              "Permuta não encontrada.",
          },
          404
        );
      }

      const solicitante =
        guardaAtual &&
        permuta.guarda_solicitante_id ===
          guardaAtual.id;

      if (
        !solicitante &&
        !comando
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Você não pode cancelar esta permuta.",
          },
          403
        );
      }

      if (
        permuta.status !==
        "AGUARDANDO_SUBSTITUTO"
      ) {
        return responder(
          {
            ok: false,
            erro:
              "Somente solicitações ainda não respondidas podem ser canceladas.",
          },
          409
        );
      }

      const {
        data,
        error,
      } = await supabaseAdmin
        .from("permutas_plantao")
        .update({
          status: "CANCELADA",
          cancelado_por_usuario_id:
            usuario.id,
          cancelado_em:
            new Date().toISOString(),
          motivo_cancelamento:
            motivo ||
            "Cancelada pelo usuário.",
        })
        .eq("id", permutaId)
        .eq(
          "municipio_id",
          municipioId
        )
        .eq(
          "status",
          "AGUARDANDO_SUBSTITUTO"
        )
        .select("id,status")
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return responder(
          {
            ok: false,
            erro:
              "A permuta foi alterada por outro usuário. Atualize a tela.",
          },
          409
        );
      }

      await auditarPermuta({
        request,
        usuario,
        perfil,
        municipioId,
        acao: "CANCELAR",
        descricao: `Cancelou a permuta ${permutaId}.`,
        registroId: permutaId,
        detalhes: {
          motivo:
            motivo || "Cancelada pelo usuário.",
          status_anterior: permuta.status,
          status_novo: "CANCELADA",
        },
      });

      return responder({
        ok: true,
        mensagem:
          "Solicitação cancelada.",
        permuta: data,
      });
    }

    return responder(
      {
        ok: false,
        erro:
          "Ação não reconhecida.",
      },
      400
    );
  } catch (error) {
    console.error(
      "Erro ao processar permuta:",
      error
    );

    return responder(
      {
        ok: false,
        erro:
          error instanceof Error
            ? error.message
            : "Erro interno ao processar a permuta.",
      },
      500
    );
  }
}