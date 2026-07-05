"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { registrarAuditoria } from "@/lib/auditoria";

function formatarCpf(valor: string) {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
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

export default function Cadastro() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [cpf, setCpf] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    if (carregando) return;

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const cargoLimpo = cargo.trim();
    const cpfLimpo = cpf.replace(/\D/g, "");
    const telefoneLimpo = telefone.replace(/\D/g, "");

    if (!nomeLimpo || !emailLimpo || !senha.trim()) {
      alert("Preencha nome, e-mail e senha.");
      return;
    }

    if (cpfLimpo.length !== 11) {
      alert("Informe um CPF válido.");
      return;
    }

    if (senha.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const { data: usuarioExistente } = await supabase
        .from("usuarios")
        .select("id")
        .or(`email.eq.${emailLimpo},cpf.eq.${cpfLimpo}`)
        .maybeSingle();

      if (usuarioExistente) {
        alert("Já existe uma solicitação ou cadastro com este e-mail ou CPF.");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: emailLimpo,
        password: senha,
      });

      if (error || !data.user) {
        alert(error?.message || "Erro ao criar usuário.");
        return;
      }

      const { error: erroUsuario } = await supabase.from("usuarios").insert([
        {
          auth_id: data.user.id,
          nome: nomeLimpo,
          cpf: cpfLimpo,
          email: emailLimpo,
          telefone: telefoneLimpo,
          cargo: cargoLimpo,
          perfil: "CONSULTA",
          status: "PENDENTE",
          municipio_id: null,
        },
      ]);

      if (erroUsuario) {
        alert(`Erro ao cadastrar usuário: ${erroUsuario.message}`);
        console.error("ERRO USUÁRIO:", erroUsuario);
        return;
      }

      await registrarAuditoria({
        modulo: "Cadastro",
        acao: "SOLICITAR_ACESSO",
        descricao: `Solicitação de acesso criada para ${nomeLimpo} (${emailLimpo}).`,
      });

      alert("Solicitação enviada com sucesso. Aguarde aprovação do administrador.");
      router.push("/login");
    } catch (error) {
      console.error("ERRO CADASTRO:", error);
      alert("Erro inesperado ao solicitar acesso.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020b1c] p-4">
      <div className="painel-premium w-full max-w-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black">Solicitação de Acesso</h1>
          <p className="text-slate-400 text-sm mt-2">
            Preencha seus dados para solicitar acesso ao SIG-GCM Brasil.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="label">Nome completo *</label>
            <input
              className="input"
              placeholder="Digite seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>

          <div>
            <label className="label">CPF *</label>
            <input
              className="input"
              value={cpf}
              onChange={(e) => setCpf(formatarCpf(e.target.value))}
              placeholder="000.000.000-00"
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="label">E-mail *</label>
            <input
              className="input"
              placeholder="seuemail@exemplo.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Senha *</label>
            <input
              className="input"
              placeholder="Mínimo de 6 caracteres"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="label">Telefone</label>
            <input
              className="input"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
              inputMode="numeric"
            />
          </div>

          <div>
            <label className="label">Cargo / Função</label>
            <input
              className="input"
              placeholder="Ex: Guarda Civil Municipal"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            />
          </div>

          <button
            onClick={cadastrar}
            disabled={carregando}
            className="sig-btn-gold w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {carregando ? "Enviando..." : "Solicitar Acesso"}
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
    </div>
  );
}