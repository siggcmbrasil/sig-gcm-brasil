import { NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  CAMPOS_PERMISSAO,
  CampoPermissao,
  MODULOS_CATALOGO,
  PERFIS_EDITAVEIS,
  Perfil,
  perfilValido,
  podeGerenciarPerfil,
} from "@/lib/permissoes/catalogo";
import {
  autenticarGestorPermissoes,
  obterDispositivo,
  obterIp,
  responderPermissoes,
} from "@/lib/seguranca/permissoes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Permissao = {
  id: number;
  municipio_id: number;
  perfil: Perfil;
  modulo: string;
  pode_ver: boolean;
  pode_criar: boolean;
  pode_editar: boolean;
  pode_excluir: boolean;
};

type Municipio = {
  id: number;
  nome: string;
};

function inteiroPositivo(valor: unknown) {
  const numero = Number(valor);

  return Number.isSafeInteger(numero) && numero > 0
    ? numero
    : null;
}

function moduloValido(valor: unknown) {
  const modulo = String(valor || "")
    .trim()
    .toLowerCase();

  if (
    modulo.length < 2 ||
    modulo.length > 100 ||
    !/^[a-z0-9_]+$/.test(modulo)
  ) {
    return null;
  }

  return modulo;
}

async function listarMunicipiosPermitidos(
  perfilGestor: Perfil,
  municipioGestor: number | null
) {
  let query = supabaseAdmin
    .from("municipios")
    .select("id,nome")
    .eq("ativo", true)
    .order("nome");

  if (perfilGestor !== "DESENVOLVEDOR") {
    query = query.eq("id", municipioGestor);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Falha ao listar municípios: ${error.message}`
    );
  }

  return ((data || []) as Municipio[]).map(
    (item) => ({
      id: Number(item.id),
      nome: String(item.nome || ""),
    })
  );
}

function perfisPermitidos(gestor: Perfil) {
  return PERFIS_EDITAVEIS.filter((perfil) =>
    podeGerenciarPerfil(gestor, perfil)
  );
}

function escolherPerfil(
  solicitado: string | null,
  permitidos: Perfil[]
) {
  const normalizado = String(
    solicitado || ""
  ).toUpperCase();

  if (
    perfilValido(normalizado) &&
    permitidos.includes(normalizado)
  ) {
    return normalizado;
  }

  if (permitidos.includes("GUARDA")) {
    return "GUARDA";
  }

  return permitidos[permitidos.length - 1];
}

function escolherMunicipio(
  solicitado: number | null,
  municipios: Municipio[],
  municipioGestor: number | null
) {
  if (
    solicitado &&
    municipios.some(
      (municipio) => municipio.id === solicitado
    )
  ) {
    return solicitado;
  }

  if (
    municipioGestor &&
    municipios.some(
      (municipio) =>
        municipio.id === municipioGestor
    )
  ) {
    return municipioGestor;
  }

  return municipios[0]?.id || null;
}

export async function GET(request: NextRequest) {
  try {
    const autorizacao =
      await autenticarGestorPermissoes(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const gestor = autorizacao.gestor;
    const municipios =
      await listarMunicipiosPermitidos(
        gestor.perfil,
        gestor.usuario.municipio_id
      );

    if (municipios.length === 0) {
      return responderPermissoes(
        {
          ok: false,
          erro: "Nenhum município ativo disponível.",
        },
        422
      );
    }

    const perfis = perfisPermitidos(gestor.perfil);

    if (perfis.length === 0) {
      return responderPermissoes(
        {
          ok: false,
          erro:
            "Seu perfil não possui perfis inferiores para administrar.",
        },
        403
      );
    }

    const municipioId = escolherMunicipio(
      inteiroPositivo(
        request.nextUrl.searchParams.get(
          "municipio_id"
        )
      ),
      municipios,
      gestor.usuario.municipio_id
    );

    const perfilSelecionado = escolherPerfil(
      request.nextUrl.searchParams.get("perfil"),
      perfis
    );

    if (!municipioId || !perfilSelecionado) {
      return responderPermissoes(
        {
          ok: false,
          erro: "Contexto de permissões inválido.",
        },
        422
      );
    }

    const [
      { data: permissoesData, error: permissoesError },
      { data: modulosData, error: modulosError },
    ] = await Promise.all([
      supabaseAdmin
        .from("permissoes_perfis")
        .select(
          "id,municipio_id,perfil,modulo,pode_ver,pode_criar,pode_editar,pode_excluir"
        )
        .eq("municipio_id", municipioId)
        .eq("perfil", perfilSelecionado)
        .order("modulo"),
      supabaseAdmin
        .from("permissoes_perfis")
        .select("modulo")
        .eq("municipio_id", municipioId),
    ]);

    if (permissoesError || modulosError) {
      console.error(
        `Erro ao carregar matriz: permissoes=${permissoesError?.message || "-"}; modulos=${modulosError?.message || "-"}`
      );

      return responderPermissoes(
        {
          ok: false,
          erro: "Não foi possível carregar as permissões.",
        },
        500
      );
    }

    const permissoes = (
      (permissoesData || []) as Permissao[]
    ).map((item) => ({
      ...item,
      id: Number(item.id),
      municipio_id: Number(item.municipio_id),
      perfil: String(
        item.perfil
      ).toUpperCase() as Perfil,
      modulo: String(item.modulo),
      pode_ver: Boolean(item.pode_ver),
      pode_criar: Boolean(item.pode_criar),
      pode_editar: Boolean(item.pode_editar),
      pode_excluir: Boolean(item.pode_excluir),
    }));

    const modulosDisponiveis = Array.from(
      new Set([
        ...MODULOS_CATALOGO,
        ...(modulosData || []).map(
          (item) => String(item.modulo || "")
        ),
      ])
    )
      .filter(Boolean)
      .sort();

    return responderPermissoes(
      {
        ok: true,
        contexto: {
          gestor_perfil: gestor.perfil,
          municipios,
          perfis,
          municipio_selecionado: municipioId,
          perfil_selecionado: perfilSelecionado,
        },
        permissoes,
        modulos_disponiveis: modulosDisponiveis,
      },
      200
    );
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido";

    console.error(
      `Erro inesperado ao carregar permissões: ${mensagem}`
    );

    return responderPermissoes(
      {
        ok: false,
        erro: "Erro interno ao carregar permissões.",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const autorizacao =
      await autenticarGestorPermissoes(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const gestor = autorizacao.gestor;
    const corpo = (await request.json().catch(
      () => null
    )) as {
      municipio_id?: unknown;
      perfil?: unknown;
      modulo?: unknown;
      campo?: unknown;
      valor?: unknown;
    } | null;

    if (!corpo) {
      return responderPermissoes(
        {
          ok: false,
          erro: "Dados da alteração inválidos.",
        },
        400
      );
    }

    const municipioId = inteiroPositivo(
      corpo.municipio_id
    );

    const perfilTexto = String(
      corpo.perfil || ""
    ).toUpperCase();

    const modulo = moduloValido(corpo.modulo);
    const campo = String(
      corpo.campo || ""
    ) as CampoPermissao;

    if (
      !municipioId ||
      !perfilValido(perfilTexto) ||
      !modulo ||
      !CAMPOS_PERMISSAO.includes(campo) ||
      typeof corpo.valor !== "boolean"
    ) {
      return responderPermissoes(
        {
          ok: false,
          erro: "Alteração de permissão inválida.",
        },
        422
      );
    }

    if (
      !podeGerenciarPerfil(
        gestor.perfil,
        perfilTexto
      )
    ) {
      return responderPermissoes(
        {
          ok: false,
          erro:
            "Não é permitido alterar um perfil igual ou superior ao seu.",
        },
        403
      );
    }

    if (
      gestor.perfil !== "DESENVOLVEDOR" &&
      gestor.usuario.municipio_id !== municipioId
    ) {
      return responderPermissoes(
        {
          ok: false,
          erro:
            "Não é permitido alterar permissões de outro município.",
        },
        403
      );
    }

    const { data: municipio, error: municipioError } =
      await supabaseAdmin
        .from("municipios")
        .select("id")
        .eq("id", municipioId)
        .eq("ativo", true)
        .maybeSingle();

    if (municipioError || !municipio) {
      return responderPermissoes(
        {
          ok: false,
          erro: "Município inválido ou inativo.",
        },
        422
      );
    }

    let moduloPermitido =
      MODULOS_CATALOGO.includes(modulo);

    if (!moduloPermitido) {
      const { data: moduloExistente } =
        await supabaseAdmin
          .from("permissoes_perfis")
          .select("id")
          .eq("municipio_id", municipioId)
          .eq("modulo", modulo)
          .limit(1)
          .maybeSingle();

      moduloPermitido = Boolean(moduloExistente);
    }

    if (!moduloPermitido) {
      return responderPermissoes(
        {
          ok: false,
          erro: "Módulo não reconhecido pelo sistema.",
        },
        422
      );
    }

    const { data: atual, error: atualError } =
      await supabaseAdmin
        .from("permissoes_perfis")
        .select(
          "id,municipio_id,perfil,modulo,pode_ver,pode_criar,pode_editar,pode_excluir"
        )
        .eq("municipio_id", municipioId)
        .eq("perfil", perfilTexto)
        .eq("modulo", modulo)
        .maybeSingle();

    if (atualError) {
      console.error(
        `Erro ao ler permissão atual: ${atualError.message}`
      );

      return responderPermissoes(
        {
          ok: false,
          erro: "Não foi possível validar a permissão atual.",
        },
        500
      );
    }

    const proxima = {
      pode_ver: Boolean(atual?.pode_ver),
      pode_criar: Boolean(atual?.pode_criar),
      pode_editar: Boolean(atual?.pode_editar),
      pode_excluir: Boolean(atual?.pode_excluir),
    };

    proxima[campo] = corpo.valor;

    if (
      campo !== "pode_ver" &&
      corpo.valor === true
    ) {
      proxima.pode_ver = true;
    }

    if (
      campo === "pode_ver" &&
      corpo.valor === false
    ) {
      proxima.pode_criar = false;
      proxima.pode_editar = false;
      proxima.pode_excluir = false;
    }

    const { data: atualizada, error: rpcError } =
      await supabaseAdmin.rpc(
        "sig_aplicar_permissao",
        {
          p_municipio_id: municipioId,
          p_perfil: perfilTexto,
          p_modulo: modulo,
          p_pode_ver: proxima.pode_ver,
          p_pode_criar: proxima.pode_criar,
          p_pode_editar: proxima.pode_editar,
          p_pode_excluir: proxima.pode_excluir,
          p_campo_alterado: campo,
          p_valor_alterado: corpo.valor,
          p_ator_usuario_id: gestor.usuario.id,
          p_ator_auth_id:
            gestor.usuario.auth_id,
          p_ator_perfil: gestor.perfil,
          p_ip: obterIp(request),
          p_dispositivo:
            obterDispositivo(request),
        }
      );

    if (rpcError) {
      console.error(
        `Erro ao aplicar permissão: ${rpcError.message} | code=${rpcError.code}`
      );

      return responderPermissoes(
        {
          ok: false,
          erro: "Não foi possível salvar a permissão.",
        },
        500
      );
    }

    const registro = Array.isArray(atualizada)
      ? atualizada[0]
      : atualizada;

    return responderPermissoes(
      {
        ok: true,
        permissao: registro,
        mensagem:
          "Permissão atualizada e auditada.",
      },
      200
    );
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido";

    console.error(
      `Erro inesperado ao alterar permissão: ${mensagem}`
    );

    return responderPermissoes(
      {
        ok: false,
        erro: "Erro interno ao alterar a permissão.",
      },
      500
    );
  }
}
