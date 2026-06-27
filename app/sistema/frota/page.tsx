import Link from "next/link";
import {
  CarFront,
  Fuel,
  Wrench,
  ClipboardCheck,
  AlertTriangle,
  CircleGauge,
} from "lucide-react";

const cards = [
  {
    titulo: "Viaturas",
    icone: CarFront,
    href: "/sistema/viatura",
    descricao: "Cadastro, consulta e controle da frota operacional.",
  },
  {
    titulo: "Abastecimentos",
    icone: Fuel,
    href: "/sistema/abastecimentos",
    descricao: "Controle de combustível e consumo das viaturas.",
  },
  {
    titulo: "Manutenções",
    icone: Wrench,
    href: "/sistema/manutencoes",
    descricao: "Registro de manutenções preventivas e corretivas.",
  },
  {
    titulo: "Checklist de Viaturas",
    icone: ClipboardCheck,
    href: "/sistema/checklist-viaturas",
    descricao: "Inspeção operacional antes e depois do serviço.",
  },
  {
    titulo: "Danos em Viaturas",
    icone: AlertTriangle,
    href: "/sistema/danos-viaturas",
    descricao: "Registro de avarias, danos e ocorrências com veículos.",
  },
  {
    titulo: "Pneus",
    icone: CircleGauge,
    href: "/sistema/pneus",
    descricao: "Controle de pneus, trocas, vida útil e manutenção.",
  },
];

export default function CentralFrotaPage() {
  return (
    <section className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-4xl font-black text-white">
          🚓 Central de Frota
        </h1>

        <p className="text-slate-400 mt-2">
          Gestão completa das viaturas, abastecimentos, manutenções e controle da frota operacional.
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