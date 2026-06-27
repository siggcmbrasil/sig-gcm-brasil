"use client";

import Link from "next/link";

const itens = [
  { titulo: "IA Operacional", href: "/sistema/ia", icone: "🤖" },
  { titulo: "IA Jurídica", href: "/sistema/ia-juridica", icone: "⚖️" },
  { titulo: "Créditos IA", href: "/sistema/ia-creditos", icone: "💳" },
  { titulo: "Histórico IA", href: "/sistema/auditoria", icone: "📜" },
];

export default function Page() {
  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Central de Inteligência Artificial
        </h1>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {itens.map((i) => (
          <Link key={i.href} href={i.href} className="painel-premium p-5">
            <p className="text-4xl">{i.icone}</p>
            <h2 className="text-xl font-black mt-4">{i.titulo}</h2>
          </Link>
        ))}
      </div>
    </div>
  );
}