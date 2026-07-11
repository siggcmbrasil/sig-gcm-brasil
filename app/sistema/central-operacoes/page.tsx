"use client";

import {
  ShieldCheck,
  PlusCircle,
  ClipboardList,
  Users,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

const cards = [
  {
    titulo: "Operações Especiais",
    href: "/sistema/operacoes-especiais",
    descricao: "Controle de operações planejadas e missões especiais.",
    icone: ShieldCheck,
  },
  {
  titulo: "Nova Operação",
  href: "/sistema/operacoes-especiais/nova",
  descricao: "Cadastrar nova operação especial.",
  icone: PlusCircle,
},
  {
    titulo: "Planejamento",
    href: "/sistema/ordens-servico",
    descricao: "Ordens de serviço, planejamento e missão.",
    icone: ClipboardList,
  },
  {
    titulo: "Efetivo",
    href: "/sistema/",
    descricao: "Guarnições e equipes envolvidas na operação.",
    icone: Users,
  },
];

export default function CentralOperacoesPage() {
  return (
    <ProtecaoModulo modulo="operacoes">
      <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Operações"
        descricao="Planejamento, execução e controle das operações especiais."
        icone={ShieldCheck}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {cards.map((card) => (
          <SigCentralCard key={card.href} {...card} />
        ))}
      </div>
          </section>
    </ProtecaoModulo>
  );
}