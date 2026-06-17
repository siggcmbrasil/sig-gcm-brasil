"use client";

import Link from "next/link";
import { useState } from "react";

const modulos = [
  { titulo: "Ocorrência", icone: "🚨", href: "/sistema/ocorrencias/nova", grupo: "Operacional", cor: "from-red-600 to-red-950" },
  { titulo: "Expressa", icone: "⚡", href: "/sistema/ocorrencias/expressa", grupo: "Operacional", cor: "from-orange-500 to-orange-950" },
  { titulo: "Chamados", icone: "📞", href: "/sistema/chamados", grupo: "Operacional", cor: "from-green-500 to-green-950" },
  { titulo: "Patrulha GPS", icone: "🚔", href: "/sistema/localizacao", grupo: "Operacional", cor: "from-blue-500 to-blue-950" },
  { titulo: "Rondas", icone: "🔳", href: "/sistema/rondas", grupo: "Operacional", cor: "from-indigo-500 to-indigo-950" },
  { titulo: "Mapa", icone: "🗺️", href: "/sistema/mapa-operacional", grupo: "Operacional", cor: "from-purple-500 to-purple-950" },
  { titulo: "IA", icone: "🤖", href: "/sistema/ia", grupo: "Operacional", cor: "from-cyan-500 to-cyan-950" },
  { titulo: "Guardas", icone: "👮", href: "/sistema/guardas", grupo: "Gestão", cor: "from-slate-500 to-slate-950" },
  { titulo: "Viaturas", icone: "🚓", href: "/sistema/viatura", grupo: "Gestão", cor: "from-blue-600 to-blue-950" },
  { titulo: "Escalas", icone: "📅", href: "/sistema/escalas-menu", grupo: "Escalas", cor: "from-violet-500 to-violet-950" },
  { titulo: "Relatórios", icone: "📊", href: "/sistema/relatorios", grupo: "Gestão", cor: "from-yellow-500 to-yellow-950" },
  { titulo: "Ofícios", icone: "📄", href: "/sistema/oficios", grupo: "Gestão", cor: "from-emerald-500 to-emerald-950" },
  { titulo: "Perfil", icone: "👤", href: "/sistema/perfil", grupo: "Tudo", cor: "from-slate-600 to-slate-950" },
  { titulo: "Operação", icone: "🚔", href: "/sistema/mobile/operacao", grupo: "Operacional", cor: "from-blue-700 to-slate-950" },
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
    <main className="min-h-screen bg-[#02050c] text-white pb-28">
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/brasao-gcm-v2.png"
              alt="SIG-GCM"
              className="w-14 h-14 object-contain rounded-2xl"
            />

            <div>
              <h1 className="text-2xl font-black leading-none">
                SIG-GCM <span className="text-blue-400">APP</span>
              </h1>
              <p className="text-slate-400 text-sm">Biritinga - BA</p>
            </div>
          </div>

          <Link
            href="/sistema/perfil"
            className="w-11 h-11 rounded-full bg-slate-900 border border-blue-500/30 flex items-center justify-center text-xl"
          >
            👤
          </Link>
        </div>
      </header>

      <section className="mx-4 mt-4 rounded-3xl bg-gradient-to-br from-blue-950 via-slate-950 to-slate-900 border border-blue-500/40 p-5 shadow-2xl">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs text-green-400 font-black uppercase">
              🟢 Plantão ativo
            </p>

            <h2 className="text-4xl font-black text-white leading-tight">
              Guarnição Bravo
            </h2>

            <div className="mt-3 text-slate-300 text-sm space-y-1">
              <p>🚓 VTR-01</p>
              <p>👮 2 guardas em serviço</p>
              <p>📍 Biritinga - BA</p>
            </div>
          </div>

          <span className="bg-green-500/20 text-green-400 border border-green-500/40 rounded-full px-3 py-1 text-xs font-bold">
            ONLINE
          </span>
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/sistema/ocorrencias/expressa"
            className="bg-red-700 rounded-2xl p-4 font-black text-lg shadow-xl text-center"
          >
            🚨 Ocorrência
          </Link>

          <Link
            href="/sistema/rondas"
            className="bg-green-700 rounded-2xl p-4 font-black text-lg shadow-xl text-center"
          >
            🔳 Check-in
          </Link>

        <Link
  href="/sistema/mobile/operacao"
  className="bg-blue-700 rounded-2xl p-4 font-black text-lg shadow-xl text-center"
>
  🚔 Operação
</Link>

          <Link
            href="/sistema/mapa-operacional"
            className="bg-purple-700 rounded-2xl p-4 font-black text-lg shadow-xl text-center"
          >
            🗺️ Mapa
          </Link>
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="grid grid-cols-4 gap-2">
          <MiniIndicador icone="🚨" valor="0" texto="Ocorr." />
          <MiniIndicador icone="📞" valor="0" texto="Cham." />
          <MiniIndicador icone="📍" valor="0" texto="Rondas" />
          <MiniIndicador icone="🚓" valor="1" texto="VTR" />
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="h-12 rounded-2xl bg-slate-950 border border-slate-700 flex items-center px-4">
          <span className="text-xl text-slate-400 mr-2">🔍</span>

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar módulos"
            className="bg-transparent outline-none flex-1 text-white placeholder:text-slate-500"
          />
        </div>
      </section>

      <div className="flex justify-between border-b border-slate-800 mx-4 mt-5">
        {abas.map((item) => (
          <button
            key={item}
            onClick={() => setAba(item)}
            className={`pb-3 text-sm font-bold ${
              aba === item
                ? "text-blue-400 border-b-4 border-blue-500"
                : "text-slate-400"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-4 gap-x-4 gap-y-7 px-4 mt-6">
        {filtrados.map((modulo) => (
          <Link
            key={modulo.titulo}
            href={modulo.href}
            className="flex flex-col items-center text-center active:scale-95 transition"
          >
            <div
              className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${modulo.cor} border border-white/10 flex items-center justify-center text-4xl shadow-xl`}
            >
              {modulo.icone}
            </div>

            <p className="mt-2 text-xs font-semibold leading-tight">
              {modulo.titulo}
            </p>
          </Link>
        ))}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2">
        <div className="grid grid-cols-5 text-center text-xs">
          <Link href="/sistema" className="flex flex-col items-center gap-1 text-blue-400">
            <span className="text-2xl">🏠</span>
            Home
          </Link>

          <Link href="/sistema/ocorrencias/nova" className="flex flex-col items-center gap-1 text-slate-300">
            <span className="text-2xl">🚨</span>
            Ocorrência
          </Link>

          <Link href="/sistema/rondas" className="flex flex-col items-center gap-1 text-slate-300">
            <span className="text-2xl">🔳</span>
            Rondas
          </Link>

          <Link href="/sistema/ia" className="flex flex-col items-center gap-1 text-slate-300">
            <span className="text-2xl">🤖</span>
            IA
          </Link>

          <Link href="/sistema/perfil" className="flex flex-col items-center gap-1 text-slate-300">
            <span className="text-2xl">👤</span>
            Perfil
          </Link>
        </div>
      </nav>
    </main>
  );
}

function MiniIndicador({
  icone,
  valor,
  texto,
}: {
  icone: string;
  valor: string;
  texto: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3 text-center">
      <div className="text-xl">{icone}</div>
      <div className="font-black text-lg">{valor}</div>
      <div className="text-[10px] text-slate-400">{texto}</div>
    </div>
  );
}