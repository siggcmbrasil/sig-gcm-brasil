
import Link from "next/link";
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
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          📊 Central de Gestão
        </h1>

        <p className="text-slate-400 mt-2">
          Controle administrativo, estatístico e documental da Guarda Municipal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-5">
        {cards.map((card) => {
          const Icone = card.icone;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="
                painel-premium
                p-6
                hover:scale-[1.02]
                hover:border-blue-500/40
                transition-all
                duration-300
              "
            >
              <div className="flex items-center justify-between mb-5">
                <div
                  className="
                    w-16 h-16
                    rounded-2xl
                    bg-blue-500/10
                    border border-blue-500/20
                    flex items-center justify-center
                  "
                >
                  <Icone className="w-9 h-9 text-cyan-400" />
                </div>

                <span className="text-green-400 text-xs font-black">
                  GESTÃO
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

