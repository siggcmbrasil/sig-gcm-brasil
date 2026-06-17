"use client";

import { useState } from "react";

export default function IaJuridicaPage() {
  const [pergunta, setPergunta] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function consultarIA() {
    if (!pergunta.trim()) {
      alert("Digite sua pergunta jurídica.");
      return;
    }

    setCarregando(true);
    setResposta("");

    try {
      const res = await fetch("/api/ia", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pergunta,
          modo: "juridica",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.erro || "Erro ao consultar IA Jurídica.");
      }

      setResposta(data.resposta || "Nenhuma resposta retornada.");
    } catch (error: any) {
      setResposta(error.message || "Erro inesperado ao consultar IA.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <section className="p-6 text-white space-y-6">
      <div>
        <h1 className="text-3xl font-black mb-2">
          ⚖️ IA Jurídica
        </h1>

        <p className="text-slate-400">
          Consulta jurídica orientativa para apoio operacional da Guarda Municipal.
        </p>
      </div>

      <div className="painel-premium p-6 space-y-4">
        <textarea
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          placeholder="Ex: A Guarda Municipal pode realizar abordagem preventiva em via pública?"
          className="input h-40"
        />

        <button
          onClick={consultarIA}
          disabled={carregando}
          className="btn-primary disabled:opacity-50"
        >
          {carregando ? "Consultando..." : "Consultar IA Jurídica"}
        </button>
      </div>

      {resposta && (
        <div className="painel-premium p-6 border border-blue-500/30">
          <h2 className="text-xl font-black mb-3">
            Resposta da IA
          </h2>

          <div className="whitespace-pre-wrap text-slate-200 leading-relaxed">
            {resposta}
          </div>

          <p className="text-xs text-yellow-400 mt-5">
            ⚠️ Resposta orientativa. Não substitui parecer jurídico oficial.
          </p>
        </div>
      )}
    </section>
  );
}