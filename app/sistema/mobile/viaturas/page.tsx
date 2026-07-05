"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Car,
  Fuel,
  MapPinned,
  Settings,
  Wrench,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";

export default function ViaturasMobilePage() {
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
      <header className="mb-6">
        <Link
          href="/sistema/mobile"
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm mb-5 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>

        <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
          <p className="text-blue-400 text-sm font-bold">
            {usuario?.municipio_nome || "SIG-GCM Brasil"}
          </p>

          <h1 className="text-3xl font-black mt-1">
            Viaturas
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            Consulta, frota, manutenção, abastecimento e operação.
          </p>
        </section>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/sistema/viaturas"
          className="rounded-3xl bg-green-600 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Car className="w-12 h-12 mb-3" />
          <span className="font-black">Frota</span>
        </Link>

        <Link
          href="/sistema/abastecimentos"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Fuel className="w-12 h-12 mb-3 text-yellow-400" />
          <span className="font-black">Abastecimento</span>
        </Link>

        <Link
          href="/sistema/manutencoes"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Wrench className="w-12 h-12 mb-3 text-orange-400" />
          <span className="font-black">Manutenção</span>
        </Link>

        <Link
          href="/sistema/mapa-operacional"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <MapPinned className="w-12 h-12 mb-3 text-cyan-400" />
          <span className="font-black">Mapa</span>
        </Link>
      </div>

      <div className="mt-5 rounded-3xl border border-green-500/20 bg-green-500/10 p-5">
        <div className="flex gap-3 items-start">
          <Settings className="w-6 h-6 text-green-400 flex-shrink-0" />

          <p className="text-sm text-slate-300">
            Use esta área para acessar rapidamente a frota, controlar
            abastecimentos, manutenções e acompanhar viaturas no mapa operacional.
          </p>
        </div>
      </div>

      <MobileBottomNav />
    </main>
  );
}