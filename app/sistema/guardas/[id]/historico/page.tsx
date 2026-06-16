"use client";

import { useParams } from "next/navigation";

export default function HistoricoPage() {
  const { id } = useParams();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">🎖️ Histórico Profissional</h1>
      <p className="text-slate-400 mb-6">Guarda ID: {id}</p>

      <div className="painel-premium p-6 space-y-4">
        <input className="input" placeholder="Título do registro" />
        <input type="date" className="input" />
        <textarea className="input h-32" placeholder="Descrição" />

        <button className="btn-primary w-full">
          Salvar Histórico
        </button>
      </div>
    </div>
  );
}