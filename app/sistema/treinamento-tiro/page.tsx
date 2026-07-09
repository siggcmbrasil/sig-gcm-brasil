"use client";

import Link from "next/link";
import {
  Activity,
  BarChart3,
  Camera,
  Crosshair,
  FileText,
  Medal,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  UserCheck,
} from "lucide-react";

export default function TreinamentoTiroPage() {
  const cards = [
    {
      titulo: "Novo Treino",
      descricao: "Iniciar simulação com câmera e laser.",
      href: "/sistema/treinamento-tiro/novo",
      icon: Target,
    },
    {
      titulo: "Calibração",
      descricao: "Ajustar câmera, alvo e área de detecção.",
      href: "/sistema/treinamento-tiro/calibracao",
      icon: Camera,
    },
    {
      titulo: "Exercícios",
      descricao: "Modelos de treino: precisão, reação e tático.",
      href: "/sistema/treinamento-tiro/exercicios",
      icon: Crosshair,
    },
    {
      titulo: "Guardas",
      descricao: "Histórico de desempenho por servidor.",
      href: "/sistema/treinamento-tiro/guardas",
      icon: UserCheck,
    },
    {
      titulo: "Ranking",
      descricao: "Classificação por pontuação e precisão.",
      href: "/sistema/treinamento-tiro/ranking",
      icon: Trophy,
    },
    {
      titulo: "Estatísticas",
      descricao: "Médias, evolução, agrupamento e reação.",
      href: "/sistema/treinamento-tiro/estatisticas",
      icon: BarChart3,
    },
    {
      titulo: "Relatórios",
      descricao: "Relatórios em PDF dos treinamentos.",
      href: "/sistema/treinamento-tiro/relatorios",
      icon: FileText,
    },
    {
      titulo: "Configurações",
      descricao: "Alvos, armas, distâncias e parâmetros.",
      href: "/sistema/treinamento-tiro/configuracoes",
      icon: Settings,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-6 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-5 md:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">
                  <ShieldCheck className="text-emerald-400" size={28} />
                </div>

                <div>
                  <h1 className="text-2xl md:text-4xl font-bold">
                    Centro de Treinamento de Tiro
                  </h1>
                  <p className="text-slate-400 text-sm md:text-base">
                    Simulador operacional com laser, câmera, pontuação,
                    reação, agrupamento e histórico por guarda.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/sistema/treinamento-tiro/novo"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 hover:bg-emerald-400 transition"
            >
              <Target size={20} />
              Iniciar Treino
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Indicador titulo="Treinos realizados" valor="0" icon={Activity} />
          <Indicador titulo="Média de pontuação" valor="0%" icon={Target} />
          <Indicador titulo="Tempo médio reação" valor="0,00s" icon={Crosshair} />
          <Indicador titulo="Melhor guarda" valor="-" icon={Medal} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.titulo}
                href={card.href}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] p-5 hover:border-emerald-400/50 hover:bg-emerald-400/5 transition"
              >
                <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:bg-emerald-500/10">
                  <Icon className="text-emerald-400" size={25} />
                </div>

                <h2 className="text-lg font-bold">{card.titulo}</h2>
                <p className="text-sm text-slate-400 mt-1">{card.descricao}</p>
              </Link>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function Indicador({
  titulo,
  valor,
  icon: Icon,
}: {
  titulo: string;
  valor: string;
  icon: any;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">{titulo}</p>
          <strong className="text-2xl font-bold">{valor}</strong>
        </div>

        <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 border border-emerald-400/20 flex items-center justify-center">
          <Icon className="text-emerald-400" size={22} />
        </div>
      </div>
    </div>
  );
}