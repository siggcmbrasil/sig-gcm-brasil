import Link from "next/link";
import {
  Bot,
  Scale,
  BarChart3,
  Brain,
  Search,
  Globe,
  Map,
  Activity,
} from "lucide-react";

const cards = [
  {
    titulo: "IA Operacional",
    icone: Bot,
    href: "/sistema/ia",
    descricao: "Assistente inteligente para apoio às equipes operacionais.",
  },
  {
    titulo: "IA Jurídica",
    icone: Brain,
    href: "/sistema/ia-juridica",
    descricao: "Consultas jurídicas e apoio legal inteligente.",
  },
  {
    titulo: "Legislação",
    icone: Scale,
    href: "/sistema/legislacao",
    descricao: "Consulta rápida de leis, normas e regulamentos.",
  },
  {
    titulo: "Estatísticas",
    icone: BarChart3,
    href: "/sistema/estatisticas",
    descricao: "Indicadores e desempenho operacional.",
  },
  {
    titulo: "Busca Inteligente",
    icone: Search,
    href: "/sistema/busca",
    descricao: "Pesquisa unificada em todo o SIG.",
  },
  {
    titulo: "Feed SIG",
    icone: Globe,
    href: "/sistema/feed-sig",
    descricao: "Notícias, atualizações e novidades do sistema.",
  },
  {
    titulo: "Feed Brasil",
    icone: Globe,
    href: "/sistema/feed-brasil",
    descricao: "Informações relevantes para Guardas Municipais.",
  },
  {
    titulo: "Mapa Estratégico",
    icone: Map,
    href: "/sistema/mapa-operacional",
    descricao: "Visualização estratégica das operações.",
  },
  {
    titulo: "Centro de Inteligência",
    icone: Activity,
    href: "/sistema/inteligencia",
    descricao: "Painel completo de inteligência operacional.",
  },
];

export default function CentralInteligenciaPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          🧠 Central de Inteligência
        </h1>

        <p className="text-slate-400 mt-2">
          Inteligência artificial, análise de dados, legislação e apoio à decisão.
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