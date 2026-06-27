"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, PlayCircle } from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function GpsMobilePage() {
  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-24">
      <header className="flex items-center gap-3 mb-6">
        <Link href="/sistema/mobile" className="p-2 rounded-xl bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-black">GPS Operacional</h1>
          <p className="text-slate-400 text-sm">
            Patrulhamento e localização em tempo real.
          </p>
        </div>
      </header>

      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-center">
        <MapPin className="w-16 h-16 text-blue-400 mx-auto mb-4" />

        <h2 className="text-xl font-bold">Rastreamento GPS</h2>

        <p className="text-slate-400 text-sm mt-2">
          Use esta área para iniciar patrulhamento, registrar rota e acompanhar deslocamento.
        </p>

        <Link
          href="/sistema/patrulhamento"
          className="mt-6 bg-blue-600 hover:bg-blue-500 rounded-2xl py-3 px-4 font-bold flex items-center justify-center gap-2"
        >
          <PlayCircle className="w-5 h-5" />
          Abrir Patrulhamento
        </Link>
      </div>

<MobileBottomNav />

    </main>
  );
}