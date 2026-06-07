"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Perfil =
  | "ADMIN"
  | "COMANDANTE"
  | "DIRETOR"
  | "CMT_GUARNICAO"
  | "PLANTONISTA"
  | "CONSULTA";

type UsuarioLogado = {
  nome: string;
  matricula?: string;
  email: string;
  perfil: Perfil;
};

export default function Sidebar() {
  const [aberto, setAberto] = useState(false);
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);

  useEffect(() => {
    const dados = localStorage.getItem("usuarioLogado");
    if (dados) setUsuario(JSON.parse(dados));
  }, []);

  async function sair() {
    await supabase.auth.signOut();
    localStorage.removeItem("usuarioLogado");
    window.location.href = "/login";
  }

  function fecharMenu() {
    setAberto(false);
  }

  function podeVer(perfis: Perfil[]) {
    if (!usuario) return false;
    return perfis.includes(usuario.perfil);
  }

  const todos: Perfil[] = [
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "PLANTONISTA",
    "CONSULTA",
  ];

  const operacionais: Perfil[] = [
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
    "PLANTONISTA",
  ];

  const comando: Perfil[] = [
    "ADMIN",
    "COMANDANTE",
    "DIRETOR",
    "CMT_GUARNICAO",
  ];

  const gestao: Perfil[] = ["ADMIN", "COMANDANTE", "DIRETOR"];

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
            <h1 className="text-lg font-bold">SIG-GCM Brasil</h1>
            <p className="text-xs text-slate-400">
              Sistema Integrado das Guardas Municipais
            </p>
          </div>
        </div>

        {usuario && (
          <div className="p-4 border-b border-slate-800 bg-slate-950/40">
            <p className="font-semibold text-sm">{usuario.nome}</p>
            <p className="text-xs text-slate-400">
              Matrícula: {usuario.matricula || "-"}
            </p>
            <p className="text-xs text-blue-400">Perfil: {usuario.perfil}</p>
          </div>
        )}

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          <Link onClick={fecharMenu} href="/sistema" className="menu-item bg-blue-600">
            🏠 Dashboard
          </Link>

          <Divisor />

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/ocorrencias" className="menu-item">
              🚨 Ocorrências
            </Link>
          )}

          {podeVer(operacionais) && (
            <Link onClick={fecharMenu} href="/sistema/offline" className="menu-item">
              📴 Ocorrências Offline
            </Link>
          )}

          {podeVer(operacionais) && (
            <Link onClick={fecharMenu} href="/sistema/chamados" className="menu-item">
              📞 Chamados
            </Link>
          )}

          {podeVer(operacionais) && (
            <Link onClick={fecharMenu} href="/sistema/patrulhamento" className="menu-item">
              🚔 Patrulhamento
            </Link>
          )}

          <Divisor />

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/pessoas" className="menu-item">
              👤 Pessoas
            </Link>
          )}

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/veiculos" className="menu-item">
              🚗 Veículos
            </Link>
          )}

          {podeVer(todos) && (
  <Link
    onClick={fecharMenu}
    href="/sistema/locais"
    className="menu-item"
  >
    📍 Cadastro Territorial
  </Link>
)}

          {podeVer(operacionais) && (
            <Link onClick={fecharMenu} href="/sistema/ia" className="menu-item">
              🤖 IA Operacional
            </Link>
          )}

          {podeVer(gestao) && (
            <Link onClick={fecharMenu} href="/sistema/equipamentos" className="menu-item">
              🦺 Equipamentos
            </Link>
          )}

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/viatura" className="menu-item">
              🚓 Viatura
            </Link>
          )}

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/relatorios" className="menu-item">
              📋 Relatórios
            </Link>
          )}

          <Divisor />

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/guardas" className="menu-item">
              👮 Guardas
            </Link>
          )}

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/escalas" className="menu-item">
              📅 Escalas
            </Link>
          )}

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/escalas/modelos" className="menu-item">
              ⚙️ Modelos de Escala
            </Link>
          )}

          <Link
  onClick={fecharMenu}
  href="/sistema/escalas/configuracao"
  className="menu-item"
>
  🧭 Configuração da Escala
</Link>

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/escalas/permutas" className="menu-item">
              🔁 Permutas de Plantão
            </Link>
          )}

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/guarnicoes" className="menu-item">
              👥 Guarnições
            </Link>
          )}

          {podeVer(comando) && (
            <Link onClick={fecharMenu} href="/sistema/estatisticas" className="menu-item">
              📊 Estatísticas
            </Link>
          )}

          {podeVer(todos) && (
            <Link onClick={fecharMenu} href="/sistema/historico" className="menu-item">
              🗂️ Arquivo
            </Link>
          )}

          {podeVer(["ADMIN"]) && (
            <Link onClick={fecharMenu} href="/sistema/usuarios" className="menu-item">
              👤 Usuários
            </Link>
          )}

          <Link onClick={fecharMenu} href="/sistema/municipios"className="menu-item">
              🏛️ Municípios
            </Link>

          <Divisor />

          {podeVer(["ADMIN"]) && (
            <Link onClick={fecharMenu} href="/sistema/configuracoes" className="menu-item">
              ⚙️ Configurações
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

function Divisor() {
  return <div className="border-t border-slate-800 my-3" />;
}