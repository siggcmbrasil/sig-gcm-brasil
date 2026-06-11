"use client";

import { useEffect, useState } from "react";

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");

    if (dados) {
      setUsuario(JSON.parse(dados));
    }
  }, []);

  return (
    <main className="min-h-screen bg-[#020b1c] text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="painel-premium p-6">
          <h1 className="text-3xl font-black mb-6">
            👤 Meu Perfil
          </h1>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400">Nome</p>
              <p className="font-bold text-xl">
                {usuario?.nome || "Não informado"}
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400">Matrícula</p>
              <p className="font-bold text-xl">
                {usuario?.matricula || "-"}
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400">Email</p>
              <p className="font-bold text-xl">
                {usuario?.email || "-"}
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
              <p className="text-slate-400">Perfil</p>
              <p className="font-bold text-xl text-green-400">
                {usuario?.perfil || "-"}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="bg-blue-600 px-5 py-3 rounded-xl font-bold">
              🔒 Alterar Senha
            </button>

            <button className="bg-yellow-600 px-5 py-3 rounded-xl font-bold">
              📝 Editar Dados
            </button>

            <button
              className="bg-red-600 px-5 py-3 rounded-xl font-bold"
              onClick={() => {
                localStorage.removeItem("usuarioLogado");
                window.location.href = "/login";
              }}
            >
              🚪 Sair do Sistema
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}