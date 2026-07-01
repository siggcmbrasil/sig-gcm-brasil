"use client";

import {
  Scale,
  FileText,
  ScrollText,
  FileCheck,
  Handshake,
  BookOpen,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Legislação",
    icone: Scale,
    href: "/sistema/legislacao",
    descricao:
      "Consulta de leis, normas, códigos e regulamentos.",
  },
  {
    titulo: "Ofícios",
    icone: FileText,
    href: "/sistema/oficios",
    descricao:
      "Emissão e controle de ofícios institucionais.",
  },
  {
    titulo: "Ofícios Recebidos",
    icone: ScrollText,
    href: "/sistema/oficios-recebidos",
    descricao:
      "Controle de documentos oficiais recebidos.",
  },
  {
    titulo: "Termos",
    icone: FileCheck,
    href: "/sistema/termos",
    descricao:
      "Modelos de termos e documentos administrativos.",
  },
  {
    titulo: "Convênios",
    icone: Handshake,
    href: "/sistema/convenios",
    descricao:
      "Controle de convênios e parcerias institucionais.",
  },
  {
    titulo: "SIG Legislação",
    icone: BookOpen,
    href: "/sistema/sig-legislacao",
    descricao:
      "Módulo avançado de legislação, estudos e consultas jurídicas.",
  },
];

export default function CentralJuridicaPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central Jurídica"
        descricao="Legislação, documentos oficiais, termos, convênios e estudos jurídicos."
        icone={Scale}
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