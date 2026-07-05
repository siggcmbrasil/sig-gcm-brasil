"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MapPin,
  PlayCircle,
  Navigation,
  Route,
  Shield,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";

export default function GpsMobilePage() {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) {
      window.location.href = "/login";
      return;
    }

    const dados = JSON.parse(salvo);

    if (!dados?.id || !dados?.municipio_id) {
      window.location.href = "/login";
      return;
    }

    setUsuario(dados);
  }, []);

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-4 pb-28">
      <header className="flex items-center gap-3 mb-6">
        <Link
          href="/sistema/mobile"
          className="p-2 rounded-xl bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div>
          <h1 className="text-2xl font-black">
            GPS Operacional
          </h1>

          <p className="text-slate-400 text-sm">
            Patrulhamento e localização em tempo real.
          </p>
        </div>
      </header>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 mb-5">
        <p className="text-xs text-blue-400 font-bold">
          {usuario?.municipio_nome || "SIG-GCM Brasil"}
        </p>

        <h2 className="text-xl font-black mt-1">
          Rastreamento Operacional
        </h2>

        <p className="text-slate-400 text-sm mt-2">
          Compartilhe sua localização, acompanhe patrulhamento
          e registre rotas em tempo real.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/sistema/patrulhamento"
          className="rounded-3xl bg-blue-600 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <PlayCircle className="w-12 h-12 mb-3" />
          <span className="font-black">
            Patrulhamento
          </span>
        </Link>

        <Link
          href="/sistema/localizacao"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Navigation className="w-12 h-12 mb-3 text-emerald-400" />
          <span className="font-black">
            Equipes Online
          </span>
        </Link>

        <Link
          href="/sistema/mapa-operacional"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <MapPin className="w-12 h-12 mb-3 text-cyan-400" />
          <span className="font-black">
            Mapa Operacional
          </span>
        </Link>

        <Link
          href="/sistema/rondas"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Route className="w-12 h-12 mb-3 text-yellow-400" />
          <span className="font-black">
            Rotas e Rondas
          </span>
        </Link>
      </div>

      <div className="mt-5 rounded-3xl border border-blue-500/20 bg-blue-500/10 p-5">
        <div className="flex gap-3 items-start">
          <Shield className="w-6 h-6 text-blue-400 flex-shrink-0" />

          <div>
            <h3 className="font-black text-blue-300">
              Operação em Campo
            </h3>

            <p className="text-sm text-slate-300 mt-2">
              Mantenha o GPS ativado para melhorar a precisão
              do rastreamento, do botão SOS e das rotas
              operacionais.
            </p>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </main>
  );
}