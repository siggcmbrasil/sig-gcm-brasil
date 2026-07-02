"use client";

import {
  CarFront,
  Fuel,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  CircleGauge,
  Truck,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Viaturas",
    icone: CarFront,
    href: "/sistema/viaturas",
    descricao:
      "Cadastro, consulta e controle da frota operacional.",
  },
  {
    titulo: "Abastecimentos",
    icone: Fuel,
    href: "/sistema/abastecimentos",
    descricao:
      "Controle de combustível e consumo das viaturas.",
  },
  {
    titulo: "Manutenções",
    icone: Wrench,
    href: "/sistema/manutencoes",
    descricao:
      "Registro de manutenções preventivas e corretivas.",
  },
  {
    titulo: "Checklist de Viaturas",
    icone: ClipboardCheck,
    href: "/sistema/checklist-viaturas",
    descricao:
      "Inspeção operacional antes e depois do serviço.",
  },
  {
    titulo: "Danos em Viaturas",
    icone: AlertTriangle,
    href: "/sistema/danos-viaturas",
    descricao:
      "Registro de avarias, danos e ocorrências com veículos.",
  },
  {
    titulo: "Pneus",
    icone: CircleGauge,
    href: "/sistema/pneus",
    descricao:
      "Controle de pneus, trocas, vida útil e manutenção.",
  },
];

export default function CentralFrotaPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Frota"
        descricao="Gestão completa das viaturas, abastecimentos, manutenções e controle da frota operacional."
        icone={Truck}
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