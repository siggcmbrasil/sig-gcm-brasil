"use client";

import { useState } from "react";

export default function IAConsultaPage() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function consultarIA() {
    if (!pergunta.trim()) return;

    setCarregando(true);
    setResposta("");

    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pergunta }),
      });

      const data = await res.json();

      setResposta(data.resposta || data.erro || "Sem resposta.");
    } catch {
      setResposta("Erro ao conectar com a IA.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-2xl bg-slate-900 p-6 text-white shadow">
          <h1 className="text-2xl font-bold">🤖 Inteligência Artificial</h1>
          <p className="mt-2 text-sm text-slate-300">
            Consulte a IA para gerar relatórios, textos oficiais e análises do sistema.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow">
          <label className="mb-2 block font-semibold text-slate-700">
            Pergunta para a IA
          </label>

          <textarea
            value={pergunta}
            onChange={(e) => setPergunta(e.target.value)}
            placeholder="Ex: Gere um relatório profissional sobre uma ocorrência de perturbação do sossego."
            className="min-h-32 w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-blue-600"
          />

          <button
            onClick={consultarIA}
            disabled={carregando}
            className="mt-4 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {carregando ? "Consultando..." : "Consultar IA"}
          </button>
        </div>

        {resposta && (
          <div className="mt-6 rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-3 text-lg font-bold text-slate-800">
              Resposta da IA
            </h2>

            <div className="whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-slate-700">
              {resposta}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}