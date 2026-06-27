"use client";

import Link from "next/link";

export default function GuarnicaoPage() {
  return (
    <main className="min-h-screen bg-[#02060f] text-white p-5">
      
        <button
  onClick={() => window.history.back()}
  className="mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl"
>
  ← Voltar
</button>

      <h1 className="text-3xl font-black mb-5">
        🚔 Guarnição do Dia
      </h1>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
        <h2 className="text-2xl font-black">
          VTR-01 / ALFA
        </h2>

        <p className="text-green-400 mt-2">
          ● Em andamento
        </p>

        <div className="mt-6 space-y-3">
          <div className="bg-slate-800 rounded-2xl p-3">
            👮 Comandante
          </div>

          <div className="bg-slate-800 rounded-2xl p-3">
            👮 Integrante
          </div>

          <div className="bg-slate-800 rounded-2xl p-3">
            👮 Integrante
          </div>
        </div>
      </div>
    </main>
    
  );
}