"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function salvarNovaSenha() {
    if (!senha || !confirmar) {
      alert("Preencha os dois campos.");
      return;
    }

const senhaForte =
  senha.length >= 8 &&
  /[A-Z]/.test(senha) &&
  /[a-z]/.test(senha) &&
  /\d/.test(senha) &&
  /[^A-Za-z0-9]/.test(senha);

if (!senhaForte) {
  alert(
    "A senha deve ter no mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo."
  );
  return;
}

    if (senha !== confirmar) {
      alert("As senhas não conferem.");
      return;
    }

    setSalvando(true);

    const { error } = await supabase.auth.updateUser({
      password: senha,
    });

    setSalvando(false);

    if (error) {
      alert(error.message);
      return;
    }

      await supabase.auth.signOut();

    alert("Senha redefinida com sucesso.");
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020b1c] p-4 text-white">
      <div className="painel-premium w-full max-w-md p-6 space-y-5">
        <div className="text-center">
          <h1 className="text-3xl font-black">Nova Senha</h1>
          <p className="text-slate-400 text-sm mt-2">
            Digite sua nova senha de acesso.
          </p>
        </div>

        <div>
          <label className="label">Nova senha</label>
          <input
            className="input"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Mínimo de 6 caracteres"
          />
        </div>

        <div>
          <label className="label">Confirmar senha</label>
          <input
            className="input"
            type="password"
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            placeholder="Digite novamente"
          />
        </div>

        <button
          type="button"
          onClick={salvarNovaSenha}
          disabled={salvando}
          className="sig-btn-gold w-full disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar Nova Senha"}
        </button>
      </div>
    </div>
  );
}