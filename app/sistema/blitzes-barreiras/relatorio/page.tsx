"use client";

import {
  Shield,
  FileText,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function RelatorioBlitzesPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Relatório de Operações"
        subtitulo="Relatórios de blitzes e barreiras."
        icone={FileText}
      />

      <SigCard>
        <div className="flex items-center gap-4">
          <Shield
            size={40}
            className="text-yellow-400"
          />

          <div>
            <h2 className="font-black text-xl">
              Relatórios Operacionais
            </h2>

            <p className="text-slate-400">
              Estatísticas e relatórios das
              operações realizadas.
            </p>
          </div>
        </div>
      </SigCard>
    </div>
  );
}