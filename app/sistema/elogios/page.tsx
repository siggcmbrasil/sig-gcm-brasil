"use client";

import {
  Award,
  PlusCircle,
  FileText,
  Star,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Novo Elogio",
    href: "/sistema/elogios/novo",
    descricao: "Cadastrar um novo elogio funcional.",
    icone: PlusCircle,
  },
  {
    titulo: "Elogios",
    href: "/sistema/elogios/lista",
    descricao: "Lista de elogios registrados no sistema.",
    icone: Award,
  },
  {
    titulo: "Relatórios",
    href: "/sistema/elogios/relatorio",
    descricao: "Relatórios e estatísticas dos elogios.",
    icone: FileText,
  },
  {
    titulo: "Destaques",
    href: "/sistema/elogios/destaques",
    descricao: "Guardas com maior quantidade de elogios.",
    icone: Star,
  },
];

export default function ElogiosPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Elogios"
        descricao="Gestão dos elogios funcionais e reconhecimento profissional."
        icone={Award}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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