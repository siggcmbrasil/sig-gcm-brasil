"use client";

import Link from "next/link";

const itens = [
  { titulo: "Denúncias", href: "/sistema/portal-cidadao/denuncias", icone: "🚨" },
  { titulo: "Ouvidoria", href: "/sistema/portal-cidadao/ouvidoria", icone: "📬" },
  { titulo: "Solicitações", href: "/sistema/portal-cidadao/solicitacoes", icone: "📋" },
  { titulo: "Protocolos", href: "/sistema/portal-cidadao/protocolos", icone: "📝" },
];

export default function HistoricoCidadaoPage() {
  return (
    <div className="p-6 space-y-6">

      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">
          Histórico do Portal do Cidadão
        </h1>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="painel-premium p-5 hover:border-yellow-500 transition"
          >
            <p className="text-4xl">{item.icone}</p>
            <h2 className="text-xl font-black mt-4">{item.titulo}</h2>
          </Link>
        ))}
      </div>

    </div>
  );
}