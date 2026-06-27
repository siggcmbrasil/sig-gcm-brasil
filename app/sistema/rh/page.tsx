import Link from "next/link";
import {
  Users,
  FileText,
  CalendarDays,
  Clock,
  HeartPulse,
  Cake,
  Award,
  AlertTriangle,
  Star,
  Medal,
  Briefcase,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";

const cards = [
  {
    titulo: "Guardas",
    icone: Users,
    href: "/sistema/guardas",
    descricao: "Cadastro e gestão dos guardas municipais.",
  },
  {
    titulo: "Dossiê do Guarda",
    icone: Briefcase,
    href: "/sistema/dossie",
    descricao: "Histórico funcional e informações do servidor.",
  },
  {
    titulo: "Escalas",
    icone: CalendarDays,
    href: "/sistema/escalas",
    descricao: "Escalas de serviço, modelos e configurações.",
  },
  {
  titulo: "Guarnições",
  href: "/sistema/guarnicoes",
  descricao: "Gestão das equipes e guarnições de serviço.",
  icone: ShieldCheck,
},
  {
    titulo: "Gestão Funcional",
    descricao: "Elogios, advertências, promoções, avaliações e condecorações.",
    href: "/sistema/rh/gestao-funcional",
    icone: Medal,
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
    titulo: "Datas Institucionais",
    descricao: "Aniversários, campanhas e datas comemorativas.",
    href: "/sistema/rh/datas",
    icone: CalendarDays,
  },
  
];

export default function CentralRHPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          👮 Central de Recursos Humanos
        </h1>

        <p className="text-slate-400 mt-2">
          Gestão funcional, escalas, frequência, histórico e vida profissional dos servidores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icone = card.icone;

          return (
            <Link
              key={card.href + card.titulo}
              href={card.href}
              className="
                painel-premium
                p-6
                hover:scale-[1.02]
                hover:border-blue-500/40
                transition-all
                duration-300
                group
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