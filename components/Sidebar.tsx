"use client";

import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Sidebar() {
  async function sair() {
    await supabase.auth.signOut();
    localStorage.removeItem("usuarioLogado");
    window.location.href = "/login";
  }

  return (
    <aside className="w-full md:w-72 md:min-h-screen bg-[#020b1c] border-r border-slate-800 text-white flex flex-col">
      <div className="p-4 md:p-6 border-b border-slate-800 flex gap-4 items-center">
        <Image
          src="/brasao-gcm.png"
          alt="Brasão GCM Biritinga"
          width={70}
          height={70}
          style={{ width: "70px", height: "auto" }}
          priority
        />

        <div>
          <h1 className="text-lg font-bold">SIG-GCM BIRITINGA</h1>

          <p className="text-xs text-slate-400">
            Sistema Integrado da Guarda Civil Municipal
          </p>
        </div>
      </div>

      <nav className="p-4 space-y-2 md:flex-1">
        <Link href="/sistema" className="menu-item bg-blue-600">
          Dashboard
        </Link>

        <Link href="/sistema/ocorrencias" className="menu-item">
          Ocorrências
        </Link>

        <Link href="/sistema/chamados" className="menu-item">
          Chamados
        </Link>

        <Link href="/sistema/patrulhamento" className="menu-item">
          Patrulhamento
        </Link>

        <Link href="/sistema/veiculos" className="menu-item">
          Veículos
        </Link>

        <Link href="/sistema/pessoas" className="menu-item">
          Pessoas
        </Link>

        <Link href="/sistema/guardas" className="menu-item">
          Guardas
        </Link>

        <Link href="/sistema/escalas" className="menu-item">
          Escalas
        </Link>

        <Link href="/sistema/viatura" className="menu-item">
          Viatura
        </Link>

        <Link href="/sistema/mapa" className="menu-item">
          Mapa
        </Link>

        <Link href="/sistema/relatorios" className="menu-item">
          Relatórios
        </Link>

        <Link href="/sistema/configuracoes" className="menu-item">
          Configurações
        </Link>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex gap-3 items-center mb-4">
          <Image
            src="/brasao-gcm.png"
            alt="GCM Biritinga"
            width={50}
            height={50}
            style={{ width: "50px", height: "auto" }}
          />

          <div>
            <p className="font-semibold">GCM Biritinga</p>
            <p className="text-xs text-slate-400">Servir e Proteger</p>
            <p className="text-xs text-slate-500">Biritinga - Bahia</p>
          </div>
        </div>

        <button
          type="button"
          onClick={sair}
          className="w-full bg-red-700 hover:bg-red-800 px-3 py-3 rounded-lg text-base font-semibold"
        >
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}