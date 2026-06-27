"use client";

import Link from "next/link";

const modulos = [
  { titulo: "Portal do Cidadão", href: "/sistema/portal-cidadao", icone: "🏛️" },
  { titulo: "Denúncias", href: "/sistema/portal-cidadao/denuncias", icone: "🚨" },
  { titulo: "Ouvidoria", href: "/sistema/portal-cidadao/ouvidoria", icone: "📬" },
  { titulo: "Solicitações", href: "/sistema/portal-cidadao/solicitacoes", icone: "📋" },
  { titulo: "Protocolos", href: "/sistema/portal-cidadao/protocolos", icone: "📝" },
  { titulo: "Eventos", href: "/sistema/portal-cidadao/eventos", icone: "🎉" },
  { titulo: "Notícias", href: "/sistema/portal-cidadao/noticias", icone: "📰" },
  { titulo: "Contatos Úteis", href: "/sistema/portal-cidadao/contatos", icone: "☎️" },
];

export default function CentralCidadaoPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Central do Cidadão</h1>
        <p className="text-slate-400 mt-2">
          Todos os serviços públicos disponíveis para o cidadão.
        </p>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
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