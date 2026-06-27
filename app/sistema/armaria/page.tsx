"use client";

import Link from "next/link";

const modulos = [
  { titulo: "Armamentos", href: "/sistema/armamentos", icone: "🔫" },
  { titulo: "Cautelas", href: "/sistema/cautelas", icone: "📝" },
  { titulo: "Munições", href: "/sistema/municoes", icone: "🎯" },
  { titulo: "Inventário", href: "/sistema/inventario", icone: "📦" },
  { titulo: "Manutenção", href: "/sistema/manutencoes", icone: "🔧" },
];

export default function ArmariaPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">
          Central da Armaria
        </h1>

        <p className="text-slate-400 mt-2">
          Gestão de armas, munições, cautelas e inventário.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {modulos.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="painel-premium p-5 hover:border-yellow-500 transition"
          >
            <p className="text-4xl">{m.icone}</p>

            <h2 className="text-xl font-black mt-4">
              {m.titulo}
            </h2>
          </Link>
        ))}
      </div>
    </div>
  );
}