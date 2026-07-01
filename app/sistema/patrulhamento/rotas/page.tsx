"use client";

import { History, Map, Route } from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function HistoricoRotasPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Histórico de Rotas"
        subtitulo="Consulta das rotas registradas durante os patrulhamentos."
        icone={History}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <Route className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Rotas</h3>
          <p className="text-slate-400 text-sm mt-2">
            Patrulhamentos com pontos GPS registrados.
          </p>
        </SigCard>

        <SigCard>
          <Map className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Mapa</h3>
          <p className="text-slate-400 text-sm mt-2">
            Visualização futura das rotas percorridas.
          </p>
        </SigCard>

        <SigCard>
          <History className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Histórico</h3>
          <p className="text-slate-400 text-sm mt-2">
            Registro cronológico dos deslocamentos.
          </p>
        </SigCard>
      </div>

      <SigCard>
        <div className="text-center py-16">
          <History className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

          <h2 className="text-2xl font-black text-white">
            Histórico de rotas em organização
          </h2>

          <p className="text-slate-400 mt-2">
            As rotas capturadas pelo GPS dos patrulhamentos aparecerão aqui.
          </p>
        </div>
      </SigCard>
    </div>
  );
}