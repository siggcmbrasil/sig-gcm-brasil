
import Link from "next/link";
import {
  AlertTriangle,
  PhoneCall,
  CarFront,
  Map,
  MapPin,
  Route,
  Shield,
  Users,
} from "lucide-react";

const cards = [
  {
    titulo: "Ocorrências",
    icone: AlertTriangle,
    href: "/sistema/ocorrencias",
    descricao: "Registro, consulta e acompanhamento de ocorrências.",
  },
  {
    titulo: "Ocorrência Expressa",
    icone: AlertTriangle,
    href: "/sistema/ocorrencias/expressa",
    descricao: "Registro rápido de ocorrência durante o serviço.",
  },
  {
    titulo: "Chamados",
    icone: PhoneCall,
    href: "/sistema/chamados",
    descricao: "Atendimento de solicitações e demandas recebidas.",
  },
  {
    titulo: "Patrulhamento",
    icone: CarFront,
    href: "/sistema/patrulhamento",
    descricao: "Controle de rondas, equipes, viaturas e áreas patrulhadas.",
  },

{
  titulo: "Pessoas",
  icone: Users,
  href: "/sistema/pessoas",
  descricao: "Cadastro e histórico de pessoas abordadas.",
},
{
  titulo: "Veículos",
  icone: CarFront,
  href: "/sistema/veiculos",
  descricao: "Cadastro e histórico de veículos abordados.",
},

  {
    titulo: "Mapa Operacional",
    icone: Map,
    href: "/sistema/mapa-operacional",
    descricao: "Visualização geográfica de ocorrências e pontos operacionais.",
  },
  {
    titulo: "Localização em Tempo Real",
    icone: MapPin,
    href: "/sistema/localizacao",
    descricao: "Monitoramento de equipes e viaturas em serviço.",
  },
  {
    titulo: "Plano de Rondas",
    icone: Route,
    href: "/sistema/rondas",
    descricao: "Planejamento, execução e controle de rondas preventivas.",
  },
  {
    titulo: "Blitze e Barreiras",
    icone: Shield,
    href: "/sistema/blitze",
    descricao: "Registro de barreiras, abordagens e operações de fiscalização.",
  },
  {
    titulo: "Operações Especiais",
    icone: Shield,
    href: "/sistema/operacoes-especiais",
    descricao: "Controle de operações planejadas e missões especiais.",
  },
  {
    titulo: "Eventos Operacionais",
    icone: Route,
    href: "/sistema/eventos-operacionais",
    descricao: "Apoio operacional em eventos públicos e institucionais.",
  },
  {
    titulo: "Escoltas",
    icone: CarFront,
    href: "/sistema/escoltas",
    descricao: "Controle de escoltas, deslocamentos e apoios oficiais.",
  },
  {
    titulo: "Apoios",
    icone: PhoneCall,
    href: "/sistema/apoios",
    descricao: "Registro de apoios a órgãos, secretarias e instituições.",
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
