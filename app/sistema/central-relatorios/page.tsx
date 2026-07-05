"use client";

import {
  FileText,
  BarChart3,
  ClipboardList,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Relatório de Plantão",
    icone: ClipboardList,
    href: "/sistema/relatorio-plantao",
    descricao: "Relatório operacional completo do plantão.",
  },
  {
    titulo: "Relatórios",
    icone: BarChart3,
    href: "/sistema/relatorios",
    descricao: "Relatórios gerenciais e estatísticos.",
  },
];

export default function CentralRelatoriosPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Relatórios"
        descricao="Gestão completa de relatórios, documentos, estatísticas e exportações."
        icone={FileText}
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