"use client";

import Link from "next/link";
import { CalendarDays, FileText, BarChart3 } from "lucide-react";

export default function RelatorioMensalPage() {
  const hoje = new Date();

  const mes = hoje.toLocaleString("pt-BR", {
    month: "long",
  });

  const ano = hoje.getFullYear();

  return (
    <div className="p-4 md:p-6 space-y-6 pb-24">
      <div className="painel-premium p-6">
        <h1 className="text-3xl md:text-4xl font-black text-white">
          📅 Relatório Mensal
        </h1>

        <p className="text-slate-400 mt-2">
          Relatório operacional consolidado de{" "}
          <span className="font-bold capitalize">
            {mes} de {ano}
          </span>.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="painel-premium p-6">
          <div className="flex items-center gap-3 mb-4">
            <CalendarDays className="w-8 h-8 text-cyan-400" />

            <h2 className="text-2xl font-black text-white">
              Mês Atual
            </h2>
          </div>

          <p className="text-slate-400 mb-6">
            Gere automaticamente o relatório completo do mês atual.
          </p>

          <Link
            href="/sistema/relatorios/plantao?tipo=mensal"
            className="sig-btn-gold inline-flex"
          >
            Gerar Relatório Mensal
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
            <li>• Ocorrências do mês</li>
            <li>• Patrulhamentos</li>
            <li>• Chamados</li>
            <li>• Pessoas abordadas</li>
            <li>• Veículos abordados</li>
            <li>• Abastecimentos</li>
            <li>• Estatísticas gerais</li>
            <li>• Exportação em PDF</li>
          </ul>
        </div>
      </div>

      <div className="painel-premium p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-8 h-8 text-cyan-400" />

          <h2 className="text-2xl font-black text-white">
            Indicadores do Mês
          </h2>
        </div>

        <p className="text-slate-400">
          Esta área poderá exibir futuramente:
        </p>

        <ul className="text-slate-400 mt-4 space-y-2">
          <li>• Gráfico de ocorrências por dia</li>
          <li>• Bairros com mais atendimentos</li>
          <li>• Guardas mais ativos</li>
          <li>• Viaturas mais utilizadas</li>
          <li>• Consumo de combustível</li>
          <li>• Comparativo com o mês anterior</li>
        </ul>
      </div>
    </div>
  );
}