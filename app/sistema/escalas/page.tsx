import Link from "next/link";
import {
  CalendarDays,
  CalendarRange,
  Building2,
  Star,
  Repeat,
  ClipboardList,
  Settings,
  Umbrella,
  Users,
} from "lucide-react";

const cards = [
    {
  titulo: "Escala Mensal",
  descricao: "Calendário mensal de serviço, plantões, guarnições e folgas.",
  href: "/sistema/escalas/escala-mensal",
  icone: CalendarRange,
},
  {
    titulo: "Escalas Operacionais",
    descricao: "Plantões 24/96, 12/36, rondas, guarnições e viaturas.",
    href: "/sistema/escalas/operacional",
    icone: CalendarDays,
  },
  {
    titulo: "Escalas Administrativas",
    descricao: "Expediente administrativo, horários fixos e personalizados.",
    href: "/sistema/escalas/administrativo",
    icone: Building2,
  },
  {
    titulo: "Escalas Extras",
    descricao: "Serviços extraordinários, eventos e convocações.",
    href: "/sistema/escalas/extras",
    icone: Star,
  },
  {
    titulo: "Permutas",
    descricao: "Solicitações, aprovações e histórico de permutas.",
    href: "/sistema/escalas/permutas",
    icone: Repeat,
  },
  {
    titulo: "Modelos de Escala",
    descricao: "Modelos prontos para 24/96, administrativo e extras.",
    href: "/sistema/escalas/modelos",
    icone: ClipboardList,
  },
  {
    titulo: "Configurações",
    descricao: "Configuração da escala base e regras de plantão.",
    href: "/sistema/escalas/configuracao",
    icone: Settings,
  },
  {
    titulo: "Férias e Licenças",
    descricao: "Conciliação com férias, licenças e afastamentos.",
    href: "/sistema/escalas/ferias-licencas",
    icone: Umbrella,
  },
  {
    titulo: "Mapa de Efetivo",
    descricao: "Visão geral de efetivo disponível, escalado e afastado.",
    href: "/sistema/escalas/mapa-efetivo",
    icone: Users,
  },
];

export default function EscalasPage() {
  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl md:text-5xl font-black text-white">
          Central de Escalas
        </h1>

        <p className="text-slate-400 mt-2">
          Gestão de escalas operacionais, administrativas, extras, permutas,
          férias, licenças e mapa de efetivo.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icone = card.icone;

          return (
            <Link
              key={card.href}
              href={card.href}
              className="painel-premium p-6 hover:scale-[1.02] transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-5">
                <Icone className="w-8 h-8 text-cyan-400" />
              </div>

              <h2 className="text-xl font-black text-white">
                {card.titulo}
              </h2>

              <p className="text-slate-400 text-sm mt-2">
                {card.descricao}
              </p>
            </Link>
          );
        })}
      </section>
    </div>
  );
}