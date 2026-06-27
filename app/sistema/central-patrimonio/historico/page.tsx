"use client";

import Link from "next/link";

const itens = [
  { titulo: "Patrimônio", href: "/sistema/patrimonio", icone: "🏛️" },
  { titulo: "Equipamentos", href: "/sistema/equipamentos", icone: "🛠️" },
  { titulo: "Almoxarifado", href: "/sistema/almoxarifado", icone: "📦" },
  { titulo: "Inventário", href: "/sistema/inventario", icone: "📋" },
  { titulo: "Movimentações", href: "/sistema/patrimonio/movimentacoes", icone: "🔄" },
];

export default function PatrimonioHistoricoPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Histórico do Patrimônio</h1>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {itens.map((item) => (
          <Link key={item.href} href={item.href} className="painel-premium p-5 hover:border-yellow-500 transition">
            <p className="text-4xl">{item.icone}</p>
            <h2 className="text-xl font-black mt-4">{item.titulo}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}