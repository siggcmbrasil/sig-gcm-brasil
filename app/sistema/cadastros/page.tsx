
import Link from "next/link";
import {
  Users,
  CarFront,
  Shield,
  MapPin,
  User,
  Car,
  HardHat,
  Cake,
} from "lucide-react";

const cards = [
  {
    titulo: "Guardas",
    icone: Users,
    href: "/sistema/guardas",
    descricao: "Cadastro completo dos guardas municipais",
  },
  {
    titulo: "Viaturas",
    icone: CarFront,
    href: "/sistema/viatura",
    descricao: "Controle e gerenciamento da frota",
  },
  {
    titulo: "Guarnições",
    icone: Shield,
    href: "/sistema/guarnicoes",
    descricao: "Equipes operacionais e escalas",
  },
  {
    titulo: "Locais",
    icone: MapPin,
    href: "/sistema/locais",
    descricao: "Bairros, órgãos públicos e pontos de apoio",
  },
  {
    titulo: "Pessoas",
    icone: User,
    href: "/sistema/pessoas",
    descricao: "Cadastro de envolvidos e abordados",
  },
  {
    titulo: "Veículos",
    icone: Car,
    href: "/sistema/veiculos",
    descricao: "Consulta e registro de veículos",
  },
  {
    titulo: "Equipamentos",
    icone: HardHat,
    href: "/sistema/equipamentos",
    descricao: "Controle de equipamentos operacionais",
  },
  {
    titulo: "Aniversariantes",
    icone: Cake,
    href: "/sistema/aniversariantes",
    descricao: "Aniversários dos servidores",
  },

  {
  titulo: "Patrimônio",
  icone: HardHat,
  href: "/sistema/patrimonio",
  descricao: "Cadastro de bens e patrimônio institucional",
},
{
  titulo: "Armamento",
  icone: Shield,
  href: "/sistema/gestao-armamento",
  descricao: "Cadastro e controle de armamentos",
},
];

export default function CadastrosPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          👥 Central de Cadastros
        </h1>

        <p className="text-slate-400 mt-2">
          Gerenciamento completo dos cadastros operacionais do SIG-GCM Brasil.
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
                  CADASTRO
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
