"use client";

import Link from "next/link";

export default function AdvertenciasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">
            Advertências
          </h1>
          <p className="text-slate-400">
            Controle disciplinar dos guardas.
          </p>
        </div>

        <Link
  href="/sistema/advertencias/nova"
  className="botao-premium"
>
  Nova Advertência
</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="painel-premium p-4">
          <p className="text-slate-400 text-sm">Total</p>
          <h2 className="text-3xl font-black">0</h2>
        </div>

        <div className="painel-premium p-4">
          <p className="text-slate-400 text-sm">Ativas</p>
          <h2 className="text-3xl font-black">0</h2>
        </div>

        <div className="painel-premium p-4">
          <p className="text-slate-400 text-sm">Este Mês</p>
          <h2 className="text-3xl font-black">0</h2>
        </div>
      </div>

      <div className="painel-premium p-6">
        <p className="text-slate-400">
          Nenhuma advertência cadastrada.
        </p>
      </div>
    </div>
  );
}