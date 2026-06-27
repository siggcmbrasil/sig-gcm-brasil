import Link from "next/link";
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
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          📄 Central de Relatórios
        </h1>

        <p className="text-slate-400 mt-2">
          Gestão completa de relatórios, documentos, estatísticas e exportações.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icone = card.icone;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="painel-premium p-6 hover:scale-[1.02] hover:border-blue-500/40 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Icone className="w-9 h-9 text-cyan-400" />
                </div>

                <span className="text-green-400 text-xs font-black">
                  ONLINE
                </span>
              </div>

              <h2 className="text-2xl font-black text-white">
                {card.titulo}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {card.descricao}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}