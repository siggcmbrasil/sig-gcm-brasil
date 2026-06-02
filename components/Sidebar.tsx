"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type UsuarioLogado = {
  nome: string;
  matricula?: string;
  email: string;
  perfil: "ADMIN" | "COMANDANTE" | "OPERADOR" | "GUARDA";
};

export default function Sidebar() {
  const [aberto, setAberto] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");

    if (dados) {
      setUsuario(JSON.parse(dados));
    }
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    localStorage.removeItem("usuarioLogado");
    window.location.href = "/login";
  }

  function fecharMenu() {
    setAberto(false);
  }

  function podeVer(perfis: string[]) {
    if (!usuario) return false;
    return perfis.includes(usuario.perfil);
  }

  return (
    <>
      <div className="md:hidden bg-[#020b1c] border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/brasao-gcm-v2.png"
            alt="Brasão GCM Biritinga"
            className="w-12 h-12 object-contain"
          />

          <div>
            <h1 className="font-bold text-white">SIG-GCM</h1>
            <p className="text-xs text-slate-400">Biritinga - BA</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setAberto(!aberto)}
          className="bg-blue-700 px-4 py-3 rounded-xl text-white font-bold"
        >
          ☰ Menu
        </button>
      </div>

      {aberto && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={fecharMenu}
        />
      )}

      <aside
        className={`
          bg-[#020b1c] border-r border-slate-800 text-white flex flex-col z-50
          fixed md:static top-0 left-0 h-full md:h-auto
          w-80 md:w-72 md:min-h-screen
          transition-transform duration-300
          ${aberto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="p-4 md:p-6 border-b border-slate-800 flex gap-4 items-center">
          <img
            src="/brasao-gcm-v2.png"
            alt="Brasão GCM Biritinga"
            className="w-12 h-12 object-contain"
          />

          <div>
            <h1 className="text-lg font-bold">SIG-GCM BIRITINGA</h1>
            <p className="text-xs text-slate-400">
              Sistema Integrado da Guarda Civil Municipal
            </p>
          </div>
        </div>

        {usuario && (
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <p className="font-semibold text-sm">{usuario.nome}</p>
            <p className="text-xs text-slate-400">
              Matrícula: {usuario.matricula || "-"}
            </p>
            <p className="text-xs text-blue-400">
              Perfil: {usuario.perfil}
            </p>
          </div>
        )}

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <Link onClick={fecharMenu} href="/sistema" className="menu-item bg-blue-600">
            Dashboard
          </Link>

          {podeVer(["ADMIN", "COMANDANTE", "OPERADOR", "GUARDA"]) && (
            <Link onClick={fecharMenu} href="/sistema/ocorrencias" className="menu-item">
              Ocorrências
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE", "OPERADOR"]) && (
            <Link onClick={fecharMenu} href="/sistema/chamados" className="menu-item">
              Chamados
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE", "OPERADOR", "GUARDA"]) && (
            <Link onClick={fecharMenu} href="/sistema/patrulhamento" className="menu-item">
              Patrulhamento
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE", "OPERADOR"]) && (
            <Link onClick={fecharMenu} href="/sistema/veiculos" className="menu-item">
              Veículos
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE", "OPERADOR"]) && (
            <Link onClick={fecharMenu} href="/sistema/pessoas" className="menu-item">
              Pessoas
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE"]) && (
            <Link onClick={fecharMenu} href="/sistema/guardas" className="menu-item">
              Guardas
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE"]) && (
            <Link onClick={fecharMenu} href="/sistema/escalas" className="menu-item">
              Escalas
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE"]) && (
            <Link onClick={fecharMenu} href="/sistema/viatura" className="menu-item">
              Viatura
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE"]) && (
            <Link onClick={fecharMenu} href="/sistema/equipamentos" className="menu-item">
              Equipamentos
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE", "OPERADOR", "GUARDA"]) && (
            <Link onClick={fecharMenu} href="/sistema/mapa" className="menu-item">
              Mapa
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE"]) && (
            <Link onClick={fecharMenu} href="/sistema/relatorios" className="menu-item">
              Relatórios
            </Link>
          )}

          {podeVer(["ADMIN", "COMANDANTE"]) && (
            <Link onClick={fecharMenu} href="/sistema/abastecimentos" className="menu-item">
              Abastecimentos
            </Link>
          )}

          {podeVer(["ADMIN"]) && (
            <Link onClick={fecharMenu} href="/sistema/usuarios" className="menu-item">
              Usuários
            </Link>
          )}

          {podeVer(["ADMIN"]) && (
            <Link onClick={fecharMenu} href="/sistema/configuracoes" className="menu-item">
              Configurações
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-3 items-center mb-4">
            <img
              src="/brasao-gcm-v2.png"
              alt="Brasão GCM Biritinga"
              className="w-12 h-12 object-contain"
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
    </>
  );
}