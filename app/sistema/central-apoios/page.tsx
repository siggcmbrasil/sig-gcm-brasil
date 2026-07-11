"use client";

import {
  PhoneCall,
  PlusCircle,
  FileText,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

const cards = [
  {
    titulo: "Novo Apoio",
    href: "/sistema/apoios/novo",
    descricao: "Cadastrar novo apoio operacional ou institucional.",
    icone: PlusCircle,
  },
  {
    titulo: "Apoios",
    href: "/sistema/apoios",
    descricao: "Lista e gerenciamento dos apoios registrados.",
    icone: PhoneCall,
  },
  {
    titulo: "Relatório de Apoios",
    href: "/sistema/apoios/relatorio",
    descricao: "Relatórios dos apoios operacionais realizados.",
    icone: FileText,
  },
];

export default function CentralApoiosPage() {
  return (
    <ProtecaoModulo modulo="apoios">
      <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Apoios"
        descricao="Apoios operacionais, institucionais e administrativos."
        icone={PhoneCall}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
    </ProtecaoModulo>
  );
}