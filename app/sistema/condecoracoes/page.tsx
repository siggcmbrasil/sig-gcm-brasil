"use client";

import {
  Award,
  Medal,
  ShieldCheck,
  Star,
  FileText,
  PlusCircle,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Nova Condecoração",
    href: "/sistema/condecoracoes/nova",
    descricao:
      "Cadastrar medalhas, elogios e homenagens institucionais.",
    icone: PlusCircle,
  },
  {
    titulo: "Condecorações",
    href: "/sistema/condecoracoes/lista",
    descricao:
      "Lista completa das condecorações concedidas.",
    icone: Award,
  },
  {
    titulo: "Medalhas",
    href: "/sistema/condecoracoes/medalhas",
    descricao:
      "Gerenciamento das medalhas institucionais.",
    icone: Medal,
  },
  {
    titulo: "Elogios",
    href: "/sistema/condecoracoes/elogios",
    descricao:
      "Registro de elogios individuais e coletivos.",
    icone: Star,
  },
  {
    titulo: "Honrarias",
    href: "/sistema/condecoracoes/honrarias",
    descricao:
      "Homenagens, títulos e reconhecimentos especiais.",
    icone: ShieldCheck,
  },
  {
    titulo: "Relatórios",
    href: "/sistema/condecoracoes/relatorios",
    descricao:
      "Relatórios e estatísticas das condecorações.",
    icone: FileText,
  },
];

export default function CondecoracoesPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Condecorações"
        descricao="Gestão de medalhas, elogios, honrarias e reconhecimentos institucionais."
        icone={Award}
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