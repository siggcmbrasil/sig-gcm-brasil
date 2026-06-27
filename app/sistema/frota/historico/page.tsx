"use client";

import Link from "next/link";

const itens = [
  { titulo: "Histórico de Viaturas", href: "/sistema/viatura", icone: "🚓" },
  { titulo: "Abastecimentos", href: "/sistema/abastecimentos", icone: "⛽" },
  { titulo: "Manutenções", href: "/sistema/manutencoes", icone: "🔧" },
  { titulo: "Danos", href: "/sistema/danos-viaturas", icone: "⚠️" },
  { titulo: "Checklists", href: "/sistema/checklist-viaturas", icone: "✅" },
  { titulo: "Pneus", href: "/sistema/pneus", icone: "🛞" },
];

export default function FrotaHistoricoPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Histórico da Frota</h1>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {itens.map((item) => (
          <Link key={item.href} href={item.href} className="painel-premium p-5 hover:border-yellow-500/70 transition">
            <p className="text-4xl">{item.icone}</p>
            <h2 className="text-xl font-black mt-4">{item.titulo}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}