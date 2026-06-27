import Link from "next/link";
import {
  Package,
  Shield,
  Warehouse,
  ClipboardList,
  Archive,
  Radio,
  Target,
  Boxes,
} from "lucide-react";

const cards = [
  {
    titulo: "Equipamentos",
    icone: Radio,
    href: "/sistema/equipamentos",
    descricao: "Controle de rádios, coletes, cones, lanternas e materiais operacionais.",
  },
  {
    titulo: "Patrimônio",
    icone: Package,
    href: "/sistema/patrimonio",
    descricao: "Gestão dos bens patrimoniais e bens tombados da instituição.",
  },
  {
    titulo: "Almoxarifado",
    icone: Warehouse,
    href: "/sistema/almoxarifado",
    descricao: "Controle de entrada, saída e estoque de materiais.",
  },
  {
    titulo: "Inventário",
    icone: ClipboardList,
    href: "/sistema/inventario",
    descricao: "Inventário físico e conferência dos bens da Guarda.",
  },
  {
    titulo: "Cautelas",
    icone: Archive,
    href: "/sistema/cautelas",
    descricao: "Entrega, devolução e responsabilidade por materiais cautelados.",
  },
  {
    titulo: "Armamento",
    icone: Shield,
    href: "/sistema/armamento",
    descricao: "Gestão e controle de armamentos institucionais.",
  },
  {
    titulo: "Armaria",
    icone: Boxes,
    href: "/sistema/armaria",
    descricao: "Controle da armaria, movimentações e guarda de equipamentos sensíveis.",
  },
  {
    titulo: "Munições",
    icone: Target,
    href: "/sistema/municoes",
    descricao: "Controle de munições, lotes, entradas, saídas e consumo.",
  },
];

export default function CentralPatrimonioPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          📦 Central de Patrimônio
        </h1>

        <p className="text-slate-400 mt-2">
          Gestão de equipamentos, bens, armamento, almoxarifado, cautelas e patrimônio institucional.
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