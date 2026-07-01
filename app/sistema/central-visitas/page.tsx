"use client";

import {
  Handshake,
  PlusCircle,
  School,
  Store,
  FileText,
  BarChart3,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Visitas Preventivas",
    href: "/sistema/visitas",
    descricao: "Ações preventivas, comunitárias e institucionais.",
    icone: Handshake,
  },
  {
    titulo: "Nova Visita",
    href: "/sistema/visitas",
    descricao: "Registrar nova visita preventiva.",
    icone: PlusCircle,
  },
  {
    titulo: "Guarda na Escola",
    href: "/sistema/visitas",
    descricao: "Acompanhamento de ações em unidades escolares.",
    icone: School,
  },
  {
    titulo: "Comércio Protegido",
    href: "/sistema/visitas",
    descricao: "Visitas preventivas em comércios e áreas públicas.",
    icone: Store,
  },
  {
    titulo: "Relatórios",
    href: "/sistema/relatorios",
    descricao: "Relatórios das visitas preventivas.",
    icone: FileText,
  },
  {
    titulo: "Estatísticas",
    href: "/sistema/estatisticas",
    descricao: "Indicadores das ações preventivas.",
    icone: BarChart3,
  },
];

export default function CentralVisitasPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Visitas Preventivas"
        descricao="Ações preventivas, Guarda na Escola, comércio protegido e visitas comunitárias."
        icone={Handshake}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <SigCentralCard key={card.href} {...card} />
        ))}
      </div>
    </section>
  );
}