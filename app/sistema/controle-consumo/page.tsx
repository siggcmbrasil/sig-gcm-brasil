"use client";

import {
  Fuel,
  PlusCircle,
  FileText,
  BarChart3,
  Droplets,
  Wallet,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Novo Abastecimento",
    href: "/sistema/controle-consumo/novo",
    descricao:
      "Registrar abastecimentos e consumo das viaturas.",
    icone: PlusCircle,
  },
  {
    titulo: "Abastecimentos",
    href: "/sistema/abastecimentos",
    descricao:
      "Lista de abastecimentos realizados pelas viaturas.",
    icone: Fuel,
  },
  {
    titulo: "Controle de Combustível",
    href: "/sistema/controle-consumo/combustivel",
    descricao:
      "Controle de litros, consumo médio e autonomia.",
    icone: Droplets,
  },
  {
    titulo: "Despesas",
    href: "/sistema/controle-consumo/despesas",
    descricao:
      "Controle de gastos com combustível e manutenção.",
    icone: Wallet,
  },
  {
    titulo: "Relatórios",
    href: "/sistema/controle-consumo/relatorios",
    descricao:
      "Relatórios de abastecimentos e consumo.",
    icone: FileText,
  },
  {
    titulo: "Estatísticas",
    href: "/sistema/controle-consumo/estatisticas",
    descricao:
      "Indicadores e gráficos de consumo das viaturas.",
    icone: BarChart3,
  },
];

export default function ControleConsumoPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Controle de Consumo"
        descricao="Gestão de abastecimentos, combustível, despesas e indicadores das viaturas."
        icone={Fuel}
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