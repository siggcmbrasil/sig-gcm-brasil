import { randomUUID } from "node:crypto";

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

const STATUS = [
  "ATIVO",
  "PENDENTE",
  "BLOQUEADO",
  "INATIVO",
] as const;

type Perfil = (typeof PERFIS)[number];
type StatusUsuario = (typeof STATUS)[number];

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
};

type ContextoAutorizado = {
  ator: UsuarioBanco;
  perfilAtor: Perfil;
  alvo: UsuarioBanco;
  perfilAlvo: Perfil;
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

const MIME_FOTO = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const LIMITE_FOTO = 5 * 1024 * 1024;

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

function normalizarStatus(
  valor: string | null
): StatusUsuario {
  const status = String(valor || "").toUpperCase();

  return STATUS.includes(status as StatusUsuario)
    ? (status as StatusUsuario)
    : "INATIVO";
}

function somenteNumeros(valor: string) {
  return valor.replace(/\D/g, "");
}

function cpfValido(valor: string) {
  const cpf = somenteNumeros(valor);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calcularDigito = (quantidade: number) => {
    let soma = 0;

    for (let indice = 0; indice < quantidade; indice += 1) {
      soma += Number(cpf[indice]) * (quantidade + 1 - indice);
    }

    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  return (
    calcularDigito(9) === Number(cpf[9]) &&
    calcularDigito(10) === Number(cpf[10])
  );
}

function emailValido(valor: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
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

function usuarioResposta(usuario: UsuarioBanco) {
  return {
    id: Number(usuario.id),
    nome: usuario.nome || "",
    matricula: usuario.matricula || "",
    telefone: usuario.telefone || "",
    cpf: usuario.cpf || "",
    cargo: usuario.cargo || "",
    email: usuario.email || "",
    perfil:
      normalizarPerfil(usuario.perfil) || "CONSULTA",
    status: normalizarStatus(usuario.status),
    observacao: usuario.observacao || "",
    municipio_id: usuario.municipio_id
      ? Number(usuario.municipio_id)
      : null,
    foto_url: usuario.foto_url || null,
  };
}

async function autenticarGestor(
  request: NextRequest,
  usuarioAlvoId: number
): Promise<
  | {
      ok: true;
      authEmail: string;
      contexto: ContextoAutorizado;
    }
  | {
      ok: false;
      resposta: NextResponse;
    }
> {
  const accessToken = obterToken(request);

  if (!accessToken) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Token de autenticação não informado.",
        },
        401
      ),
    };
  }

  const {
    data: { user: authUser },
    error: authError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !authUser) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Sessão inválida ou expirada.",
        },
        401
      ),
    };
  }

  const [atorResposta, alvoResposta] = await Promise.all([
    supabaseAdmin
      .from("usuarios")
      .select(
        "id,auth_id,nome,matricula,telefone,email,cpf,cargo,perfil,status,observacao,municipio_id,foto_url"
      )
      .eq("auth_id", authUser.id)
      .maybeSingle(),

    supabaseAdmin
      .from("usuarios")
      .select(
        "id,auth_id,nome,matricula,telefone,email,cpf,cargo,perfil,status,observacao,municipio_id,foto_url"
      )
      .eq("id", usuarioAlvoId)
      .maybeSingle(),
  ]);

  if (atorResposta.error || !atorResposta.data) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário responsável não foi localizado.",
        },
        403
      ),
    };
  }

  if (alvoResposta.error || !alvoResposta.data) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário que será editado não foi encontrado.",
        },
        404
      ),
    };
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
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário sem permissão para editar acessos.",
        },
        403
      ),
    };
  }

  if (ator.id === alvo.id) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Use Meu Perfil para alterar os próprios dados.",
        },
        409
      ),
    };
  }

  if (
    perfilAtor !== "DESENVOLVEDOR" &&
    (
      !ator.municipio_id ||
      ator.municipio_id !== alvo.municipio_id
    )
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Não é permitido editar usuário de outro município.",
        },
        403
      ),
    };
  }

  if (
    perfilAtor !== "DESENVOLVEDOR" &&
    NIVEL_PERFIL[perfilAtor] <= NIVEL_PERFIL[perfilAlvo]
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Não é permitido editar usuário de nível igual ou superior.",
        },
        403
      ),
    };
  }

  return {
    ok: true,
    authEmail: authUser.email || ator.email || "",
    contexto: {
      ator,
      perfilAtor,
      alvo,
      perfilAlvo,
    },
  };
}

function perfisPermitidos(perfilAtor: Perfil) {
  if (perfilAtor === "DESENVOLVEDOR") {
    return [...PERFIS];
  }

  return PERFIS.filter(
    (perfil) =>
      NIVEL_PERFIL[perfil] < NIVEL_PERFIL[perfilAtor]
  );
}

async function garantirBucketFotos() {
  const configuracao = {
    public: true,
    fileSizeLimit: LIMITE_FOTO,
    allowedMimeTypes: Object.keys(MIME_FOTO),
  };

  const { error: updateError } =
    await supabaseAdmin.storage.updateBucket(
      "usuarios-fotos",
      configuracao
    );

  if (!updateError) return;

  const { error: createError } =
    await supabaseAdmin.storage.createBucket(
      "usuarios-fotos",
      configuracao
    );

  if (createError) {
    const mensagem = createError.message.toLowerCase();

    if (
      !mensagem.includes("already exists") &&
      !mensagem.includes("duplicate")
    ) {
      throw new Error(
        "Não foi possível preparar o armazenamento das fotos."
      );
    }
  }
}

function caminhoFotoPublica(url: string | null) {
  if (!url) return null;

  const marcador =
    "/storage/v1/object/public/usuarios-fotos/";
  const indice = url.indexOf(marcador);

  if (indice === -1) return null;

  return decodeURIComponent(
    url.slice(indice + marcador.length)
  );
}

async function registrarLogServidor(
  request: NextRequest,
  ator: UsuarioBanco,
  municipioId: number | null,
  authEmail: string
) {
  const dispositivo = obterDispositivo(request);

  const { error } = await supabaseAdmin
    .from("logs_acesso")
    .insert({
      usuario_id: ator.id,
      municipio_id: ator.municipio_id || municipioId,
      email: authEmail || ator.email || "",
      ip: obterIp(request),
      dispositivo,
      navegador: identificarNavegador(dispositivo),
      acao: "USUARIO_EDITAR",
      status: "SUCESSO",
    });

  if (error) {
    console.error("Usuário editado, mas o log falhou:", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }
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

    const autorizacao = await autenticarGestor(
      request,
      usuarioAlvoId
    );

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const { contexto: permissao } = autorizacao;

    let municipios: {
      id: number;
      nome: string;
      estado: string;
    }[] = [];

    if (permissao.perfilAtor === "DESENVOLVEDOR") {
      const { data, error } = await supabaseAdmin
        .from("municipios")
        .select("id,nome,estado")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) {
        return responder(
          {
            ok: false,
            erro: "Não foi possível carregar os municípios.",
          },
          500
        );
      }

      municipios = (data || []).map((item) => ({
        id: Number(item.id),
        nome: item.nome,
        estado: item.estado,
      }));
    } else if (permissao.ator.municipio_id) {
      const { data, error } = await supabaseAdmin
        .from("municipios")
        .select("id,nome,estado")
        .eq("id", permissao.ator.municipio_id)
        .eq("ativo", true)
        .maybeSingle();

      if (error || !data) {
        return responder(
          {
            ok: false,
            erro: "Município do gestor não foi localizado.",
          },
          500
        );
      }

      municipios = [
        {
          id: Number(data.id),
          nome: data.nome,
          estado: data.estado,
        },
      ];
    }

    return responder(
      {
        ok: true,
        usuario: usuarioResposta(permissao.alvo),
        perfis_permitidos: perfisPermitidos(
          permissao.perfilAtor
        ),
        municipios,
      },
      200
    );
  } catch (error) {
    console.error("Erro inesperado ao carregar edição:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao carregar o usuário.",
      },
      500
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  let caminhoNovaFoto: string | null = null;
  let emailAuthAlterado = false;
  let emailAnterior = "";

  try {
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

    const autorizacao = await autenticarGestor(
      request,
      usuarioAlvoId
    );

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const {
      authEmail,
      contexto: permissao,
    } = autorizacao;

    const formulario = await request.formData();

    const nome = String(formulario.get("nome") || "")
      .trim()
      .replace(/\s+/g, " ");
    const matricula = String(
      formulario.get("matricula") || ""
    )
      .trim()
      .toUpperCase();
    const telefone = somenteNumeros(
      String(formulario.get("telefone") || "")
    );
    const cpf = somenteNumeros(
      String(formulario.get("cpf") || "")
    );
    const cargo = String(formulario.get("cargo") || "")
      .trim()
      .replace(/\s+/g, " ");
    const email = String(formulario.get("email") || "")
      .trim()
      .toLowerCase();
    const perfil = normalizarPerfil(
      String(formulario.get("perfil") || "")
    );
    const observacao = String(
      formulario.get("observacao") || ""
    ).trim();
    const municipioTexto = String(
      formulario.get("municipio_id") || ""
    ).trim();
    const foto = formulario.get("foto");

    if (nome.length < 3 || nome.length > 120) {
      return responder(
        {
          ok: false,
          erro: "Informe um nome válido.",
        },
        422
      );
    }

    if (!emailValido(email) || email.length > 160) {
      return responder(
        {
          ok: false,
          erro: "Informe um e-mail válido.",
        },
        422
      );
    }

    if (!cpfValido(cpf)) {
      return responder(
        {
          ok: false,
          erro: "Informe um CPF válido.",
        },
        422
      );
    }

    if (
      telefone &&
      telefone.length !== 10 &&
      telefone.length !== 11
    ) {
      return responder(
        {
          ok: false,
          erro: "Informe um telefone válido com DDD.",
        },
        422
      );
    }

    if (
      matricula.length > 40 ||
      cargo.length > 80 ||
      observacao.length > 1000
    ) {
      return responder(
        {
          ok: false,
          erro: "Um dos campos ultrapassou o limite permitido.",
        },
        422
      );
    }

    if (
      !perfil ||
      !perfisPermitidos(permissao.perfilAtor).includes(
        perfil
      )
    ) {
      return responder(
        {
          ok: false,
          erro: "O perfil informado não é permitido.",
        },
        403
      );
    }

    let municipioId: number | null = null;

    if (permissao.perfilAtor === "DESENVOLVEDOR") {
      municipioId = municipioTexto
        ? Number(municipioTexto)
        : null;

      if (
        municipioId !== null &&
        (
          !Number.isSafeInteger(municipioId) ||
          municipioId <= 0
        )
      ) {
        return responder(
          {
            ok: false,
            erro: "Município informado é inválido.",
          },
          422
        );
      }
    } else {
      municipioId = permissao.alvo.municipio_id;

      if (
        !municipioId ||
        municipioTexto !== String(municipioId)
      ) {
        return responder(
          {
            ok: false,
            erro: "Não é permitido alterar o município deste usuário.",
          },
          403
        );
      }
    }

    if (perfil !== "DESENVOLVEDOR" && !municipioId) {
      return responder(
        {
          ok: false,
          erro: "O usuário precisa estar vinculado a um município.",
        },
        422
      );
    }

    if (municipioId) {
      const { data: municipio, error: municipioError } =
        await supabaseAdmin
          .from("municipios")
          .select("id")
          .eq("id", municipioId)
          .eq("ativo", true)
          .maybeSingle();

      if (municipioError || !municipio) {
        return responder(
          {
            ok: false,
            erro: "O município selecionado não está ativo.",
          },
          422
        );
      }
    }

    const { data: duplicado, error: duplicadoError } =
      await supabaseAdmin
        .from("usuarios")
        .select("id")
        .neq("id", permissao.alvo.id)
        .or(`email.eq.${email},cpf.eq.${cpf}`)
        .limit(1)
        .maybeSingle();

    if (duplicadoError) {
      console.error("Erro ao verificar dados duplicados:", {
        message: duplicadoError.message,
        details: duplicadoError.details,
        hint: duplicadoError.hint,
        code: duplicadoError.code,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível validar e-mail e CPF.",
        },
        500
      );
    }

    if (duplicado) {
      return responder(
        {
          ok: false,
          erro: "Já existe outro usuário com este e-mail ou CPF.",
        },
        409
      );
    }

    let fotoUrl = permissao.alvo.foto_url;

    if (foto instanceof File && foto.size > 0) {
      if (
        foto.size > LIMITE_FOTO ||
        !(foto.type in MIME_FOTO)
      ) {
        return responder(
          {
            ok: false,
            erro: "A foto deve ser JPG, PNG ou WEBP e ter no máximo 5 MB.",
          },
          422
        );
      }

      await garantirBucketFotos();

      const extensao =
        MIME_FOTO[foto.type as keyof typeof MIME_FOTO];

      caminhoNovaFoto = `${
        municipioId || "global"
      }/${permissao.alvo.id}/${randomUUID()}.${extensao}`;

      const bytes = Buffer.from(await foto.arrayBuffer());

      const { error: uploadError } =
        await supabaseAdmin.storage
          .from("usuarios-fotos")
          .upload(caminhoNovaFoto, bytes, {
            contentType: foto.type,
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        console.error("Erro ao enviar foto do usuário:", {
          message: uploadError.message,
        });

        return responder(
          {
            ok: false,
            erro: "Não foi possível enviar a foto.",
          },
          500
        );
      }

      const { data: publicUrlData } =
        supabaseAdmin.storage
          .from("usuarios-fotos")
          .getPublicUrl(caminhoNovaFoto);

      fotoUrl = publicUrlData.publicUrl;
    }

    emailAnterior = permissao.alvo.email || "";

    if (
      permissao.alvo.auth_id &&
      email !== emailAnterior.toLowerCase()
    ) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(
          permissao.alvo.auth_id,
          {
            email,
            email_confirm: true,
          }
        );

      if (authUpdateError) {
        if (caminhoNovaFoto) {
          await supabaseAdmin.storage
            .from("usuarios-fotos")
            .remove([caminhoNovaFoto]);
        }

        return responder(
          {
            ok: false,
            erro: "Não foi possível atualizar o e-mail de autenticação.",
          },
          409
        );
      }

      emailAuthAlterado = true;
    }

    const { data: usuarioAtualizado, error: updateError } =
      await supabaseAdmin
        .from("usuarios")
        .update({
          nome,
          matricula: matricula || null,
          telefone: telefone || null,
          cpf,
          cargo: cargo || null,
          email,
          perfil,
          observacao: observacao || null,
          municipio_id: municipioId,
          foto_url: fotoUrl,
        })
        .eq("id", permissao.alvo.id)
        .select(
          "id,auth_id,nome,matricula,telefone,email,cpf,cargo,perfil,status,observacao,municipio_id,foto_url"
        )
        .single();

    if (updateError || !usuarioAtualizado) {
      if (
        emailAuthAlterado &&
        permissao.alvo.auth_id &&
        emailAnterior
      ) {
        await supabaseAdmin.auth.admin.updateUserById(
          permissao.alvo.auth_id,
          {
            email: emailAnterior,
            email_confirm: true,
          }
        );
      }

      if (caminhoNovaFoto) {
        await supabaseAdmin.storage
          .from("usuarios-fotos")
          .remove([caminhoNovaFoto]);
      }

      console.error("Erro ao atualizar usuário:", {
        message: updateError?.message,
        details: updateError?.details,
        hint: updateError?.hint,
        code: updateError?.code,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível atualizar os dados do usuário.",
        },
        500
      );
    }

    const caminhoFotoAnterior = caminhoFotoPublica(
      permissao.alvo.foto_url
    );

    if (
      caminhoNovaFoto &&
      caminhoFotoAnterior &&
      caminhoFotoAnterior !== caminhoNovaFoto
    ) {
      const { error: remocaoError } =
        await supabaseAdmin.storage
          .from("usuarios-fotos")
          .remove([caminhoFotoAnterior]);

      if (remocaoError) {
        console.warn("Foto antiga não removida:", {
          message: remocaoError.message,
          caminhoFotoAnterior,
        });
      }
    }

    await registrarLogServidor(
      request,
      permissao.ator,
      municipioId,
      authEmail
    );

    return responder(
      {
        ok: true,
        usuario: usuarioResposta(
          usuarioAtualizado as UsuarioBanco
        ),
      },
      200
    );
  } catch (error) {
    if (caminhoNovaFoto) {
      await supabaseAdmin.storage
        .from("usuarios-fotos")
        .remove([caminhoNovaFoto]);
    }

    console.error("Erro inesperado ao editar usuário:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao atualizar o usuário.",
      },
      500
    );
  }
}
