"use client";

import {
  BarChart3,
  Search,
  Map,
  Activity,
  ShieldAlert,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
    {
    titulo: "Central SOS",
    icone: ShieldAlert,
    href: "/sistema/central-sos",
    descricao:
      "Monitoramento de alertas SOS, emergência e apoio imediato às equipes.",
  },
  {
    titulo: "Estatísticas",
    icone: BarChart3,
    href: "/sistema/estatisticas",
    descricao:
      "Indicadores, gráficos e desempenho operacional.",
  },
  {
    titulo: "Mapa Operacional",
    icone: Map,
    href: "/sistema/mapa-operacional",
    descricao:
      "Visualização geográfica de ocorrências, equipes e pontos estratégicos.",
  },
  {
    titulo: "Localização em Tempo Real",
    icone: Activity,
    href: "/sistema/localizacao",
    descricao:
      "Monitoramento em tempo real das equipes e viaturas em serviço.",
  },
  {
    titulo: "Mancha Criminal",
    icone: Activity,
    href: "/sistema/mancha-criminal",
    descricao:
      "Mapa de calor e análise das áreas de maior incidência.",
  },
  {
    titulo: "Indicadores Operacionais",
    icone: BarChart3,
    href: "/sistema/indicadores",
    descricao:
      "Métricas e acompanhamento operacional em tempo real.",
  },
  {
    titulo: "Análise de Ocorrências",
    icone: Search,
    href: "/sistema/analise-ocorrencias",
    descricao:
      "Cruzamento e análise inteligente das ocorrências.",
  },
  {
    titulo: "Alertas Operacionais",
    icone: Activity,
    href: "/sistema/alertas",
    descricao:
      "Alertas automáticos e monitoramento de eventos críticos.",
  },
];
export default function CentralInteligenciaPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
  titulo="Central de Inteligência"
  descricao="Análise de dados, indicadores, mapas estratégicos e apoio à tomada de decisão."
  icone={Activity}
/>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <SigCentralCard
            key={card.href}
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