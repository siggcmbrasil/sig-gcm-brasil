"use client";

import { useState } from "react";

export default function SecaoRecolhivel({
  icone,
  titulo,
  descricao,
  contador,
  abertaInicial = false,
  children,
}: {
  icone: string;
  titulo: string;
  descricao?: string;
  contador?: number;
  abertaInicial?: boolean;
  children: React.ReactNode;
}) {
  const [aberta, setAberta] = useState(abertaInicial);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/40 shadow-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setAberta(!aberta)}
        className="w-full flex items-center justify-between p-5 md:p-6 hover:bg-slate-900/50 transition"
      >
        <div className="flex items-center gap-4 text-left">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl">
            {icone}
          </div>

          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white">
              {titulo} {contador !== undefined ? `(${contador})` : ""}
            </h2>

            {descricao && (
              <p className="text-slate-400 text-sm mt-1">
                {descricao}
              </p>
            )}
          </div>
        </div>

        <span className="text-2xl text-slate-300">
          {aberta ? "▲" : "▼"}
        </span>
      </button>

      {aberta && (
        <div className="border-t border-slate-800 p-5 md:p-6">
          {children}
        </div>
      )}
    </section>
  );
}