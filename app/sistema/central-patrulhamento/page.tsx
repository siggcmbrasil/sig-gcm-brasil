"use client";

import {
  CarFront,
  Route,
  Map,
  BarChart3,
  FileText,
  ClipboardList,
  Activity,
  History,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Patrulhamentos",
    href: "/sistema/patrulhamento",
    descricao: "Registro e acompanhamento das rondas realizadas.",
    icone: CarFront,
  },
  {
    titulo: "Nova Ronda",
    href: "/sistema/patrulhamento",
    descricao: "Iniciar um novo patrulhamento operacional.",
    icone: Route,
  },
  {
    titulo: "Plano de Rondas",
    href: "/sistema/rondas",
    descricao: "Planejamento e organização das rondas preventivas.",
    icone: ClipboardList,
  },
  {
    titulo: "Mapa de Patrulhamento",
    href: "/sistema/mapa-operacional",
    descricao: "Visualização geográfica das equipes e patrulhamentos.",
    icone: Map,
  },
  {
    titulo: "Rastreamento em Tempo Real",
    href: "/sistema/localizacao",
    descricao: "Monitoramento das equipes em serviço.",
    icone: Activity,
  },
  {
    titulo: "Histórico de Rotas",
    href: "/sistema/patrulhamento/rotas",
    descricao: "Consulta de patrulhamentos e rotas executadas.",
    icone: History,
  },
  {
    titulo: "Relatórios",
    href: "/sistema/relatorios",
    descricao: "Relatórios de rondas e patrulhamentos.",
    icone: FileText,
  },
  {
    titulo: "Estatísticas",
    href: "/sistema/estatisticas",
    descricao: "Indicadores e desempenho operacional.",
    icone: BarChart3,
  },
];

export default function CentralPatrulhamentoPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Patrulhamento"
        descricao="Controle das rondas, equipes, rastreamento e monitoramento operacional."
        icone={CarFront}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <SigCentralCard
            key={`${card.href}-${card.titulo}`}
            titulo={card.titulo}
            descricao={card.descricao}
            href={card.href}
            icone={card.icone}
          />
        ))}
      </div>
    </section>
  );
}