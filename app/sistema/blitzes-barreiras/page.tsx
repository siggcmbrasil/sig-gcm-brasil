"use client";

import Link from "next/link";
import { ShieldCheck, Siren } from "lucide-react";

export default function BlitzesBarreirasPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">
          Blitze e Barreiras
        </h1>

        <p className="text-slate-400 mt-2">
          Escolha o tipo de operação que deseja registrar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/sistema/blitzes">
          <div className="painel-premium p-6 hover:border-yellow-400 transition cursor-pointer">
            <Siren className="text-yellow-400 mb-4" size={42} />
            <h2 className="text-2xl font-black">Blitzes</h2>
            <p className="text-slate-400 mt-2">
              Operações de fiscalização, trânsito e saturação.
            </p>
          </div>
        </Link>

        <Link href="/sistema/barreiras">
          <div className="painel-premium p-6 hover:border-yellow-400 transition cursor-pointer">
            <ShieldCheck className="text-cyan-400 mb-4" size={42} />
            <h2 className="text-2xl font-black">Barreiras</h2>
            <p className="text-slate-400 mt-2">
              Barreiras educativas, preventivas e operacionais.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}