"use client";

import Link from "next/link";

const itens = [
  { titulo: "Guardas", icone: "👮", href: "/sistema/guardas" },
  { titulo: "Viaturas", icone: "🚓", href: "/sistema/viaturas" },
  { titulo: "Relatórios", icone: "📊", href: "/sistema/relatorios" },
  { titulo: "IA Operacional", icone: "🤖", href: "/sistema/ia" },
  { titulo: "Legislação", icone: "📖", href: "/sistema/legislacao" },
  { titulo: "Ofícios", icone: "📄", href: "/sistema/oficios" },
  { titulo: "Offline", icone: "📴", href: "/sistema/offline" },
  { titulo: "Configurações", icone: "⚙️", href: "/sistema/configuracoes" },
  { titulo: "Mancha Criminal", icone: "🔥", href: "/sistema/mobile/mancha-criminal" }
];

export default function MaisPage() {
  return (
    <main className="min-h-screen bg-[#02060f] text-white p-5">
        
        <button
  onClick={() => window.history.back()}
  className="mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl"
>
  ← Voltar
</button>
      <h1 className="text-3xl font-black mb-6">
        ☰ Mais Opções
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {itens.map((item) => (
          <Link
            key={item.titulo}
            href={item.href}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-h-36"
          >
            <span className="text-4xl mb-3">
              {item.icone}
            </span>

            <span className="font-bold">
              {item.titulo}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}