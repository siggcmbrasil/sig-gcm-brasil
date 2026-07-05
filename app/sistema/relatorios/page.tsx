"use client";

import Link from "next/link";
import ProtecaoModulo from "@/components/ProtecaoModulo";
import {
  CalendarDays,
  CalendarRange,
  CalendarClock,
  BarChart3,
  PieChart,
  FileText,
  Bot,
} from "lucide-react";

const cards = [
  {
    titulo: "Relatório Diário",
    descricao: "Resumo operacional de um dia específico.",
    href: "/sistema/relatorios/plantao?tipo=diario",
    icone: CalendarDays,
  },
  {
    titulo: "Relatório Semanal",
    descricao: "Consolidado dos últimos 7 dias.",
    href: "/sistema/relatorios/plantao?tipo=semanal",
    icone: CalendarRange,
  },
  {
    titulo: "Relatório Quinzenal",
    descricao: "Consolidado dos últimos 15 dias.",
    href: "/sistema/relatorios/plantao?tipo=quinzenal",
    icone: CalendarClock,
  },
  {
    titulo: "Relatório Mensal",
    descricao: "Indicadores e estatísticas do mês.",
    href: "/sistema/relatorios/plantao?tipo=mensal",
    icone: BarChart3,
  },
  {
    titulo: "Relatório Bimestral",
    descricao: "Consolidado de dois meses.",
    href: "/sistema/relatorios/plantao?tipo=bimestral",
    icone: BarChart3,
  },
  {
    titulo: "Relatório Trimestral",
    descricao: "Indicadores dos últimos três meses.",
    href: "/sistema/relatorios/plantao?tipo=trimestral",
    icone: PieChart,
  },
  {
    titulo: "Relatório Semestral",
    descricao: "Prestação de contas dos últimos seis meses.",
    href: "/sistema/relatorios/plantao?tipo=semestral",
    icone: FileText,
  },
  {
    titulo: "Relatório Anual",
    descricao: "Anuário operacional da Guarda Municipal.",
    href: "/sistema/relatorios/plantao?tipo=anual",
    icone: FileText,
  },
  {
    titulo: "Relatório Personalizado",
    descricao: "Escolha qualquer período desejado.",
    href: "/sistema/relatorios/plantao",
    icone: CalendarRange,
  },
];

export default function RelatoriosPage() {
  return (
    <ProtecaoModulo modulo="relatorios">
      <div className="p-4 md:p-6 space-y-6 pb-24">
        <div className="painel-premium p-6">
          <h1 className="text-3xl md:text-4xl font-black text-white">
            📊 Central de Relatórios
          </h1>

          <p className="text-slate-400 mt-2">
            Relatórios operacionais, estatísticos e gerenciais do
            SIG-GCM Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {cards.map((card) => {
            const Icone = card.icone;

            return (
              <Link
                key={card.titulo}
                href={card.href}
                className="
                  painel-premium
                  p-6
                  hover:scale-[1.02]
                  hover:border-blue-500/40
                  transition-all
                  duration-300
                "
              >
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="
                      w-16 h-16
                      rounded-2xl
                      bg-blue-500/10
                      border border-blue-500/20
                      flex items-center justify-center
                    "
                  >
                    <Icone className="w-9 h-9 text-cyan-400" />
                  </div>

                  <span className="text-green-400 text-xs font-black">
                    RELATÓRIO
                  </span>
                </div>

                <h2 className="text-2xl font-black text-white">
                  {card.titulo}
                </h2>

                <p className="text-slate-400 text-sm mt-2">
                  {card.descricao}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </ProtecaoModulo>
  );
}