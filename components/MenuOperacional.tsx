"use client";

import Link from "next/link";

const itens = [
  { href: "/sistema", icone: "🏠", titulo: "Dashboard" },
  { href: "/sistema/ocorrencias", icone: "🚨", titulo: "Ocorrências" },
  { href: "/sistema/patrulhamento", icone: "🚔", titulo: "Patrulhamento" },
  { href: "/sistema/chamados", icone: "📞", titulo: "Chamados" },
  { href: "/sistema/guardas", icone: "👮", titulo: "Guardas" },
  { href: "/sistema/viatura", icone: "🚓", titulo: "Viaturas" },
  { href: "/sistema/escalas", icone: "📅", titulo: "Escalas" },
  { href: "/sistema/relatorios", icone: "📊", titulo: "Relatórios" },
  { href: "/sistema/ia", icone: "🤖", titulo: "IA Operacional" },
  { href: "/sistema/configuracoes", icone: "⚙️", titulo: "Configurações" },
];

export default function MenuOperacional() {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-24 flex-col items-center border-r border-yellow-500/30 bg-[#020814]/95 p-2 backdrop-blur-xl lg:flex">
      <div className="mb-4 flex h-16 w-16 flex-col items-center justify-center rounded-2xl border border-yellow-400/60 bg-slate-950 shadow-[0_0_25px_rgba(250,204,21,0.25)]">
        <img
          src="/brasoes/sig-gcm-logo.png"
          alt="SIG-GCM"
          className="h-12 w-12 object-contain"
        />
      </div>

      <nav className="flex w-full flex-col items-center gap-2">
        {itens.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            title={item.titulo}
            className="group relative flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-slate-900/80 text-xl transition hover:scale-105 hover:border-yellow-400 hover:bg-yellow-500/20 hover:shadow-[0_0_18px_rgba(250,204,21,0.35)]"
          >
            {item.icone}

            <span className="pointer-events-none absolute left-14 z-50 hidden whitespace-nowrap rounded-xl border border-yellow-500/40 bg-slate-950 px-3 py-2 text-xs font-bold text-yellow-300 shadow-2xl group-hover:block">
              {item.titulo}
            </span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}