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
    href: "/sistema/guardas",
    descricao: "Histórico funcional e informações do servidor.",
  },
  {
    titulo: "Documentos",
    icone: FileText,
    href: "/sistema/guardas",
    descricao: "Documentos funcionais dos guardas.",
  },
  {
    titulo: "Escalas",
    icone: CalendarDays,
    href: "/sistema/escalas-menu",
    descricao: "Escalas de serviço, modelos e configurações.",
  },
  {
    titulo: "Permutas",
    icone: RotateCcw,
    href: "/sistema/escalas/permutas",
    descricao: "Solicitações e controle de permutas de plantão.",
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
    titulo: "Férias",
    icone: CalendarDays,
    href: "/sistema/ferias",
    descricao: "Planejamento e controle de férias.",
  },
  {
    titulo: "Licenças",
    icone: HeartPulse,
    href: "/sistema/licencas",
    descricao: "Controle de licenças e afastamentos.",
  },
  {
    titulo: "Atestados",
    icone: HeartPulse,
    href: "/sistema/atestados",
    descricao: "Registro de atestados médicos.",
  },
  {
    titulo: "Elogios",
    icone: Star,
    href: "/sistema/elogios",
    descricao: "Registro de elogios funcionais.",
  },
  {
    titulo: "Advertências",
    icone: AlertTriangle,
    href: "/sistema/advertencias",
    descricao: "Controle de advertências e registros disciplinares.",
  },
  {
    titulo: "Promoções",
    icone: Award,
    href: "/sistema/promocoes",
    descricao: "Controle de promoções e progressões.",
  },
  {
    titulo: "Avaliações",
    icone: Star,
    href: "/sistema/avaliacoes",
    descricao: "Avaliações de desempenho funcional.",
  },
  {
    titulo: "Aniversariantes",
    icone: Cake,
    href: "/sistema/aniversariantes",
    descricao: "Aniversários dos servidores.",
  },
  {
    titulo: "Condecorações",
    icone: Medal,
    href: "/sistema/condecoracoes",
    descricao: "Medalhas, homenagens e condecorações.",
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