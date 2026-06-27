"use client";

import Link from "next/link";

export default function HistoricoArmaria() {
  return (
    <div className="p-6">

      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Histórico da Armaria
        </h1>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">

        <Link href="/sistema/armamentos" className="painel-premium p-5">
          🔫 Armamentos
        </Link>

        <Link href="/sistema/cautelas" className="painel-premium p-5">
          📝 Cautelas
        </Link>

        <Link href="/sistema/municoes" className="painel-premium p-5">
          🎯 Munições
        </Link>

      </div>

    </div>
  );
}