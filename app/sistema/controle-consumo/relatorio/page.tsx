"use client";

import {
  FileText,
  Download,
  CalendarDays,
  BarChart3,
  Fuel,
  Wrench,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function RelatorioControleConsumoPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Relatório de Consumo"
        subtitulo="Relatórios de abastecimentos, peças, despesas e consumo das viaturas."
        icone={FileText}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Fuel className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Abastecimentos</h3>
          <p className="text-2xl font-black text-white mt-2">00</p>
        </SigCard>

        <SigCard>
          <Wrench className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Manutenções</h3>
          <p className="text-2xl font-black text-white mt-2">00</p>
        </SigCard>

        <SigCard>
          <BarChart3 className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Custo Total</h3>
          <p className="text-2xl font-black text-white mt-2">R$ 0,00</p>
        </SigCard>

        <SigCard>
          <CalendarDays className="w-8 h-8 text-purple-400 mb-3" />
          <h3 className="text-lg font-black text-white">Período</h3>
          <p className="text-sm font-bold text-slate-300 mt-2">
            Em construção
          </p>
        </SigCard>
      </div>

      <SigCard>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Data inicial</label>
            <input type="date" className="input" disabled />
          </div>

          <div>
            <label className="label">Data final</label>
            <input type="date" className="input" disabled />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              disabled
              className="btn-primary w-full inline-flex items-center justify-center gap-2 opacity-60"
            >
              <Download className="w-5 h-5" />
              Gerar Relatório
            </button>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white">
          Módulo em Construção
        </h2>

        <p className="text-slate-400 mt-2">
          Este relatório futuramente exibirá consumo por viatura,
          abastecimentos por período, gastos com peças, manutenção,
          custo médio por quilômetro e exportação em PDF.
        </p>
      </SigCard>
    </div>
  );
}