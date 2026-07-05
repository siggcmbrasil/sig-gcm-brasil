
import Link from "next/link";
import {
  Bot,
  Scale,
  BookOpen,
  FileText,
  BarChart3,
} from "lucide-react";

const cards = [
  {
    titulo: "IA Operacional",
    icone: Bot,
    href: "/sistema/ia",
    descricao: "Assistente inteligente para apoio operacional",
  },
  {
    titulo: "IA Jurídica",
    icone: Scale,
    href: "/sistema/ia-juridica",
    descricao: "Consultas jurídicas e apoio legal",
  },
{
  titulo: "IA Legislação",
  icone: BookOpen,
  href: "/sistema/inteligencia",
  descricao: "Pesquisa inteligente na legislação",
  emBreve: true,
},
{
  titulo: "IA Relatórios",
  icone: FileText,
  href: "/sistema/inteligencia",
  descricao: "Auxílio na elaboração de relatórios",
  emBreve: true,
},
{
  titulo: "IA Estatística",
  icone: BarChart3,
  href: "/sistema/inteligencia",
  descricao: "Análise inteligente de indicadores",
  emBreve: true,
},
];

export default function InteligenciaPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#06b6d4,transparent_40%)] opacity-20" />

        <div className="relative">
          <h1 className="text-4xl font-black text-white">
            🧠 Central de Inteligência
          </h1>

          <p className="text-slate-400 mt-2">
            Inteligência Artificial aplicada à operação da Guarda Municipal.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icone = card.icone;

          return (
<Link
  key={card.titulo}
  href={card.href}
              className="
                painel-premium
                p-6
                hover:scale-[1.02]
                hover:border-cyan-500/40
                transition-all
                duration-300
                relative
                overflow-hidden
              "
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#06b6d4,transparent_50%)] opacity-10" />

              <div className="relative">
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="
                      w-16 h-16
                      rounded-2xl
                      bg-cyan-500/10
                      border border-cyan-500/20
                      flex items-center justify-center
                    "
                  >
                    <Icone className="w-9 h-9 text-cyan-400" />
                  </div>

                  <span
  className={`text-xs font-black px-2 py-1 rounded-full ${
    card.emBreve
      ? "bg-yellow-500/20 text-yellow-400"
      : "bg-cyan-500/20 text-cyan-400"
  }`}
>
  {card.emBreve ? "EM BREVE" : "IA"}
</span>
                </div>

                <h2 className="text-2xl font-black text-white">
                  {card.titulo}
                </h2>

                <p className="text-slate-400 text-sm mt-2">
                  {card.descricao}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

