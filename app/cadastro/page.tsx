"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Cadastro() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [cpf, setCpf] = useState("");

  async function cadastrar() {
  if (!nome || !email || !senha) {
    alert("Preencha os campos obrigatórios.");
    return;
  }

  if (!cpf) {
    alert("Informe o CPF.");
    return;
  }

  setCarregando(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    });

    if (error || !data.user) {
      setCarregando(false);
      alert(error?.message || "Erro ao criar usuário.");
      return;
    }

    const { error: erroUsuario } = await supabase
      .from("usuarios")
      .insert([
        {
  nome,
  cpf,
  email,
  telefone,
  cargo,
  perfil: "CONSULTA",
  status: "Pendente",
  municipio_id: 1,
},
      ]);

    setCarregando(false);

    if (erroUsuario) {
      alert(`Erro ao cadastrar usuário: ${erroUsuario.message}`);
console.error("ERRO USUÁRIO:", erroUsuario);
return;
    }

    alert(
      "Solicitação enviada com sucesso. Aguarde aprovação do administrador."
    );

    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020b1c] p-6">
      <div className="painel-premium w-full max-w-xl p-8">
        <h1 className="text-3xl font-black text-center mb-6">
          Solicitação de Acesso
        </h1>

        <div className="space-y-4">
          <input
            className="input"
            placeholder="Nome Completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

<div>
  <label className="label">CPF</label>

  <input
    className="input"
    value={cpf}
    onChange={(e) => setCpf(e.target.value)}
    placeholder="000.000.000-00"
  />
</div>

          <input
            className="input"
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="input"
            placeholder="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <input
            className="input"
            placeholder="Telefone"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />

          <input
            className="input"
            placeholder="Cargo / Função"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
          />

          <button
            onClick={cadastrar}
            disabled={carregando}
            className="sig-btn-gold w-full"
          >
            {carregando
              ? "Enviando..."
              : "Solicitar Acesso"}
          </button>
        </div>
      </div>
    </div>
  );
}