"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  ArrowLeft,
  MapPinned,
  PlayCircle,
  Route,
  Shield,
} from "lucide-react";

export default function PatrulhamentoMobilePage() {
  const router = useRouter();
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
        type="button"
        onClick={() => router.push("/sistema/mobile")}
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
          Patrulhamento GPS
        </h1>

        <p className="text-slate-400 text-sm mt-2">
          Inicie o rastreamento, acompanhe rotas e registre deslocamentos em campo.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => router.push("/sistema/patrulhamento")}
          className="rounded-3xl bg-blue-700 border border-blue-500 p-5 flex items-center gap-4 active:scale-95"
        >
          <PlayCircle className="w-10 h-10 text-white" />

          <div className="text-left">
            <h2 className="text-xl font-black">Abrir Rastreamento</h2>
            <p className="text-blue-100 text-sm">
              Iniciar ou acompanhar patrulhamento GPS.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/sistema/rondas")}
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex items-center gap-4 active:scale-95"
        >
          <Route className="w-10 h-10 text-yellow-400" />

          <div className="text-left">
            <h2 className="text-xl font-black">Rondas</h2>
            <p className="text-slate-400 text-sm">
              Pontos de ronda, QR Code e validações.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => router.push("/sistema/mapa-operacional")}
          className="rounded-3xl bg-slate-900 border border-slate-800 p-5 flex items-center gap-4 active:scale-95"
        >
          <MapPinned className="w-10 h-10 text-emerald-400" />

          <div className="text-left">
            <h2 className="text-xl font-black">Mapa Operacional</h2>
            <p className="text-slate-400 text-sm">
              Ver viaturas, GPS, ocorrências e alertas SOS.
            </p>
          </div>
        </button>
      </div>

      <div className="mt-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
        <div className="flex gap-3 items-start">
          <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0" />

          <p className="text-sm text-slate-300">
            Mantenha o GPS ativado durante o patrulhamento para registrar
            rotas com maior precisão e alimentar o mapa operacional.
          </p>
        </div>
      </div>

      <MobileBottomNav />
    </main>
  );
}