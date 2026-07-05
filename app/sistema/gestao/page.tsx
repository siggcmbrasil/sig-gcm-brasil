"use client";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";
import {
  FileText,
  BarChart3,
  FileSpreadsheet,
  Shield,
  Clock3,
} from "lucide-react";

const cards = [
  {
    titulo: "Relatórios",
    icone: FileText,
    href: "/sistema/relatorios",
    descricao: "Relatórios operacionais e administrativos",
  },
  {
    titulo: "Estatísticas",
    icone: BarChart3,
    href: "/sistema/estatisticas",
    descricao: "Indicadores e desempenho da corporação",
  },
  {
    titulo: "Ofícios",
    icone: FileSpreadsheet,
    href: "/sistema/oficios",
    descricao: "Geração e controle de documentos oficiais",
  },
  {
    titulo: "Dossiês",
    icone: Shield,
    href: "/sistema/guardas",
    descricao: "Histórico completo dos servidores",
  },
  {
    titulo: "Banco de Horas",
    icone: Clock3,
    href: "/sistema/banco-horas",
    descricao: "Controle de horas extras e compensações",
  },
];

export default function GestaoPage() {
  return (
    <ProtecaoModulo modulo="gestao">
      <section className="p-4 md:p-6 pb-24 space-y-6">
        <SigCentralHeader
          titulo="Central de Gestão"
          descricao="Controle administrativo, estatístico e documental da Guarda Municipal."
          icone={BarChart3}
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