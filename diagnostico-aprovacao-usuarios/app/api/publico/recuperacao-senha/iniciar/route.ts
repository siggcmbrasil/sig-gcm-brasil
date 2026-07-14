import { randomBytes, randomUUID } from "crypto";
import { NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  arquivoDeclaradoValido,
  BUCKET_RECUPERACAO,
  cpfValido,
  DURACAO_SESSAO_MINUTOS,
  emailValido,
  extensaoPorMime,
  hashToken,
  normalizarCpf,
  normalizarEmail,
  normalizarMatricula,
  normalizarTelefone,
  obterIp,
  obterUserAgent,
  origemPermitida,
  responderPublico,
} from "@/lib/seguranca/recuperacaoPublica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type UsuarioBanco = {
  id: number;
  auth_id: string | null;
  nome: string;
  email: string | null;
  cpf: string | null;
  telefone: string | null;
  matricula: string | null;
  municipio_id: number | null;
  status: string | null;
  perfil: string | null;
  foto_url: string | null;
};

function respostaDadosNaoConferem() {
  return responderPublico(
    {
      ok: false,
      erro:
        "Os dados informados não correspondem a uma conta apta para recuperação.",
    },
    422
  );
}

export async function POST(request: NextRequest) {
  try {
    if (!origemPermitida(request)) {
      return responderPublico(
        {
          ok: false,
          erro: "Origem da solicitação não autorizada.",
        },
        403
      );
    }

    const corpo = (await request.json().catch(() => null)) as {
      email?: unknown;
      cpf?: unknown;
      matricula?: unknown;
      telefone?: unknown;
      documento_tipo?: unknown;
      documento_tamanho?: unknown;
      selfie_tipo?: unknown;
      selfie_tamanho?: unknown;
      aceite_privacidade?: unknown;
      iniciado_em?: unknown;
      empresa?: unknown;
    } | null;

    if (!corpo) {
      return responderPublico(
        {
          ok: false,
          erro: "Dados da solicitação inválidos.",
        },
        400
      );
    }

    if (String(corpo.empresa || "").trim()) {
      return responderPublico(
        {
          ok: true,
          mensagem: "Solicitação recebida.",
        },
        202
      );
    }

    const iniciadoEm = Number(corpo.iniciado_em);
    const tempoPreenchimento = Date.now() - iniciadoEm;

    if (
      !Number.isFinite(iniciadoEm) ||
      tempoPreenchimento < 2000 ||
      tempoPreenchimento > 2 * 60 * 60 * 1000
    ) {
      return responderPublico(
        {
          ok: false,
          erro: "O formulário expirou. Recarregue a página.",
        },
        400
      );
    }

    if (corpo.aceite_privacidade !== true) {
      return responderPublico(
        {
          ok: false,
          erro:
            "É necessário autorizar a análise dos arquivos enviados.",
        },
        422
      );
    }

    const email = normalizarEmail(corpo.email);
    const cpf = normalizarCpf(corpo.cpf);
    const matricula = normalizarMatricula(corpo.matricula);
    const telefone = normalizarTelefone(corpo.telefone);

    const documentoTipo = String(
      corpo.documento_tipo || ""
    ).toLowerCase();

    const selfieTipo = String(
      corpo.selfie_tipo || ""
    ).toLowerCase();

    const documentoTamanho = Number(
      corpo.documento_tamanho
    );

    const selfieTamanho = Number(corpo.selfie_tamanho);

    if (
      !emailValido(email) ||
      !cpfValido(cpf) ||
      matricula.length < 2 ||
      matricula.length > 40
    ) {
      return responderPublico(
        {
          ok: false,
          erro: "E-mail, CPF ou matrícula inválidos.",
        },
        422
      );
    }

    if (
      !arquivoDeclaradoValido(
        documentoTipo,
        documentoTamanho,
        "documento"
      ) ||
      !arquivoDeclaradoValido(
        selfieTipo,
        selfieTamanho,
        "selfie"
      )
    ) {
      return responderPublico(
        {
          ok: false,
          erro:
            "Os arquivos não atendem ao formato ou ao limite de 5 MB.",
        },
        422
      );
    }

    const ip = obterIp(request);
    const userAgent = obterUserAgent(request);
    const quinzeMinutosAtras = new Date(
      Date.now() - 15 * 60 * 1000
    ).toISOString();

    const { count: tentativasIp, error: ipError } =
      await supabaseAdmin
        .from("recuperacao_upload_sessoes")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("ip_origem", ip)
        .gte("criado_em", quinzeMinutosAtras);

    if (ipError) {
      console.error(
        `Falha ao verificar limite por IP: ${ipError.message}`
      );

      return responderPublico(
        {
          ok: false,
          erro: "Não foi possível validar a solicitação.",
        },
        500
      );
    }

    if ((tentativasIp || 0) >= 8) {
      return responderPublico(
        {
          ok: false,
          erro:
            "Muitas tentativas foram realizadas. Aguarde alguns minutos.",
        },
        429
      );
    }

    const { data: usuarioData, error: usuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .select(
          "id,auth_id,nome,email,cpf,telefone,matricula,municipio_id,status,perfil,foto_url"
        )
        .eq("email", email)
        .maybeSingle();

    if (usuarioError) {
      console.error(
        `Erro ao localizar usuário para recuperação: ${usuarioError.message}`
      );

      return responderPublico(
        {
          ok: false,
          erro: "Não foi possível validar a conta.",
        },
        500
      );
    }

    if (!usuarioData) {
      return respostaDadosNaoConferem();
    }

    const usuario = usuarioData as UsuarioBanco;
    const status = String(
      usuario.status || ""
    ).toUpperCase();

    const dadosConferem =
      normalizarEmail(usuario.email) === email &&
      normalizarCpf(usuario.cpf) === cpf &&
      normalizarMatricula(usuario.matricula) ===
        matricula &&
      ["ATIVO", "BLOQUEADO"].includes(status) &&
      Boolean(usuario.auth_id) &&
      Boolean(usuario.municipio_id);

    if (!dadosConferem) {
      return respostaDadosNaoConferem();
    }

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(
        String(usuario.auth_id)
      );

    if (
      authError ||
      !authData.user ||
      normalizarEmail(authData.user.email) !== email
    ) {
      return respostaDadosNaoConferem();
    }

    const trintaMinutosAtras = new Date(
      Date.now() - 30 * 60 * 1000
    ).toISOString();

    const { count: recentes, error: recenteError } =
      await supabaseAdmin
        .from("solicitacoes_recuperacao_senha")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("usuario_id", usuario.id)
        .gte("criado_em", trintaMinutosAtras);

    if (recenteError) {
      console.error(
        `Erro ao verificar solicitação recente: ${recenteError.message}`
      );

      return responderPublico(
        {
          ok: false,
          erro: "Não foi possível validar o limite de solicitações.",
        },
        500
      );
    }

    if ((recentes || 0) > 0) {
      return responderPublico(
        {
          ok: false,
          erro:
            "Já existe uma solicitação recente. Aguarde 30 minutos.",
        },
        429
      );
    }

    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const { count: tentativasDia, error: diaError } =
      await supabaseAdmin
        .from("solicitacoes_recuperacao_senha")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("usuario_id", usuario.id)
        .gte("criado_em", inicioDia.toISOString());

    if (diaError) {
      console.error(
        `Erro ao verificar limite diário: ${diaError.message}`
      );

      return responderPublico(
        {
          ok: false,
          erro: "Não foi possível validar o limite diário.",
        },
        500
      );
    }

    if ((tentativasDia || 0) >= 3) {
      return responderPublico(
        {
          ok: false,
          erro:
            "O limite diário de solicitações foi atingido.",
        },
        429
      );
    }

    const tokenBruto = randomBytes(32).toString(
      "base64url"
    );

    const tokenHash = hashToken(tokenBruto);
    const pasta = `${Number(
      usuario.municipio_id
    )}/${usuario.id}/${randomUUID()}`;

    const documentoCaminho = `${pasta}/documento.${extensaoPorMime(
      documentoTipo
    )}`;

    const selfieCaminho = `${pasta}/selfie.${extensaoPorMime(
      selfieTipo
    )}`;

    const [
      { data: documentoAssinado, error: documentoError },
      { data: selfieAssinada, error: selfieError },
    ] = await Promise.all([
      supabaseAdmin.storage
        .from(BUCKET_RECUPERACAO)
        .createSignedUploadUrl(documentoCaminho, {
          upsert: false,
        }),
      supabaseAdmin.storage
        .from(BUCKET_RECUPERACAO)
        .createSignedUploadUrl(selfieCaminho, {
          upsert: false,
        }),
    ]);

    if (
      documentoError ||
      selfieError ||
      !documentoAssinado?.token ||
      !selfieAssinada?.token
    ) {
      console.error(
        `Falha ao criar URLs de upload: documento=${documentoError?.message || "sem erro"}; selfie=${selfieError?.message || "sem erro"}`
      );

      return responderPublico(
        {
          ok: false,
          erro:
            "Não foi possível preparar o envio dos arquivos.",
        },
        500
      );
    }

    const expiraEm = new Date(
      Date.now() +
        DURACAO_SESSAO_MINUTOS * 60 * 1000
    ).toISOString();

    const { error: sessaoError } = await supabaseAdmin
      .from("recuperacao_upload_sessoes")
      .insert({
        token_hash: tokenHash,
        usuario_id: usuario.id,
        municipio_id: Number(usuario.municipio_id),
        documento_path: documentoCaminho,
        documento_mime: documentoTipo,
        documento_tamanho: documentoTamanho,
        selfie_path: selfieCaminho,
        selfie_mime: selfieTipo,
        selfie_tamanho: selfieTamanho,
        telefone_informado: telefone || null,
        ip_origem: ip,
        user_agent: userAgent,
        aceite_privacidade_em: new Date().toISOString(),
        expira_em: expiraEm,
      });

    if (sessaoError) {
      console.error(
        `Erro ao criar sessão de upload: ${sessaoError.message}`
      );

      return responderPublico(
        {
          ok: false,
          erro:
            "Não foi possível iniciar a solicitação segura.",
        },
        500
      );
    }

    return responderPublico(
      {
        ok: true,
        sessao_token: tokenBruto,
        expira_em: expiraEm,
        uploads: {
          documento: {
            caminho: documentoCaminho,
            token: documentoAssinado.token,
          },
          selfie: {
            caminho: selfieCaminho,
            token: selfieAssinada.token,
          },
        },
      },
      200
    );
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido";

    console.error(
      `Erro inesperado ao iniciar recuperação: ${mensagem}`
    );

    return responderPublico(
      {
        ok: false,
        erro: "Erro interno ao iniciar a solicitação.",
      },
      500
    );
  }
}
