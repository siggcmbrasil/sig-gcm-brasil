"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Upload, UserCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";

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

function pegarDispositivo() {
  if (typeof navigator === "undefined") return "Não identificado";
  return navigator.userAgent || "Não identificado";
}

function pegarNavegador() {
  if (typeof navigator === "undefined") return "Não identificado";

  const ua = navigator.userAgent;

  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";

  return "Outro navegador";
}

function nomeArquivoSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();
}

export default function EsqueciSenhaPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [matricula, setMatricula] = useState("");
  const [telefone, setTelefone] = useState("");
  const [documento, setDocumento] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function uploadArquivo(
    arquivo: File,
    usuario: any,
    pasta: "documento" | "selfie"
  ) {
    const seguro = nomeArquivoSeguro(arquivo.name);
    const caminho = `${usuario.municipio_id || "sem-municipio"}/${usuario.id}/${pasta}-${Date.now()}-${seguro}`;

    const { error } = await supabase.storage
      .from("recuperacao-senha")
      .upload(caminho, arquivo);

    if (error) {
      console.error(error);
      throw new Error(`Erro ao enviar ${pasta}.`);
    }

    return caminho;
  }

  async function enviarSolicitacao() {
    if (enviando) return;

    const emailLimpo = email.trim().toLowerCase();
    const cpfLimpo = limparCpf(cpf);
    const matriculaLimpa = matricula.trim().toUpperCase();
    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (!emailLimpo || cpfLimpo.length !== 11 || !matriculaLimpa) {
      alert("Informe e-mail, CPF e matrícula.");
      return;
    }

    if (!documento) {
      alert("Envie a foto ou PDF do documento.");
      return;
    }

    if (!selfie) {
      alert("Envie uma selfie segurando o documento.");
      return;
    }

    const arquivos = [documento, selfie];

    for (const arquivo of arquivos) {
      const tipoPermitido =
        arquivo.type.startsWith("image/") || arquivo.type === "application/pdf";

      if (!tipoPermitido) {
        alert("Envie apenas imagem ou PDF.");
        return;
      }

      if (arquivo.size > 5 * 1024 * 1024) {
        alert("Cada arquivo deve ter no máximo 5MB.");
        return;
      }
    }

    setEnviando(true);

    try {
      const { data: usuario, error: erroUsuario } = await supabase
        .from("usuarios")
        .select(
          `
          id,
          nome,
          email,
          cpf,
          telefone,
          matricula,
          municipio_id,
          status,
          perfil,
          foto_url
        `
        )
        .eq("email", emailLimpo)
        .maybeSingle();

      if (erroUsuario) {
        console.error(erroUsuario);
        alert("Erro ao localizar usuário.");
        return;
      }

      if (!usuario) {
        alert("Usuário não encontrado.");
        return;
      }

      const emailOk = usuario.email?.toLowerCase() === emailLimpo;
      const cpfOk = (usuario.cpf || "").replace(/\D/g, "") === cpfLimpo;
      const matriculaOk =
        (usuario.matricula || "").toUpperCase() === matriculaLimpa;
      const statusOk = String(usuario.status || "").toUpperCase() === "ATIVO";

      let score = 100;

      if (!emailOk) score -= 25;
      if (!cpfOk) score -= 25;
      if (!matriculaOk) score -= 25;
      if (!statusOk) score -= 25;

      let risco = "BAIXO";

      if (score <= 75) risco = "MÉDIO";
      if (score <= 50) risco = "ALTO";
      if (score <= 25) risco = "CRÍTICO";

      const trintaMinutosAtras = new Date(
        Date.now() - 30 * 60 * 1000
      ).toISOString();

      const { data: recente } = await supabase
        .from("solicitacoes_recuperacao_senha")
        .select("id")
        .eq("usuario_id", usuario.id)
        .gte("criado_em", trintaMinutosAtras)
        .maybeSingle();

      if (recente) {
        alert("Já existe uma solicitação recente. Aguarde 30 minutos.");
        return;
      }

      const hojeInicio = new Date();
      hojeInicio.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("solicitacoes_recuperacao_senha")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", usuario.id)
        .gte("criado_em", hojeInicio.toISOString());

      if ((count || 0) >= 3) {
        alert("Limite diário atingido. Tente novamente amanhã.");
        return;
      }

      const documentoUrl = await uploadArquivo(documento, usuario, "documento");
      const selfieUrl = await uploadArquivo(selfie, usuario, "selfie");

      const { error } = await supabase
        .from("solicitacoes_recuperacao_senha")
        .insert({
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
          nome: usuario.nome,
          email: emailLimpo,
          cpf: cpfLimpo,
          matricula: matriculaLimpa,
          telefone: telefoneLimpo || usuario.telefone || null,
          documento_url: documentoUrl,
          selfie_url: selfieUrl,
          foto_perfil_url: usuario.foto_url || null,
          status: "PENDENTE",
          risco,
          verificado_email: emailOk,
          verificado_cpf: cpfOk,
          verificado_matricula: matriculaOk,
          verificado_status: statusOk,
          dispositivo: pegarDispositivo(),
          navegador: pegarNavegador(),
          tentativas_dia: (count || 0) + 1,
        });

      if (error) {
        console.error(error);
        alert("Erro ao registrar solicitação.");
        return;
      }

      alert(
        "Solicitação enviada com sucesso. Aguarde análise da Central de Recuperação."
      );

      router.push("/login");
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Erro inesperado ao enviar solicitação.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020b1c] p-4 text-white">
      <div className="painel-premium w-full max-w-xl p-6 sm:p-8 space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <ShieldCheck className="w-9 h-9 text-cyan-400" />
          </div>

          <h1 className="text-3xl font-black">Recuperação Segura</h1>

          <p className="text-slate-400 text-sm mt-2">
            Envie seus dados, documento e selfie para análise manual da Central.
          </p>
        </div>

        <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-200">
          🛡️ Por segurança, a senha não é redefinida automaticamente. A Central
          verificará sua identidade antes de liberar o link.
        </div>

        <div>
          <label className="label">E-mail cadastrado *</label>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seuemail@exemplo.com"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="label">CPF cadastrado *</label>
          <input
            className="input"
            value={cpf}
            onChange={(e) => setCpf(formatarCpf(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
          />
        </div>

        <div>
          <label className="label">Matrícula Funcional *</label>
          <input
            className="input"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value.toUpperCase())}
            placeholder="Ex.: GCM1234"
          />
        </div>

        <div>
          <label className="label">Telefone para contato</label>
          <input
            className="input"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <label className="label flex items-center gap-2">
            <Upload size={18} />
            Documento obrigatório *
          </label>

          <input
            className="input mt-2"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setDocumento(e.target.files?.[0] || null)}
          />

          <p className="text-slate-500 text-xs mt-2">
            Envie RG, CNH, funcional ou documento equivalente. Máximo 5MB.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <label className="label flex items-center gap-2">
            <UserCheck size={18} />
            Selfie segurando o documento *
          </label>

          <input
            className="input mt-2"
            type="file"
            accept="image/*"
            capture="user"
            onChange={(e) => setSelfie(e.target.files?.[0] || null)}
          />

          <p className="text-slate-500 text-xs mt-2">
            A selfie ajuda a confirmar que o solicitante é o próprio usuário.
          </p>
        </div>

        <button
          type="button"
          onClick={enviarSolicitacao}
          disabled={enviando}
          className="sig-btn-gold w-full disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar para Análise"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="w-full text-sm text-slate-400 hover:text-white"
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
}