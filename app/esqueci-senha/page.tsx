"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  LoaderCircle,
  ShieldCheck,
  Upload,
  UserCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const LIMITE_ARQUIVO = 5 * 1024 * 1024;

type UploadAutorizado = {
  caminho: string;
  token: string;
};

type RespostaInicio = {
  ok?: boolean;
  erro?: string;
  sessao_token?: string;
  expira_em?: string;
  uploads?: {
    documento?: UploadAutorizado;
    selfie?: UploadAutorizado;
  };
};

type RespostaFinal = {
  ok?: boolean;
  erro?: string;
  mensagem?: string;
};

function limparCpf(valor: string) {
  return valor.replace(/\D/g, "").slice(0, 11);
}

function formatarCpf(valor: string) {
  return limparCpf(valor)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function validarArquivo(
  arquivo: File,
  tipo: "documento" | "selfie"
) {
  const permitidosDocumento = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  const permitidosSelfie = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  const permitidos =
    tipo === "documento"
      ? permitidosDocumento
      : permitidosSelfie;

  if (!permitidos.includes(arquivo.type)) {
    return tipo === "documento"
      ? "O documento deve ser JPG, PNG, WEBP ou PDF."
      : "A selfie deve ser JPG, PNG ou WEBP.";
  }

  if (arquivo.size <= 0 || arquivo.size > LIMITE_ARQUIVO) {
    return "Cada arquivo deve ter no máximo 5 MB.";
  }

  return "";
}

async function lerResposta<T>(resposta: Response): Promise<T> {
  const texto = await resposta.text();

  if (!texto) return {} as T;

  try {
    return JSON.parse(texto) as T;
  } catch {
    throw new Error("O servidor retornou uma resposta inválida.");
  }
}

export default function EsqueciSenhaPage() {
  const router = useRouter();
  const iniciadoEmRef = useRef(Date.now());

  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [matricula, setMatricula] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [aceitouPrivacidade, setAceitouPrivacidade] =
    useState(false);
  const [campoArmadilha, setCampoArmadilha] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);

  async function enviarSolicitacao() {
    if (enviando) return;

    setErro("");

    const emailLimpo = email.trim().toLowerCase();
    const cpfLimpo = limparCpf(cpf);
    const matriculaLimpa = matricula.trim().toUpperCase();
    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (
      !emailLimpo ||
      cpfLimpo.length !== 11 ||
      matriculaLimpa.length < 2
    ) {
      setErro("Informe e-mail, CPF e matrícula.");
      return;
    }

    if (!documento) {
      setErro("Envie a foto ou o PDF do documento.");
      return;
    }

    if (!selfie) {
      setErro("Envie uma selfie segurando o documento.");
      return;
    }

    const erroDocumento = validarArquivo(
      documento,
      "documento"
    );

    if (erroDocumento) {
      setErro(erroDocumento);
      return;
    }

    const erroSelfie = validarArquivo(selfie, "selfie");

    if (erroSelfie) {
      setErro(erroSelfie);
      return;
    }

    if (!aceitouPrivacidade) {
      setErro(
        "Confirme que autoriza o uso dos arquivos para verificação da identidade."
      );
      return;
    }

    setEnviando(true);
    setProgresso(10);

    try {
      const inicioResposta = await fetch(
        "/api/publico/recuperacao-senha/iniciar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: emailLimpo,
            cpf: cpfLimpo,
            matricula: matriculaLimpa,
            telefone: telefoneLimpo,
            documento_tipo: documento.type,
            documento_tamanho: documento.size,
            selfie_tipo: selfie.type,
            selfie_tamanho: selfie.size,
            aceite_privacidade: true,
            iniciado_em: iniciadoEmRef.current,
            empresa: campoArmadilha,
          }),
        }
      );

      const inicio = await lerResposta<RespostaInicio>(
        inicioResposta
      );

      if (
        !inicioResposta.ok ||
        !inicio.ok ||
        !inicio.sessao_token ||
        !inicio.uploads?.documento ||
        !inicio.uploads?.selfie
      ) {
        throw new Error(
          inicio.erro ||
            "Não foi possível autorizar o envio dos arquivos."
        );
      }

      setProgresso(30);

      const documentoUpload =
        await supabase.storage
          .from("recuperacao-senha")
          .uploadToSignedUrl(
            inicio.uploads.documento.caminho,
            inicio.uploads.documento.token,
            documento,
            {
              contentType: documento.type,
              cacheControl: "0",
            }
          );

      if (documentoUpload.error) {
        throw new Error(
          "Não foi possível enviar o documento."
        );
      }

      setProgresso(60);

      const selfieUpload =
        await supabase.storage
          .from("recuperacao-senha")
          .uploadToSignedUrl(
            inicio.uploads.selfie.caminho,
            inicio.uploads.selfie.token,
            selfie,
            {
              contentType: selfie.type,
              cacheControl: "0",
            }
          );

      if (selfieUpload.error) {
        throw new Error("Não foi possível enviar a selfie.");
      }

      setProgresso(85);

      const finalizarResposta = await fetch(
        "/api/publico/recuperacao-senha/finalizar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessao_token: inicio.sessao_token,
          }),
        }
      );

      const finalizacao =
        await lerResposta<RespostaFinal>(
          finalizarResposta
        );

      if (!finalizarResposta.ok || !finalizacao.ok) {
        throw new Error(
          finalizacao.erro ||
            "Não foi possível registrar a solicitação."
        );
      }

      setProgresso(100);
      setConcluido(true);

      setEmail("");
      setCpf("");
      setMatricula("");
      setTelefone("");
      setDocumento(null);
      setSelfie(null);
      setAceitouPrivacidade(false);
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro inesperado ao enviar a solicitação.";

      console.warn(
        `Recuperação de senha não enviada: ${mensagem}`
      );

      setErro(mensagem);
      setProgresso(0);
    } finally {
      setEnviando(false);
    }
  }

  if (concluido) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020b1c] p-4 text-white">
        <div className="painel-premium w-full max-w-lg space-y-5 p-8 text-center">
          <CheckCircle2
            className="mx-auto text-green-400"
            size={52}
          />

          <div>
            <h1 className="text-3xl font-black">
              Solicitação recebida
            </h1>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              A Central de Recuperação analisará o documento e a
              selfie. O link somente será enviado após a
              confirmação da identidade.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.replace("/login")}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 font-black text-white transition hover:bg-blue-800"
          >
            Voltar para o login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020b1c] p-4 text-white">
      <div className="painel-premium w-full max-w-xl space-y-5 p-6 sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-cyan-500/30 bg-cyan-500/10">
            <ShieldCheck className="h-9 w-9 text-cyan-400" />
          </div>

          <h1 className="text-3xl font-black">
            Recuperação Segura
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Envie seus dados, documento e selfie para análise
            manual da Central.
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          Por segurança, a senha não é redefinida
          automaticamente. A Central verificará sua identidade
          antes de liberar o link.
        </div>

        {erro && (
          <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-200">
            <AlertTriangle
              className="mt-0.5 shrink-0"
              size={18}
            />
            <p>{erro}</p>
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-px w-px overflow-hidden"
        >
          <label htmlFor="empresa">Empresa</label>
          <input
            id="empresa"
            value={campoArmadilha}
            onChange={(event) =>
              setCampoArmadilha(event.target.value)
            }
            autoComplete="off"
            tabIndex={-1}
          />
        </div>

        <div>
          <label htmlFor="email" className="label">
            E-mail cadastrado *
          </label>

          <input
            id="email"
            className="input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
            maxLength={160}
            disabled={enviando}
          />
        </div>

        <div>
          <label htmlFor="cpf" className="label">
            CPF cadastrado *
          </label>

          <input
            id="cpf"
            className="input"
            value={cpf}
            onChange={(event) =>
              setCpf(formatarCpf(event.target.value))
            }
            placeholder="000.000.000-00"
            inputMode="numeric"
            autoComplete="off"
            disabled={enviando}
          />
        </div>

        <div>
          <label htmlFor="matricula" className="label">
            Matrícula funcional *
          </label>

          <input
            id="matricula"
            className="input"
            value={matricula}
            onChange={(event) =>
              setMatricula(
                event.target.value
                  .toUpperCase()
                  .slice(0, 40)
              )
            }
            placeholder="Ex.: GCM1234"
            autoComplete="off"
            disabled={enviando}
          />
        </div>

        <div>
          <label htmlFor="telefone" className="label">
            Telefone para contato
          </label>

          <input
            id="telefone"
            className="input"
            value={telefone}
            onChange={(event) =>
              setTelefone(
                formatarTelefone(event.target.value)
              )
            }
            placeholder="(00) 00000-0000"
            inputMode="numeric"
            autoComplete="tel"
            disabled={enviando}
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <label
            htmlFor="documento"
            className="label flex items-center gap-2"
          >
            <Upload size={18} />
            Documento obrigatório *
          </label>

          <input
            id="documento"
            className="input mt-2"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) =>
              setDocumento(
                event.target.files?.[0] || null
              )
            }
            disabled={enviando}
          />

          <p className="mt-2 text-xs text-slate-500">
            RG, CNH, funcional ou documento equivalente.
            JPG, PNG, WEBP ou PDF, até 5 MB.
          </p>

          {documento && (
            <p className="mt-2 flex items-center gap-2 text-xs text-green-300">
              <FileCheck2 size={14} />
              {documento.name}
            </p>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <label
            htmlFor="selfie"
            className="label flex items-center gap-2"
          >
            <UserCheck size={18} />
            Selfie segurando o documento *
          </label>

          <input
            id="selfie"
            className="input mt-2"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="user"
            onChange={(event) =>
              setSelfie(event.target.files?.[0] || null)
            }
            disabled={enviando}
          />

          <p className="mt-2 text-xs text-slate-500">
            A selfie será usada apenas para análise manual da
            identidade. Até 5 MB.
          </p>

          {selfie && (
            <p className="mt-2 flex items-center gap-2 text-xs text-green-300">
              <FileCheck2 size={14} />
              {selfie.name}
            </p>
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={aceitouPrivacidade}
            onChange={(event) =>
              setAceitouPrivacidade(
                event.target.checked
              )
            }
            disabled={enviando}
            className="mt-1 h-4 w-4"
          />

          <span>
            Autorizo o uso temporário do documento e da selfie
            exclusivamente para verificar minha identidade e
            analisar esta recuperação de senha.
          </span>
        </label>

        {enviando && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Envio seguro em andamento</span>
              <span>{progresso}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-900">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{
                  width: `${progresso}%`,
                }}
              />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => void enviarSolicitacao()}
          disabled={enviando}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enviando ? (
            <>
              <LoaderCircle
                size={18}
                className="animate-spin"
              />
              Enviando...
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              Enviar para análise
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => router.replace("/login")}
          disabled={enviando}
          className="w-full text-sm text-slate-400 transition hover:text-white disabled:opacity-50"
        >
          Voltar para o login
        </button>
      </div>
    </main>
  );
}
