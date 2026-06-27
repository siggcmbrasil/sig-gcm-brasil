"use client";

import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function EscalasMobilePage() {
  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-24">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/sistema/mobile" className="p-2 rounded-xl bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-black">Escalas</h1>
          <p className="text-slate-400 text-sm">
            Consulta rápida das escalas de serviço.
          </p>
        </div>
      </header>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center">
        <CalendarDays className="w-16 h-16 text-yellow-400 mx-auto mb-4" />

        <h2 className="text-xl font-bold">Escalas Operacionais</h2>

        <p className="text-slate-400 text-sm mt-2">
          Acesse a tela completa de escalas do SIG-GCM Brasil.
        </p>

        <Link
          href="/sistema/escalas-menu"
          className="mt-6 bg-yellow-500 text-black rounded-2xl py-3 px-4 font-bold block"
        >
          Abrir Escalas
        </Link>
      </div>

<MobileBottomNav />

    </main>
  );
}