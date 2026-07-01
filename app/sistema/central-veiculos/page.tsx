"use client";

import {
  CarFront,
  PlusCircle,
  FileText,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Novo Veículo",
    href: "/sistema/veiculos/novo",
    descricao:
      "Cadastrar um novo veículo abordado.",
    icone: PlusCircle,
  },
  {
    titulo: "Veículos Abordados",
    href: "/sistema/veiculos",
    descricao:
      "Lista e gerenciamento dos veículos abordados.",
    icone: CarFront,
  },
  {
    titulo: "Relatório de Abordagens",
    href: "/sistema/veiculos/relatorio",
    descricao:
      "Relatório dos veículos abordados e registros operacionais.",
    icone: FileText,
  },
];

export default function CentralVeiculosPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Veículos"
        descricao="Cadastro, lista e relatórios dos veículos abordados."
        icone={CarFront}
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