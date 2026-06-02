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

    localStorage.setItem(
      "usuarioLogado",
      JSON.stringify({
        id: data.user.id,
        nome: data.user.email,
        email: data.user.email,
        perfil: "admin",
      })
    );

    router.push("/sistema");
  }

  return (
    <div className="min-h-screen bg-[#061426] flex items-center justify-center p-6">
      <div className="w-full max-w-md card">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/brasao-gcm.png"
            alt="Brasão GCM Biritinga"
            width={110}
            height={110}
            priority
          />

          <h1 className="text-2xl font-bold mt-4">SIG-GCM Biritinga</h1>

          <p className="text-slate-400 text-sm text-center">
            Sistema Integrado da Guarda Civil Municipal
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

        <p className="text-xs text-slate-500 text-center mt-6">
          Acesso restrito à Guarda Civil Municipal de Biritinga
        </p>
      </div>
    </div>
  );
}