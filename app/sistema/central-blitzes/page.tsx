"use client";

import {
  Shield,
  PlusCircle,
  FileText,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Nova Blitz",
    href: "/sistema/blitzes-barreiras/nova",
    descricao:
      "Cadastrar uma nova blitz ou barreira operacional.",
    icone: PlusCircle,
  },
  {
    titulo: "Blitze e Barreiras",
    href: "/sistema/blitzes-barreiras",
    descricao:
      "Lista e gerenciamento das blitzes e barreiras registradas.",
    icone: Shield,
  },
  {
    titulo: "Relatório de Operações",
    href: "/sistema/blitzes-barreiras/relatorio",
    descricao:
      "Relatórios e indicadores das blitzes e barreiras realizadas.",
    icone: FileText,
  },
];

export default function CentralBlitzesPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Blitze e Barreiras"
        descricao="Fiscalizações, barreiras e operações preventivas."
        icone={Shield}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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