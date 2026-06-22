
import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  RefreshCcw,
  Users,
  Settings,
  Compass,
} from "lucide-react";

const cards = [
  {
    titulo: "Escalas",
    icone: CalendarDays,
    href: "/sistema/escalas",
    descricao: "Gerenciamento das escalas operacionais",
  },
  {
    titulo: "Escala Mensal",
    icone: CalendarRange,
    href: "/sistema/escala-mensal",
    descricao: "Visualização e emissão da escala mensal",
  },
  {
    titulo: "Permutas",
    icone: RefreshCcw,
    href: "/sistema/escalas/permutas",
    descricao: "Trocas e substituições de plantões",
  },
  {
    titulo: "Guarnições",
    icone: Users,
    href: "/sistema/guarnicoes",
    descricao: "Controle das equipes de serviço",
  },
  {
    titulo: "Modelos",
    icone: Settings,
    href: "/sistema/escalas/modelos",
    descricao: "Modelos e padrões de escalas",
  },
  {
    titulo: "Configuração",
    icone: Compass,
    href: "/sistema/escalas/configuracao",
    descricao: "Configurações operacionais das escalas",
  },
];

export default function EscalasMenuPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          📅 Central de Escalas
        </h1>

        <p className="text-slate-400 mt-2">
          Gestão completa das escalas, guarnições e permutas do SIG-GCM Brasil.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
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
                  ESCALA
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

