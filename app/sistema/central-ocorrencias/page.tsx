"use client";

import {
  AlertTriangle,
  BarChart3,
  PlusCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Ocorrências",
    href: "/sistema/ocorrencias",
    descricao: "Consultar, filtrar e acompanhar ocorrências registradas.",
    icone: AlertTriangle,
  },
  {
    titulo: "Nova Ocorrência",
    href: "/sistema/ocorrencias/nova",
    descricao: "Registrar ocorrência completa com envolvidos, veículos e objetos.",
    icone: PlusCircle,
  },
  {
    titulo: "Ocorrência Expressa",
    href: "/sistema/ocorrencias/expressa",
    descricao: "Registro rápido de ocorrência para uso em campo.",
    icone: Zap,
  },
];

export default function CentralOcorrenciasPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Ocorrências"
        descricao="Registro, consulta, envolvidos, relatórios e análise das ocorrências operacionais."
        icone={ShieldCheck}
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