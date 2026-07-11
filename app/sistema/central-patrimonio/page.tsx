"use client";

import {
  Package,
  Shield,
  Warehouse,
  ClipboardList,
  Radio,
  Boxes,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

const cards = [
  {
    titulo: "Equipamentos",
    icone: Radio,
    href: "/sistema/equipamentos",
    descricao:
      "Controle de rádios, coletes, cones, lanternas e materiais operacionais.",
  },
  {
    titulo: "Patrimônio",
    icone: Package,
    href: "/sistema/patrimonio",
    descricao:
      "Gestão dos bens patrimoniais e bens tombados da instituição.",
  },
  {
    titulo: "Almoxarifado",
    icone: Warehouse,
    href: "/sistema/almoxarifado",
    descricao:
      "Controle de entrada, saída e estoque de materiais.",
  },
  {
    titulo: "Inventário",
    icone: ClipboardList,
    href: "/sistema/inventario",
    descricao:
      "Inventário físico e conferência dos bens da Guarda.",
  },
];

export default function CentralPatrimonioPage() {
  return (
    <ProtecaoModulo modulo="patrimonio">
      <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Patrimônio"
        descricao="Gestão de equipamentos, bens, armamento, almoxarifado, cautelas e patrimônio institucional."
        icone={Boxes}
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
    </ProtecaoModulo>
  );
}