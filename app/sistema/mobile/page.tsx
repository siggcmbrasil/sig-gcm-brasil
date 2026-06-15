"use client";

import Link from "next/link";
import { useState } from "react";

const modulos = [
  { titulo: "Nova Ocorrência", icone: "🚨", href: "/sistema/ocorrencias/nova", grupo: "Operacional", cor: "from-red-600 to-red-900" },
  { titulo: "Chamados", icone: "📞", href: "/sistema/chamados", grupo: "Operacional", cor: "from-green-500 to-emerald-900" },
  { titulo: "Patrulhamento", icone: "🚔", href: "/sistema/patrulhamento", grupo: "Operacional", cor: "from-blue-500 to-blue-950" },
  { titulo: "Mapa Operacional", icone: "📍", href: "/sistema/mapa-operacional", grupo: "Operacional", cor: "from-purple-500 to-purple-950" },

  { titulo: "Minhas Ocorrências", icone: "📋", href: "/sistema/ocorrencias", grupo: "Operacional", cor: "from-orange-500 to-orange-900" },
  { titulo: "Guardas", icone: "👥", href: "/sistema/guardas", grupo: "Gestão", cor: "from-teal-500 to-teal-900" },
  { titulo: "Viaturas", icone: "🚓", href: "/sistema/viatura", grupo: "Gestão", cor: "from-blue-600 to-blue-950" },
  { titulo: "Escalas", icone: "📅", href: "/sistema/escalas-menu", grupo: "Escalas", cor: "from-violet-500 to-violet-950" },

  { titulo: "Relatórios", icone: "📊", href: "/sistema/relatorios", grupo: "Gestão", cor: "from-yellow-500 to-yellow-900" },
  { titulo: "Indicadores", icone: "📈", href: "/sistema/estatisticas", grupo: "Gestão", cor: "from-cyan-500 to-cyan-900" },
  { titulo: "Ofícios", icone: "📄", href: "/sistema/oficios", grupo: "Gestão", cor: "from-green-500 to-green-900" },
  { titulo: "Fotos Operacionais", icone: "📷", href: "/sistema/ocorrencias", grupo: "Operacional", cor: "from-blue-500 to-blue-900" },

  { titulo: "Comunicados", icone: "💬", href: "/sistema/gestao", grupo: "Gestão", cor: "from-purple-500 to-purple-950" },
  { titulo: "Ocorrências Críticas", icone: "⚠️", href: "/sistema/ocorrencias", grupo: "Operacional", cor: "from-red-500 to-red-950" },
  { titulo: "Identificação", icone: "🆔", href: "/sistema/pessoas", grupo: "Gestão", cor: "from-slate-600 to-slate-950" },
  { titulo: "Consulta Rápida", icone: "🔍", href: "/sistema/cadastros", grupo: "Tudo", cor: "from-teal-500 to-teal-950" },

  { titulo: "IA Operacional", icone: "🤖", href: "/sistema/ia", grupo: "Operacional", cor: "from-blue-500 to-blue-950" },
  { titulo: "Manuais", icone: "📖", href: "/sistema/legislacao", grupo: "Gestão", cor: "from-purple-500 to-purple-950" },
  { titulo: "Configurações", icone: "⚙️", href: "/sistema/configuracoes", grupo: "Gestão", cor: "from-orange-500 to-orange-900" },
  { titulo: "Mais Módulos", icone: "⋯", href: "/sistema", grupo: "Tudo", cor: "from-slate-700 to-slate-950" },
];

const abas = ["Tudo", "Operacional", "Gestão", "Escalas"];

export default function AppPage() {
  const [aba, setAba] = useState("Tudo");
  const [busca, setBusca] = useState("");

  const filtrados = modulos.filter((m) => {
    const passaAba = aba === "Tudo" || m.grupo === aba;
    const passaBusca = m.titulo.toLowerCase().includes(busca.toLowerCase());
    return passaAba && passaBusca;
  });

  return (
    <main className="min-h-screen bg-[#02050c] text-white px-5 pt-5 pb-28">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src="/brasao-gcm-v2.png"
            alt="SIG-GCM"
            className="w-16 h-16 object-contain"
          />

          <div>
            <h1 className="text-3xl font-black leading-none">
              SIG-GCM <span className="text-blue-400">APP</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Sistema Integrado de Gestão
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-3xl">
          <span className="relative">
            🔔
            <b className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
              3
            </b>
          </span>
          <span>⋮</span>
        </div>
      </header>

      <div className="flex justify-between border-b border-slate-800 mb-7">
        {abas.map((item) => (
          <button
            key={item}
            onClick={() => setAba(item)}
            className={`pb-3 text-lg font-bold ${
              aba === item
                ? "text-blue-400 border-b-4 border-blue-500"
                : "text-slate-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-4 gap-x-4 gap-y-8">
        {filtrados.map((modulo) => (
          <Link
            key={modulo.titulo}
            href={modulo.href}
            className="flex flex-col items-center text-center"
          >
            <div
              className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${modulo.cor} border border-white/10 shadow-[0_0_25px_rgba(59,130,246,0.25)] flex items-center justify-center text-4xl active:scale-95 transition`}
            >
              {modulo.icone}
            </div>

            <p className="mt-2 text-sm font-semibold leading-tight">
              {modulo.titulo}
            </p>
          </Link>
        ))}
      </section>

      <div className="fixed bottom-5 left-5 right-5">
        <div className="h-16 rounded-full bg-slate-950/95 border border-slate-700 flex items-center px-5 shadow-2xl">
          <span className="text-3xl text-slate-400 mr-3">🔍</span>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar módulos"
            className="bg-transparent outline-none flex-1 text-lg text-white placeholder:text-slate-500"
          />

          <span className="text-2xl text-slate-400">☷</span>
        </div>
      </div>
    </main>
  );
}