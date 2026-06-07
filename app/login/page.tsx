"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@gcm.local");
  const [senha, setSenha] = useState("123456");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email || !senha) {
      alert("Digite email e senha.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setCarregando(false);

    if (error || !data.user) {
      alert("Usuário ou senha inválidos.");
      return;
    }

    const { data: usuarioSistema } = await supabase
  .from("usuarios")
  .select("*")
  .eq("email", data.user.email)
  .single();

localStorage.setItem(
  "usuarioLogado",
  JSON.stringify({
    id: data.user.id,
    nome: usuarioSistema?.nome || data.user.email,
    matricula: usuarioSistema?.matricula || "",
    email: data.user.email,
    perfil: (usuarioSistema?.perfil || "GUARDA").toUpperCase(),
    status: usuarioSistema?.status || "Ativo",
  })
);
if (usuarioSistema?.status === "Inativo" || usuarioSistema?.status === "Bloqueado") {
  alert("Usuário inativo ou bloqueado. Procure o administrador.");
  await supabase.auth.signOut();
  localStorage.removeItem("usuarioLogado");
  return;
}
    router.push("/sistema");
  }

  return (
  <div className="min-h-screen bg-[#061426] flex items-center justify-center p-6">
    <div className="w-full max-w-md card">
      <div className="flex flex-col items-center mb-6">
        <img
          src="/brasao-gcm-v2.png"
          alt="Brasão GCM Biritinga"
          className="w-16 h-16 object-contain"
        />

        <h1 className="text-2xl font-bold mt-4">
          SIG-GCM Brasil
        </h1>

        <p className="text-slate-400 text-sm text-center">
          Sistema Integrado das Guardas Municipais
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Email</label>

          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Senha</label>

          <input
            className="input"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={entrar}
          disabled={carregando}
          className="btn-primary w-full disabled:opacity-50"
        >
          {carregando ? "Entrando..." : "Entrar no Sistema"}
        </button>
      </div>

      <div className="text-center mt-6 space-y-2">
        <p className="text-xs text-slate-500">
          Acesso restrito à Guarda Civil Municipal de Biritinga
        </p>

        <div className="border-t border-slate-800 pt-4">
          <p className="text-xs text-slate-500">
            SIG-GCM Brasil © {new Date().getFullYear()}
          </p>

          <p className="text-xs text-blue-400 font-semibold">
            Desenvolvido por Maick Lustosa Costa
          </p>
        </div>
      </div>
    </div>
  </div>
);
}