import { NextRequest } from "next/server";

import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  assinaturaCompativel,
  BUCKET_RECUPERACAO,
  hashToken,
  identificarNavegador,
  LIMITE_ARQUIVO,
  normalizarCpf,
  normalizarEmail,
  normalizarMatricula,
  obterIp,
  obterUserAgent,
  origemPermitida,
  responderPublico,
} from "@/lib/seguranca/recuperacaoPublica";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SessaoUpload = {
  id: string;
  usuario_id: number;
  municipio_id: number;
  documento_path: string;
  documento_mime: string;
  documento_tamanho: number;
  selfie_path: string;
  selfie_mime: string;
  selfie_tamanho: number;
  telefone_informado: string | null;
  ip_origem: string | null;
  expira_em: string;
  processando_em: string | null;
  usado_em: string | null;
  cancelado_em: string | null;
};

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

function separarCaminho(caminho: string) {
  const partes = caminho.split("/").filter(Boolean);
  const nome = partes.pop() || "";

  return {
    pasta: partes.join("/"),
    nome,
  };
}

async function obterObjeto(caminho: string) {
  const { pasta, nome } = separarCaminho(caminho);

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_RECUPERACAO)
    .list(pasta, {
      limit: 20,
      search: nome,
    });

  if (error) {
    throw new Error(
      `Não foi possível verificar o arquivo: ${error.message}`
    );
  }

  return (data || []).find((item) => item.name === nome);
}

async function obterCabecalho(caminho: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_RECUPERACAO)
    .createSignedUrl(caminho, 60);

  if (error || !data?.signedUrl) {
    throw new Error("Não foi possível inspecionar o arquivo.");
  }

  const resposta = await fetch(data.signedUrl, {
    headers: {
      Range: "bytes=0-15",
    },
    cache: "no-store",
  });

  if (!resposta.ok) {
    throw new Error("Não foi possível ler o arquivo enviado.");
  }

  const buffer = await resposta.arrayBuffer();
  return new Uint8Array(buffer.slice(0, 16));
}

async function validarObjeto(
  caminho: string,
  mimeEsperado: string,
  tamanhoEsperado: number
) {
  const objeto = await obterObjeto(caminho);

  if (!objeto) return false;

  const metadata = (objeto.metadata || {}) as Record<
    string,
    unknown
  >;

  const tamanhoReal = Number(metadata.size || 0);
  const mimeReal = String(
    metadata.mimetype ||
      metadata.contentType ||
      metadata.content_type ||
      ""
  ).toLowerCase();

  if (
    !Number.isFinite(tamanhoReal) ||
    tamanhoReal <= 0 ||
    tamanhoReal > LIMITE_ARQUIVO ||
    tamanhoReal !== tamanhoEsperado
  ) {
    return false;
  }

  if (mimeReal && mimeReal !== mimeEsperado) {
    return false;
  }

  const cabecalho = await obterCabecalho(caminho);

  return assinaturaCompativel(
    mimeEsperado,
    cabecalho
  );
}

async function cancelarSessao(
  sessao: SessaoUpload,
  motivo: string,
  removerArquivos: boolean
) {
  if (removerArquivos) {
    await supabaseAdmin.storage
      .from(BUCKET_RECUPERACAO)
      .remove([
        sessao.documento_path,
        sessao.selfie_path,
      ]);
  }

  await supabaseAdmin
    .from("recuperacao_upload_sessoes")
    .update({
      cancelado_em: new Date().toISOString(),
      motivo_cancelamento: motivo.slice(0, 500),
      processando_em: null,
    })
    .eq("id", sessao.id);
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
      sessao_token?: unknown;
    } | null;

    const token = String(
      corpo?.sessao_token || ""
    ).trim();

    if (token.length < 32 || token.length > 200) {
      return responderPublico(
        {
          ok: false,
          erro: "Sessão de envio inválida.",
        },
        400
      );
    }

    const tokenHash = hashToken(token);

    const { data: sessaoData, error: sessaoError } =
      await supabaseAdmin
        .from("recuperacao_upload_sessoes")
        .select(
          "id,usuario_id,municipio_id,documento_path,documento_mime,documento_tamanho,selfie_path,selfie_mime,selfie_tamanho,telefone_informado,ip_origem,expira_em,processando_em,usado_em,cancelado_em"
        )
        .eq("token_hash", tokenHash)
        .maybeSingle();

    if (sessaoError || !sessaoData) {
      return responderPublico(
        {
          ok: false,
          erro: "Sessão de envio não encontrada.",
        },
        404
      );
    }

    const sessao = sessaoData as SessaoUpload;

    if (
      sessao.cancelado_em ||
      new Date(sessao.expira_em).getTime() <= Date.now()
    ) {
      return responderPublico(
        {
          ok: false,
          erro:
            "A sessão de envio expirou. Inicie uma nova solicitação.",
        },
        410
      );
    }

    const { data: existente } = await supabaseAdmin
      .from("solicitacoes_recuperacao_senha")
      .select("id")
      .eq("sessao_upload_id", sessao.id)
      .maybeSingle();

    if (existente) {
      return responderPublico(
        {
          ok: true,
          mensagem: "Solicitação registrada com sucesso.",
        },
        200
      );
    }

    if (sessao.usado_em) {
      return responderPublico(
        {
          ok: false,
          erro: "Esta sessão de envio já foi utilizada.",
        },
        409
      );
    }

    const processandoEm = new Date().toISOString();

    const { data: bloqueada, error: bloqueioError } =
      await supabaseAdmin
        .from("recuperacao_upload_sessoes")
        .update({
          processando_em: processandoEm,
        })
        .eq("id", sessao.id)
        .is("processando_em", null)
        .is("usado_em", null)
        .is("cancelado_em", null)
        .select("id")
        .maybeSingle();

    if (bloqueioError || !bloqueada) {
      return responderPublico(
        {
          ok: false,
          erro:
            "Esta solicitação já está sendo processada.",
        },
        409
      );
    }

    const [
      documentoValido,
      selfieValida,
    ] = await Promise.all([
      validarObjeto(
        sessao.documento_path,
        sessao.documento_mime,
        Number(sessao.documento_tamanho)
      ),
      validarObjeto(
        sessao.selfie_path,
        sessao.selfie_mime,
        Number(sessao.selfie_tamanho)
      ),
    ]);

    if (!documentoValido || !selfieValida) {
      await cancelarSessao(
        sessao,
        "Arquivo ausente, incompatível ou adulterado.",
        true
      );

      return responderPublico(
        {
          ok: false,
          erro:
            "Um dos arquivos enviados é inválido. Inicie uma nova solicitação.",
        },
        422
      );
    }

    const { data: usuarioData, error: usuarioError } =
      await supabaseAdmin
        .from("usuarios")
        .select(
          "id,auth_id,nome,email,cpf,telefone,matricula,municipio_id,status,perfil,foto_url"
        )
        .eq("id", sessao.usuario_id)
        .eq("municipio_id", sessao.municipio_id)
        .maybeSingle();

    if (usuarioError || !usuarioData) {
      await cancelarSessao(
        sessao,
        "Usuário institucional não localizado.",
        true
      );

      return responderPublico(
        {
          ok: false,
          erro: "A conta não está disponível para recuperação.",
        },
        422
      );
    }

    const usuario = usuarioData as UsuarioBanco;
    const status = String(
      usuario.status || ""
    ).toUpperCase();

    if (
      !usuario.auth_id ||
      !["ATIVO", "BLOQUEADO"].includes(status)
    ) {
      await cancelarSessao(
        sessao,
        "Status do usuário não permite recuperação.",
        true
      );

      return responderPublico(
        {
          ok: false,
          erro: "A conta não está disponível para recuperação.",
        },
        422
      );
    }

    const {
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.admin.getUserById(
      usuario.auth_id
    );

    if (
      authError ||
      !authData.user ||
      normalizarEmail(authData.user.email) !==
        normalizarEmail(usuario.email)
    ) {
      await cancelarSessao(
        sessao,
        "Conta do Auth não corresponde ao usuário.",
        true
      );

      return responderPublico(
        {
          ok: false,
          erro: "A conta não está disponível para recuperação.",
        },
        422
      );
    }

    const inicioDia = new Date();
    inicioDia.setHours(0, 0, 0, 0);

    const { count: tentativasDia } =
      await supabaseAdmin
        .from("solicitacoes_recuperacao_senha")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("usuario_id", usuario.id)
        .gte("criado_em", inicioDia.toISOString());

    const userAgent = obterUserAgent(request);
    const ip = obterIp(request);
    const criadoEm = new Date().toISOString();

    const { data: solicitacao, error: insertError } =
      await supabaseAdmin
        .from("solicitacoes_recuperacao_senha")
        .insert({
          sessao_upload_id: sessao.id,
          municipio_id: Number(usuario.municipio_id),
          usuario_id: usuario.id,
          nome: usuario.nome,
          email: normalizarEmail(usuario.email),
          cpf: normalizarCpf(usuario.cpf),
          matricula: normalizarMatricula(
            usuario.matricula
          ),
          telefone:
            sessao.telefone_informado ||
            usuario.telefone ||
            null,
          documento_url: sessao.documento_path,
          selfie_url: sessao.selfie_path,
          foto_perfil_url: usuario.foto_url || null,
          status: "PENDENTE",
          risco: "BAIXO",
          verificado_email: true,
          verificado_cpf: true,
          verificado_matricula: true,
          verificado_status: true,
          dispositivo: userAgent,
          navegador: identificarNavegador(userAgent),
          tentativas_dia: (tentativasDia || 0) + 1,
          ip_origem: ip,
          user_agent: userAgent,
          aceite_privacidade_em: criadoEm,
        })
        .select("id")
        .single();

    if (insertError || !solicitacao) {
      await supabaseAdmin
        .from("recuperacao_upload_sessoes")
        .update({
          processando_em: null,
        })
        .eq("id", sessao.id)
        .eq("processando_em", processandoEm);

      console.error(
        `Erro ao registrar recuperação: ${insertError?.message || "sem retorno"}`
      );

      return responderPublico(
        {
          ok: false,
          erro:
            "Não foi possível registrar a solicitação. Tente novamente.",
        },
        500
      );
    }

    const { error: concluirError } =
      await supabaseAdmin
        .from("recuperacao_upload_sessoes")
        .update({
          usado_em: criadoEm,
          processando_em: null,
          solicitacao_id: Number(solicitacao.id),
        })
        .eq("id", sessao.id)
        .eq("processando_em", processandoEm);

    if (concluirError) {
      console.error(
        `Solicitação criada, mas sessão não finalizada: ${concluirError.message}`
      );
    }

    return responderPublico(
      {
        ok: true,
        mensagem:
          "Solicitação enviada para análise da Central de Recuperação.",
      },
      201
    );
  } catch (error) {
    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro desconhecido";

    console.error(
      `Erro inesperado ao finalizar recuperação: ${mensagem}`
    );

    return responderPublico(
      {
        ok: false,
        erro: "Erro interno ao finalizar a solicitação.",
      },
      500
    );
  }
}
