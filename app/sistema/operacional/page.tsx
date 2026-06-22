
import Link from "next/link";
import {
  AlertTriangle,
  PhoneCall,
  CarFront,
  Map,
  MapPin,
  Route,
  Bot,
  Scale,
} from "lucide-react";

const cards = [
  {
    titulo: "Ocorrências",
    icone: AlertTriangle,
    href: "/sistema/ocorrencias",
    descricao: "Registro e gerenciamento de ocorrências",
  },
  {
    titulo: "Chamados",
    icone: PhoneCall,
    href: "/sistema/chamados",
    descricao: "Atendimentos e solicitações",
  },
  {
    titulo: "Patrulhamento",
    icone: CarFront,
    href: "/sistema/patrulhamento",
    descricao: "Controle operacional das equipes",
  },
  {
    titulo: "Mapa Operacional",
    icone: Map,
    href: "/sistema/mapa-operacional",
    descricao: "Visualização geográfica em tempo real",
  },
  {
    titulo: "Patrulhamento GPS",
    icone: MapPin,
    href: "/sistema/localizacao",
    descricao: "Monitoramento de localização",
  },
  {
    titulo: "Plano de Rondas",
    icone: Route,
    href: "/sistema/rondas",
    descricao: "Planejamento das rondas operacionais",
  },
  {
    titulo: "IA Operacional",
    icone: Bot,
    href: "/sistema/ia",
    descricao: "Assistente inteligente operacional",
  },
  {
    titulo: "Legislação",
    icone: Scale,
    href: "/sistema/legislacao",
    descricao: "Consulta rápida à legislação",
  },
];

export default function OperacionalPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          🚔 Centro Operacional
        </h1>

        <p className="text-slate-400 mt-2">
          Central de gerenciamento operacional da Guarda Municipal.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
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
                group
              "
            >
              <div className="flex items-center justify-between mb-5">
                <div className="
                  w-16 h-16
                  rounded-2xl
                  bg-blue-500/10
                  border border-blue-500/20
                  flex items-center justify-center
                ">
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
