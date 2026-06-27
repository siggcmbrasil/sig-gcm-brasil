"use client";

import Link from "next/link";

const itens = [
  { titulo: "Comunicação Interna", href: "/sistema/comunicacao", icone: "📢" },
  { titulo: "Feed SIG", href: "/sistema/feed-sig", icone: "🌐" },
  { titulo: "Feed Brasil", href: "/sistema/feed-brasil", icone: "🇧🇷" },
  { titulo: "Blog Operacional", href: "/sistema/blog-operacional", icone: "📰" },
  { titulo: "Chat", href: "/sistema/chat", icone: "💬" },
];

export default function ComunicacaoHistoricoPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Histórico da Comunicação</h1>
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