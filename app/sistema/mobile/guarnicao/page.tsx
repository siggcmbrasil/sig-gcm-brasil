"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Car,
  Clock,
  Shield,
  Users,
} from "lucide-react";

import MobileBottomNav from "@/components/MobileBottomNav";

export default function GuarnicaoPage() {
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
    <main className="min-h-screen bg-[#02060f] text-white p-5 pb-28">
      <button
        onClick={() => window.history.back()}
        className="mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2 active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 mb-5">
        <p className="text-xs text-blue-400 font-bold">
          {usuario?.municipio_nome || "SIG-GCM Brasil"}
        </p>

        <h1 className="text-3xl font-black mt-1">
          🚔 Guarnição do Dia
        </h1>

        <p className="text-slate-400 mt-2">
          Informações da equipe escalada em serviço.
        </p>
      </section>

      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/20 flex items-center justify-center">
            <Car className="w-8 h-8 text-blue-400" />
          </div>

          <div>
            <h2 className="text-2xl font-black">
              VTR-01 / ALFA
            </h2>

            <p className="text-green-400 font-bold">
              ● Em serviço
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <Clock className="w-6 h-6 text-yellow-400 mb-2" />

            <p className="text-xs text-slate-400">
              Início do Plantão
            </p>

            <h3 className="font-black text-lg">
              07:00
            </h3>
          </div>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <Shield className="w-6 h-6 text-emerald-400 mb-2" />

            <p className="text-xs text-slate-400">
              Status
            </p>

            <h3 className="font-black text-lg text-emerald-400">
              Operacional
            </h3>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-black text-lg mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            Integrantes
          </h3>

          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              👮 Comandante da Guarnição
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              👮 Integrante
            </div>

            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
              👮 Integrante
            </div>
          </div>
        </div>
      </section>

      <MobileBottomNav />
    </main>
  );
}