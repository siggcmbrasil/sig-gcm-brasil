"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function RelatoriosMobilePage() {
  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-24">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/sistema/mobile" className="p-2 rounded-xl bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-black">Relatórios</h1>
          <p className="text-slate-400 text-sm">
            Relatórios operacionais do plantão.
          </p>
        </div>
      </header>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center">
        <ClipboardList className="w-16 h-16 text-purple-400 mx-auto mb-4" />

        <h2 className="text-xl font-bold">Relatório de Plantão</h2>

        <p className="text-slate-400 text-sm mt-2">
          Gere e consulte relatórios operacionais.
        </p>

        <Link
          href="/sistema/relatorios/plantao"
          className="mt-6 bg-purple-600 hover:bg-purple-500 rounded-2xl py-3 px-4 font-bold block"
        >
          Abrir Relatórios
        </Link>
      </div>

<MobileBottomNav />

    </main>
  );
}