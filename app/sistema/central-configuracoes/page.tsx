"use client";

import Link from "next/link";

const itens = [
  { titulo: "Configurações", href: "/sistema/configuracoes", icone: "⚙️" },
  { titulo: "Municípios", href: "/sistema/municipios", icone: "🏙️" },
  { titulo: "Permissões", href: "/sistema/permissoes", icone: "🔐" },
  { titulo: "Notificações", href: "/sistema/notificacoes", icone: "🔔" },
];

export default function Page() {
  return (
    <div className="p-6">
      <div className="painel-premium p-6 mb-6">
        <h1 className="text-3xl font-black">
          Central de Configurações
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