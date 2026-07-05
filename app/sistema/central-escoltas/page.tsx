"use client";

import { CarFront, FileText, PlusCircle } from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Nova Escolta",
    href: "/sistema/escoltas/nova",
    descricao: "Cadastrar uma nova escolta ou deslocamento oficial.",
    icone: PlusCircle,
  },
  {
    titulo: "Escoltas",
    href: "/sistema/escoltas",
    descricao: "Lista e gerenciamento das escoltas registradas.",
    icone: CarFront,
  },
  {
    titulo: "Relatório de Escoltas",
    href: "/sistema/escoltas/relatorio",
    descricao: "Relatórios das escoltas e deslocamentos realizados.",
    icone: FileText,
  },
];

export default function CentralEscoltasPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Escoltas"
        descricao="Controle de escoltas, deslocamentos oficiais e apoios com viaturas."
        icone={CarFront}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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