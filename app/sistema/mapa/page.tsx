"use client";

import dynamic from "next/dynamic";

const MapaLeaflet = dynamic(() => import("./MapaLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="h-175 flex items-center justify-center">
      Carregando mapa...
    </div>
  ),
});

export default function Mapa() {
  return (
    <div className="p-6">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Mapa Operacional</h1>
        <p className="text-slate-400">
          Monitoramento operacional da GCM Biritinga.
        </p>
      </header>

      <div className="card p-0 overflow-hidden">
        <MapaLeaflet />
      </div>
    </div>
  );
}