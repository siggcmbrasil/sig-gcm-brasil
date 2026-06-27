"use client";

import { useState } from "react";

type Props = {
  titulo: string;
  contador?: number;
  abertoInicial?: boolean;
  children: React.ReactNode;
};

export default function SecaoSimplesRetratil({
  titulo,
  contador,
  abertoInicial = false,
  children,
}: Props) {
  const [aberto, setAberto] = useState(abertoInicial);

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden">
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-800"
      >
        <span className="font-bold text-white">
          {aberto ? "▼" : "▶"} {titulo}
          {contador !== undefined ? ` (${contador})` : ""}
        </span>

        <span className="text-slate-400">
          {aberto ? "Fechar" : "Abrir"}
        </span>
      </button>

      {aberto && (
        <div className="border-t border-slate-700 p-5">
          {children}
        </div>
      )}
    </section>
  );
}