"use client";

import {
  ClipboardCheck,
  Star,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function AvaliacoesPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Avaliações"
        subtitulo="Gestão de avaliações de desempenho e acompanhamento profissional."
        icone={ClipboardCheck}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Star className="w-8 h-8 text-yellow-400 mb-3" />
          <h2 className="text-3xl font-black text-white">0</h2>
          <p className="text-slate-400 mt-2">
            Avaliações realizadas
          </p>
        </SigCard>

        <SigCard>
          <UserCheck className="w-8 h-8 text-cyan-400 mb-3" />
          <h2 className="text-3xl font-black text-white">0</h2>
          <p className="text-slate-400 mt-2">
            Guardas avaliados
          </p>
        </SigCard>

        <SigCard>
          <TrendingUp className="w-8 h-8 text-green-400 mb-3" />
          <h2 className="text-3xl font-black text-white">0%</h2>
          <p className="text-slate-400 mt-2">
            Média de desempenho
          </p>
        </SigCard>

        <SigCard>
          <ClipboardCheck className="w-8 h-8 text-orange-400 mb-3" />
          <h2 className="text-3xl font-black text-white">0</h2>
          <p className="text-slate-400 mt-2">
            Pendentes
          </p>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-2xl font-black text-white">
          Módulo em Desenvolvimento
        </h2>

        <p className="text-slate-400 mt-3">
          O módulo de Avaliações permitirá:
        </p>

        <div className="mt-4 space-y-2 text-slate-300">
          <p>• Avaliação periódica dos guardas;</p>
          <p>• Critérios de disciplina, produtividade e conduta;</p>
          <p>• Histórico completo de avaliações;</p>
          <p>• Geração de pareceres e relatórios;</p>
          <p>• Evolução profissional do servidor;</p>
          <p>• Integração com o Dossiê do Guarda;</p>
          <p>• Controle para promoções e progressões;</p>
          <p>• Estatísticas e indicadores de desempenho.</p>
        </div>
      </SigCard>
    </div>
  );
}