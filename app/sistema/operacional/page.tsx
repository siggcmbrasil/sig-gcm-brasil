"use client";

import {
  AlertTriangle,
  PhoneCall,
  CarFront,
  Shield,
  Users,
  Handshake,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Central de Ocorrências",
    icone: AlertTriangle,
    href: "/sistema/central-ocorrencias",
    descricao: "Registro, consulta e acompanhamento de ocorrências.",
  },
  {
    titulo: "Central de Patrulhamentos",
    icone: CarFront,
    href: "/sistema/central-patrulhamento",
    descricao: "Controle de rondas, equipes e áreas patrulhadas.",
  },
  {
    titulo: "Consultas Operacionais",
    icone: Users,
    href: "/sistema/consultas",
    descricao: "Consulta de pessoas, veículos e informações operacionais.",
  },
  {
    titulo: "Central de Pessoas",
    icone: Users,
    href: "/sistema/central-pessoas",
    descricao: "Cadastro e histórico de pessoas abordadas.",
  },
  {
    titulo: "Central de Veículos",
    icone: CarFront,
    href: "/sistema/central-veiculos",
    descricao: "Cadastro e histórico de veículos abordados.",
  },
  {
    titulo: "Central de Blitze e Barreiras",
    icone: Shield,
    href: "/sistema/central-blitzes",
    descricao: "Registro de barreiras, abordagens e fiscalizações.",
  },
  {
    titulo: "Central de Operações Especiais",
    icone: Shield,
    href: "/sistema/central-operacoes",
    descricao: "Controle de operações planejadas e missões especiais.",
  },
  {
    titulo: "Central de Visitas Preventivas",
    icone: Handshake,
    href: "/sistema/central-visitas",
    descricao: "Ações preventivas, Guarda na Escola e visitas comunitárias.",
  },
  {
    titulo: "Central de Escoltas",
    icone: CarFront,
    href: "/sistema/central-escoltas",
    descricao: "Controle de escoltas e deslocamentos oficiais.",
  },
  {
    titulo: "Central de Apoios",
    icone: PhoneCall,
    href: "/sistema/central-apoios",
    descricao: "Registro de apoios a órgãos, secretarias e instituições.",
  },
];

export default function OperacionalPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Centro Operacional"
        descricao="Execução operacional, patrulhamento, ocorrências, rondas e apoios."
        icone={Shield}
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