"use client";

import Link from "next/link";
import { useState } from "react";

const modulos = [
  { titulo: "Ocorrência", icone: "🚨", href: "/sistema/ocorrencias/nova", grupo: "Operacional", cor: "from-red-600 to-red-950" },
  { titulo: "Expressa", icone: "⚡", href: "/sistema/ocorrencias/expressa", grupo: "Operacional", cor: "from-orange-500 to-orange-950" },
  { titulo: "Chamados", icone: "📞", href: "/sistema/chamados", grupo: "Operacional", cor: "from-green-500 to-green-950" },
  { titulo: "Patrulha", icone: "🚔", href: "/sistema/patrulhamento", grupo: "Operacional", cor: "from-blue-500 to-blue-950" },
  { titulo: "Mapa", icone: "🗺️", href: "/sistema/locais", grupo: "Operacional", cor: "from-purple-500 to-purple-950" },
  { titulo: "IA", icone: "🤖", href: "/sistema/ia", grupo: "Operacional", cor: "from-cyan-500 to-cyan-950" },

  { titulo: "Guardas", icone: "👮", href: "/sistema/guardas", grupo: "Gestão", cor: "from-slate-500 to-slate-950" },
  { titulo: "Viaturas", icone: "🚓", href: "/sistema/viatura", grupo: "Gestão", cor: "from-blue-600 to-blue-950" },
  { titulo: "Escalas", icone: "📅", href: "/sistema/escalas-menu", grupo: "Escalas", cor: "from-violet-500 to-violet-950" },
  { titulo: "Relatórios", icone: "📊", href: "/sistema/relatorios", grupo: "Gestão", cor: "from-yellow-500 to-yellow-950" },
  { titulo: "Ofícios", icone: "📄", href: "/sistema/oficios", grupo: "Gestão", cor: "from-emerald-500 to-emerald-950" },
  { titulo: "Perfil", icone: "👤", href: "/sistema/perfil", grupo: "Tudo", cor: "from-slate-600 to-slate-950" },
  { titulo: "GPS", icone: "📍", href: "/sistema/localizacao", grupo: "Operacional", cor: "from-cyan-500 to-cyan-950"},
];

const abas = ["Tudo", "Operacional", "Gestão", "Escalas"];

export default function TelaMobile() {
  const [aba, setAba] = useState("Tudo");
  const [busca, setBusca] = useState("");

  const filtrados = modulos.filter((m) => {
    const passaAba = aba === "Tudo" || m.grupo === aba;
    const passaBusca = m.titulo.toLowerCase().includes(busca.toLowerCase());
    return passaAba && passaBusca;
  });

  return (
    <main className="min-h-screen bg-[#02050c] text-white px-5 pt-5 pb-28">
      <header className="flex items-center gap-3 mb-6">
        <img src="/brasao-gcm-v2.png" alt="SIG-GCM" className="w-16 h-16 object-contain" />

        <div>
          <h1 className="text-3xl font-black leading-none">
            SIG-GCM <span className="text-blue-400">APP</span>
          </h1>
          <p className="text-slate-400 text-sm">Modo operacional mobile</p>
        </div>
      </header>

      <div className="flex justify-between border-b border-slate-800 mb-7">
        {abas.map((item) => (
          <button
            key={item}
            onClick={() => setAba(item)}
            className={`pb-3 text-base font-bold ${
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
          <Link key={modulo.titulo} href={modulo.href} className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${modulo.cor} border border-white/10 flex items-center justify-center text-4xl shadow-xl`}>
              {modulo.icone}
            </div>

            <p className="mt-2 text-xs font-semibold leading-tight">
              {modulo.titulo}
            </p>
          </Link>
        ))}
      </section>

      <div className="fixed bottom-5 left-5 right-5">
        <div className="h-14 rounded-full bg-slate-950 border border-slate-700 flex items-center px-5 shadow-2xl">
          <span className="text-2xl text-slate-400 mr-3">🔍</span>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar módulos"
            className="bg-transparent outline-none flex-1 text-white placeholder:text-slate-500"
          />
        </div>
      </div>
    </main>
  );
}