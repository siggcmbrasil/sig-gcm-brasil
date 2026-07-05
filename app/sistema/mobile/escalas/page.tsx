"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Shield,
  Users,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";

export default function EscalasMobilePage() {
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

      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5 mb-5">
        <p className="text-xs text-blue-400 font-bold">
          {usuario?.municipio_nome || "SIG-GCM Brasil"}
        </p>

        <h2 className="text-xl font-black mt-1">
          Escalas Operacionais
        </h2>

        <p className="text-slate-400 text-sm mt-2">
          Acompanhe escala, guarnição e serviço do dia.
        </p>
      </section>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/sistema/escalas-menu"
          className="rounded-3xl bg-yellow-500 text-black p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <CalendarDays className="w-12 h-12 mb-3" />
          <span className="font-black">Abrir Escalas</span>
        </Link>

        <Link
          href="/sistema/mobile/guarnicao"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Shield className="w-12 h-12 mb-3 text-blue-400" />
          <span className="font-black">Guarnição do Dia</span>
        </Link>

        <Link
          href="/sistema/guardas"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Users className="w-12 h-12 mb-3 text-emerald-400" />
          <span className="font-black">Guardas</span>
        </Link>

        <Link
          href="/sistema/relatorios/plantao"
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 min-h-36 flex flex-col items-center justify-center text-center active:scale-95"
        >
          <Clock className="w-12 h-12 mb-3 text-cyan-400" />
          <span className="font-black">Plantão</span>
        </Link>
      </div>

      <MobileBottomNav />
    </main>
  );
}