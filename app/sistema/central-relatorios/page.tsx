"use client";

import {
  FileText,
  BarChart3,
  FileSpreadsheet,
  History,
  ClipboardList,
  FileArchive,
  Printer,
  ScrollText,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCentralCard from "@/components/sig/SigCentralCard";

const cards = [
  {
    titulo: "Relatório de Plantão",
    icone: ClipboardList,
    href: "/sistema/relatorio-plantao",
    descricao: "Relatório operacional completo do plantão.",
  },
  {
    titulo: "Relatórios",
    icone: BarChart3,
    href: "/sistema/relatorios",
    descricao: "Relatórios gerenciais e estatísticos.",
  },
  {
    titulo: "Histórico",
    icone: History,
    href: "/sistema/historico",
    descricao: "Consulta ao histórico de atividades.",
  },
  {
    titulo: "PDFs",
    icone: FileArchive,
    href: "/sistema/pdfs",
    descricao: "Documentos PDF gerados pelo sistema.",
  },
  {
    titulo: "Ofícios",
    icone: FileText,
    href: "/sistema/oficios",
    descricao: "Emissão e gerenciamento de ofícios.",
  },
  {
    titulo: "Ofícios Recebidos",
    icone: ScrollText,
    href: "/sistema/oficios-recebidos",
    descricao: "Controle dos documentos recebidos.",
  },
  {
    titulo: "Exportar Dados",
    icone: FileSpreadsheet,
    href: "/sistema/exportador-dados",
    descricao: "Exportação de informações do sistema.",
  },
  {
    titulo: "Impressões",
    icone: Printer,
    href: "/sistema/pdfs?tipo=impressoes",
    descricao: "Central de impressão de documentos.",
  },
];

export default function CentralRelatoriosPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Relatórios"
        descricao="Gestão completa de relatórios, documentos, estatísticas e exportações."
        icone={FileText}
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