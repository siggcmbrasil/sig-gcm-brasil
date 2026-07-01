"use client";

import {
  Users,
  UserPlus,
  CalendarDays,
  Clock,
  HeartPulse,
  Medal,
  Briefcase,
  ShieldCheck,
  UserCog,
  FileText,
  BarChart3,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
  titulo: "Novo Guarda",
  icone: UserPlus,
  href: "/sistema/guardas/novo",
  descricao: "Cadastro de novo guarda municipal.",
},
  {
  titulo: "Guardas",
  icone: Users,
  href: "/sistema/guardas",
  descricao: "Lista e gestão dos guardas municipais.",
},
  
  {
    titulo: "Escalas",
    icone: CalendarDays,
    href: "/sistema/escalas",
    descricao: "Escalas de serviço, modelos e configurações.",
  },
  {
    titulo: "Guarnições",
    icone: ShieldCheck,
    href: "/sistema/guarnicoes",
    descricao: "Gestão das equipes e guarnições de serviço.",
  },
  {
    titulo: "Gestão Funcional",
    icone: Medal,
    href: "/sistema/rh/gestao-funcional",
    descricao: "Elogios, advertências, cursos, avaliações e condecorações.",
  },
  {
    titulo: "Registro de Ponto",
    icone: Clock,
    href: "/sistema/registro-ponto",
    descricao: "Controle de frequência e ponto funcional.",
  },
  {
    titulo: "Banco de Horas",
    icone: Clock,
    href: "/sistema/banco-horas",
    descricao: "Controle de saldo, extras e compensações.",
  },
  {
    titulo: "Atestados",
    icone: HeartPulse,
    href: "/sistema/atestados",
    descricao: "Registro de atestados médicos.",
  },
  {
    titulo: "Férias e Licenças",
    icone: CalendarDays,
    href: "/sistema/ferias-licencas",
    descricao: "Controle de férias, licenças e afastamentos.",
  },
  {
    titulo: "Documentos do Guarda",
    icone: FileText,
    href: "/sistema/documentos-guardas",
    descricao: "CNH, RG, certificados e documentos funcionais.",
  },
  {
    titulo: "Datas Institucionais",
    icone: CalendarDays,
    href: "/sistema/rh/datas",
    descricao: "Aniversários, campanhas e datas comemorativas.",
  },
  {
    titulo: "Estatísticas de RH",
    icone: BarChart3,
    href: "/sistema/rh/estatisticas",
    descricao: "Indicadores do efetivo, férias, licenças e banco de horas.",
  },
];

export default function CentralRHPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Recursos Humanos"
        descricao="Gestão funcional, escalas, frequência, histórico e vida profissional dos servidores."
        icone={UserCog}
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