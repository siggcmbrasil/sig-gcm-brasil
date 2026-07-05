"use client";

import Link from "next/link";
import { CalendarDays, FileText } from "lucide-react";

export default function RelatorioAnualPage() {
  const ano = new Date().getFullYear();

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      <div className="painel-premium p-6">
        <h1 className="text-3xl md:text-4xl font-black text-white">
          📚 Relatório Anual
        </h1>

        <p className="text-slate-400 mt-2">
          Relatório operacional consolidado do ano de {ano}.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="painel-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="w-8 h-8 text-cyan-400" />

            <h2 className="text-2xl font-black text-white">
              Ano Atual
            </h2>
          </div>

          <p className="text-slate-400 mb-6">
            Gere automaticamente o relatório completo de {ano}.
          </p>

          <Link
            href="/sistema/relatorios/plantao?tipo=anual"
            className="sig-btn-gold inline-flex"
          >
            Gerar Relatório Anual
          </Link>
        </div>

        <div className="painel-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-cyan-400" />

            <h2 className="text-2xl font-black text-white">
              O que entra no relatório
            </h2>
          </div>

          <ul className="text-slate-400 space-y-2">
            <li>• Ocorrências do ano</li>
            <li>• Patrulhamentos do ano</li>
            <li>• Chamados do ano</li>
            <li>• Pessoas abordadas</li>
            <li>• Veículos abordados</li>
            <li>• Estatísticas gerais</li>
            <li>• Exportação em PDF</li>
          </ul>
        </div>
      </div>
    </div>
  );
}