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

type Perfil = (typeof PERFIS)[number];

type UsuarioBanco = {
  id: number;
  auth_id: string | null;
  nome: string;
  email: string | null;
  perfil: string | null;
  status: string | null;
  municipio_id: number | null;
};

type GestorAutenticado = {
  authEmail: string;
  usuario: UsuarioBanco;
  perfil: Perfil;
};

type MunicipioBanco = {
  id: number;
  nome: string;
  estado: string;
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

function senhaValida(valor: string) {
  return (
    valor.length >= 8 &&
    /[a-z]/.test(valor) &&
    /[A-Z]/.test(valor) &&
    /\d/.test(valor)
  );
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

async function autenticarGestor(
  request: NextRequest
): Promise<
  | {
      ok: true;
      gestor: GestorAutenticado;
    }
  | {
      ok: false;
      resposta: NextResponse;
    }
> {
  const token = obterToken(request);

  if (!token) {
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
  } = await supabaseAdmin.auth.getUser(token);

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

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .select("id,auth_id,nome,email,perfil,status,municipio_id")
    .eq("auth_id", authUser.id)
    .maybeSingle();

  if (error || !data) {
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

  const usuario = data as UsuarioBanco;
  const perfil = normalizarPerfil(usuario.perfil);

  if (
    String(usuario.status || "").toUpperCase() !== "ATIVO" ||
    !perfil ||
    !PERFIS_GESTORES.includes(perfil)
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Usuário sem permissão para cadastrar acessos.",
        },
        403
      ),
    };
  }

  if (
    perfil !== "DESENVOLVEDOR" &&
    !usuario.municipio_id
  ) {
    return {
      ok: false,
      resposta: responder(
        {
          ok: false,
          erro: "Gestor sem município vinculado.",
        },
        403
      ),
    };
  }

  return {
    ok: true,
    gestor: {
      authEmail: authUser.email || usuario.email || "",
      usuario,
      perfil,
    },
  };
}

async function carregarMunicipiosPermitidos(
  gestor: GestorAutenticado
) {
  if (gestor.perfil === "DESENVOLVEDOR") {
    const { data, error } = await supabaseAdmin
      .from("municipios")
      .select("id,nome,estado")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (error) {
      throw new Error("Não foi possível carregar os municípios.");
    }

    return (data || []).map((item) => ({
      id: Number(item.id),
      nome: item.nome,
      estado: item.estado,
    })) as MunicipioBanco[];
  }

  const { data, error } = await supabaseAdmin
    .from("municipios")
    .select("id,nome,estado")
    .eq("id", gestor.usuario.municipio_id)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Município do gestor não foi localizado.");
  }

  return [
    {
      id: Number(data.id),
      nome: data.nome,
      estado: data.estado,
    },
  ] as MunicipioBanco[];
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

async function reverterCriacao(
  authId: string,
  caminhoFoto: string | null
) {
  if (caminhoFoto) {
    await supabaseAdmin.storage
      .from("usuarios-fotos")
      .remove([caminhoFoto]);
  }

  await supabaseAdmin
    .from("cadastro_solicitacoes_log")
    .delete()
    .eq("auth_id", authId);

  await supabaseAdmin
    .from("usuarios")
    .delete()
    .eq("auth_id", authId);

  const { error } =
    await supabaseAdmin.auth.admin.deleteUser(authId);

  if (error) {
    console.error("Falha ao remover usuário do Auth no rollback:", {
      message: error.message,
      authId,
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const autorizacao = await autenticarGestor(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const municipios = await carregarMunicipiosPermitidos(
      autorizacao.gestor
    );

    return responder(
      {
        ok: true,
        perfil_atual: autorizacao.gestor.perfil,
        perfis_permitidos: perfisPermitidos(
          autorizacao.gestor.perfil
        ),
        municipios,
      },
      200
    );
  } catch (error) {
    console.error("Erro ao carregar opções de criação:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Não foi possível carregar as opções do cadastro.",
      },
      500
    );
  }
}

export async function POST(request: NextRequest) {
  let authIdCriado: string | null = null;
  let caminhoFoto: string | null = null;

  try {
    const autorizacao = await autenticarGestor(request);

    if (!autorizacao.ok) {
      return autorizacao.resposta;
    }

    const gestor = autorizacao.gestor;
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
    const senha = String(formulario.get("senha") || "");
    const perfil = normalizarPerfil(
      String(formulario.get("perfil") || "")
    );
    const municipioId = Number(
      String(formulario.get("municipio_id") || "")
    );
    const observacao = String(
      formulario.get("observacao") || ""
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

    if (!senhaValida(senha) || senha.length > 128) {
      return responder(
        {
          ok: false,
          erro: "A senha precisa ter ao menos 8 caracteres, com maiúscula, minúscula e número.",
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
      !perfisPermitidos(gestor.perfil).includes(perfil)
    ) {
      return responder(
        {
          ok: false,
          erro: "O perfil informado não é permitido.",
        },
        403
      );
    }

    if (
      !Number.isSafeInteger(municipioId) ||
      municipioId <= 0
    ) {
      return responder(
        {
          ok: false,
          erro: "Município informado é inválido.",
        },
        422
      );
    }

    if (
      gestor.perfil !== "DESENVOLVEDOR" &&
      gestor.usuario.municipio_id !== municipioId
    ) {
      return responder(
        {
          ok: false,
          erro: "Não é permitido cadastrar usuário em outro município.",
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
      return responder(
        {
          ok: false,
          erro: "O município selecionado não está ativo.",
        },
        422
      );
    }

    const verificacoes = await Promise.all([
      supabaseAdmin
        .from("usuarios")
        .select("id")
        .ilike("email", email)
        .limit(1)
        .maybeSingle(),

      supabaseAdmin
        .from("usuarios")
        .select("id")
        .eq("cpf", cpf)
        .limit(1)
        .maybeSingle(),

      matricula
        ? supabaseAdmin
            .from("usuarios")
            .select("id")
            .eq("municipio_id", municipioId)
            .ilike("matricula", matricula)
            .limit(1)
            .maybeSingle()
        : Promise.resolve({
            data: null,
            error: null,
          }),
    ]);

    const [
      emailExistente,
      cpfExistente,
      matriculaExistente,
    ] = verificacoes;

    const erroVerificacao =
      emailExistente.error ||
      cpfExistente.error ||
      matriculaExistente.error;

    if (erroVerificacao) {
      console.error("Erro ao verificar duplicidades:", {
        message: erroVerificacao.message,
        details: erroVerificacao.details,
        hint: erroVerificacao.hint,
        code: erroVerificacao.code,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível validar os dados informados.",
        },
        500
      );
    }

    if (emailExistente.data) {
      return responder(
        {
          ok: false,
          erro: "Já existe usuário com este e-mail.",
        },
        409
      );
    }

    if (cpfExistente.data) {
      return responder(
        {
          ok: false,
          erro: "Já existe usuário com este CPF.",
        },
        409
      );
    }

    if (matriculaExistente.data) {
      return responder(
        {
          ok: false,
          erro: "Já existe usuário com esta matrícula no município.",
        },
        409
      );
    }

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
    }

    const { data: authData, error: authCreateError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome,
          cpf,
          telefone: telefone || null,
          cargo: cargo || null,
        },
        app_metadata: {
          cadastro_origem: "ADMINISTRATIVO",
          municipio_id: String(municipioId),
          perfil,
        },
      });

    if (authCreateError || !authData.user) {
      console.error("Erro ao criar usuário no Supabase Auth:", {
        message: authCreateError?.message,
      });

      return responder(
        {
          ok: false,
          erro:
            authCreateError?.message?.toLowerCase().includes(
              "already"
            )
              ? "Já existe uma conta de autenticação com este e-mail."
              : "Não foi possível criar a conta de autenticação.",
        },
        409
      );
    }

    authIdCriado = authData.user.id;

    const { data: usuarioCriado, error: usuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .select("id,auth_id,nome,email,perfil,status,municipio_id")
        .eq("auth_id", authIdCriado)
        .maybeSingle();

    if (usuarioError || !usuarioCriado) {
      await reverterCriacao(authIdCriado, null);
      authIdCriado = null;

      return responder(
        {
          ok: false,
          erro: "A conta foi criada, mas o cadastro institucional não foi gerado.",
        },
        500
      );
    }

    let fotoUrl: string | null = null;

    if (foto instanceof File && foto.size > 0) {
      await garantirBucketFotos();

      const extensao =
        MIME_FOTO[foto.type as keyof typeof MIME_FOTO];

      caminhoFoto = `${municipioId}/${usuarioCriado.id}/${randomUUID()}.${extensao}`;

      const bytes = Buffer.from(await foto.arrayBuffer());

      const { error: uploadError } =
        await supabaseAdmin.storage
          .from("usuarios-fotos")
          .upload(caminhoFoto, bytes, {
            contentType: foto.type,
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        await reverterCriacao(authIdCriado, caminhoFoto);
        authIdCriado = null;
        caminhoFoto = null;

        return responder(
          {
            ok: false,
            erro: "Não foi possível enviar a foto do usuário.",
          },
          500
        );
      }

      const { data: publicUrlData } =
        supabaseAdmin.storage
          .from("usuarios-fotos")
          .getPublicUrl(caminhoFoto);

      fotoUrl = publicUrlData.publicUrl;
    }

    const { data: cadastroAtualizado, error: updateError } =
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
          status: "PENDENTE",
          observacao: observacao || null,
          municipio_id: municipioId,
          foto_url: fotoUrl,
        })
        .eq("id", usuarioCriado.id)
        .select(
          "id,nome,email,perfil,status,municipio_id"
        )
        .single();

    if (updateError || !cadastroAtualizado) {
      await reverterCriacao(authIdCriado, caminhoFoto);
      authIdCriado = null;
      caminhoFoto = null;

      console.error("Erro ao finalizar cadastro institucional:", {
        message: updateError?.message,
        details: updateError?.details,
        hint: updateError?.hint,
        code: updateError?.code,
      });

      return responder(
        {
          ok: false,
          erro: "Não foi possível finalizar o cadastro institucional.",
        },
        500
      );
    }

    const dispositivo = obterDispositivo(request);

    const { error: logError } = await supabaseAdmin
      .from("logs_acesso")
      .insert({
        usuario_id: gestor.usuario.id,
        municipio_id:
          gestor.usuario.municipio_id || municipioId,
        email: gestor.authEmail,
        ip: obterIp(request),
        dispositivo,
        navegador: identificarNavegador(dispositivo),
        acao: "USUARIO_CRIAR",
        status: "SUCESSO",
      });

    if (logError) {
      await reverterCriacao(authIdCriado, caminhoFoto);
      authIdCriado = null;
      caminhoFoto = null;

      console.error("Cadastro revertido por falha de auditoria:", {
        message: logError.message,
        details: logError.details,
        hint: logError.hint,
        code: logError.code,
      });

      return responder(
        {
          ok: false,
          erro: "O usuário não foi criado porque a auditoria não pôde ser registrada.",
        },
        500
      );
    }

    return responder(
      {
        ok: true,
        usuario: {
          id: Number(cadastroAtualizado.id),
          nome: cadastroAtualizado.nome,
          email: cadastroAtualizado.email,
          perfil: cadastroAtualizado.perfil,
          status: "PENDENTE",
          municipio_id: Number(
            cadastroAtualizado.municipio_id
          ),
        },
      },
      201
    );
  } catch (error) {
    if (authIdCriado) {
      await reverterCriacao(authIdCriado, caminhoFoto);
    }

    console.error("Erro inesperado ao criar usuário:", {
      message:
        error instanceof Error
          ? error.message
          : "Erro desconhecido",
      error,
    });

    return responder(
      {
        ok: false,
        erro: "Erro interno ao criar o usuário.",
      },
      500
    );
  }
}
