"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { buscarModulosPermitidos, moduloLiberado } from "@/lib/permissoesMenu";

type Perfil =
  | "DESENVOLVEDOR"
  | "ADMIN"
  | "COMANDANTE"
  | "DIRETOR"
  | "CMT_GUARNICAO"
  | "PLANTONISTA"
  | "GUARDA"
  | "CONSULTA";

type UsuarioLogado = {
  id: string;
  nome: string;
  matricula: string;
  email: string;
  perfil: Perfil;
  foto_url?: string;
  municipio_id?: number;
};

export default function Sidebar() {
  const [aberto, setAberto] = useState(false);
  const [menuCompacto, setMenuCompacto] = useState(false);
  const [menuAberto, setMenuAberto] = useState("operacional");
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [modulosPermitidos, setModulosPermitidos] = useState<string[]>([]);
  const [brasaoMunicipio, setBrasaoMunicipio] = useState("");

  useEffect(() => {
  async function iniciar() {
    const dados = localStorage.getItem("usuarioLogado");

    if (!dados) return;

    const usuarioLogado = JSON.parse(dados);
    setUsuario(usuarioLogado);
    carregarBrasaoMunicipio(usuarioLogado.municipio_id);

    const modulos = await buscarModulosPermitidos(usuarioLogado.perfil);
    setModulosPermitidos(modulos);
  }

  iniciar();
}, []);

async function carregarBrasaoMunicipio(municipioId?: number) {
  if (!municipioId) return;

  const { data, error } = await supabase
    .from("municipios")
    .select("brasao_gcm")
    .eq("id", municipioId)
    .single();

  if (error) {
    console.error("Erro ao carregar brasão:", error);
    return;
  }

  if (data?.brasao_gcm) {
    setBrasaoMunicipio(data.brasao_gcm);
  }
}

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

  if (usuario.perfil === "DESENVOLVEDOR") {
    return true;
  }

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

  function podeVerModuloMenu(modulo: string) {
  return moduloLiberado(modulosPermitidos, modulo);
}

  return (
    <>
      <div className="md:hidden bg-[#020b1c] border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
  src={brasaoMunicipio || "/brasao-gcm-v2.png"}
  alt="Brasão GCM"
  className="w-20 h-20 object-contain mb-3"
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
    bg-slate-950/80 
backdrop-blur-xl 
border-r border-blue-900/40 
shadow-[0_0_30px_rgba(0,80,255,0.15)] text-white flex flex-col z-50
    fixed md:sticky top-0 left-0 h-screen
w-80
    ${menuCompacto ? "md:w-20" : "md:w-72"}
    transition-all duration-300
    ${aberto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
  `}
>
  <div className="hidden md:flex justify-end p-2 border-b border-slate-800">
    <button
      type="button"
      onClick={() => setMenuCompacto(!menuCompacto)}
      className="text-white text-xl hover:text-blue-400"
    >
      ☰
    </button>
  </div>

  <div className="p-4 md:p-6 border-b border-slate-800 flex gap-4 items-center">
  {!menuCompacto && (
    <div>
      <h1 className="text-lg font-bold">SIG-GCM Brasil</h1>
      <p className="text-xs text-slate-400">
        Sistema Integrado das Guardas Municipais
      </p>
    </div>
  )}
</div>

{usuario && (
  <div
    className={`p-4 border-b border-slate-800 bg-slate-950/40 ${
      menuCompacto ? "text-center" : ""
    }`}
  >
    <div className="flex flex-col items-center">

      <img
        src={brasaoMunicipio || "/brasao-gcm-v2.png"}
        alt="Brasão GCM"
        className="w-20 h-20 object-contain mb-3"
      />

      {!menuCompacto && (
        <>
          <p className="font-bold text-center">
            {usuario.nome}
          </p>

          <p className="text-xs text-slate-400">
            Matrícula: {usuario.matricula || "-"}
          </p>

          <p className="text-xs text-blue-400">
            Perfil: {usuario.perfil}
          </p>
        </>
      )}

    </div>
  </div>
)}

        <nav
  className={`p-3 space-y-2 flex-1 overflow-y-auto min-h-0 ${
    menuCompacto ? "items-center" : ""
  }`}
>
  <ItemMenu
    href="/sistema"
    icone="🏠"
    titulo="Dashboard"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
  />

  {podeVerModuloMenu("ocorrencias") && (
  <ItemMenu
    href="/sistema/operacional"
    icone="🚔"
    titulo="Operacional"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
  />
)}

{podeVerModuloMenu("guardas") && (
  <ItemMenu
    href="/sistema/cadastros"
    icone="👥"
    titulo="Cadastros"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
  />
)}

{podeVerModuloMenu("escalas") && (
  <ItemMenu
    href="/sistema/escalas-menu"
    icone="📅"
    titulo="Escalas"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
  />
)}

{podeVerModuloMenu("relatorios") && (
  <ItemMenu
    href="/sistema/gestao"
    icone="📊"
    titulo="Gestão"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
  />
)}

{podeVerModuloMenu("ia") && (
  <ItemMenu
    href="/sistema/inteligencia"
    icone="🤖"
    titulo="Inteligência"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
  />
)}

{podeVerModuloMenu("administracao") && (
  <ItemMenu
    href="/sistema/administracao"
    icone="🛡️"
    titulo="Administração"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
  />
)}

{podeVerModuloMenu("configuracoes") && (
  <ItemMenu
    href="/sistema/configuracoes"
    icone="⚙️"
    titulo="Configurações"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
  />
)}
</nav>

        <div className="shrink-0 p-3 border-t border-slate-800 bg-slate-950">
          <div className="flex gap-3 items-center mb-4">
            <img
              src={brasaoMunicipio || "/brasao-gcm-v2.png"}
              alt="Brasão GCM Biritinga"
              className="w-12 h-12 object-contain"
            />

            <div>
              <p className="font-semibold">SIG-GCM Brasil</p>
              <p className="text-xs text-slate-400">
                  Sistema Integrado das Guardas Municipais
            </p>
              <p className="text-xs text-slate-1000">
                  suporte@siggcmbrasil.com
            </p>
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

function GrupoMenu({
  titulo,
  icone,
  aberto,
  onClick,
  compacto,
}: {
  titulo: string;
  icone: string;
  aberto: boolean;
  onClick: () => void;
  compacto: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      className="menu-item w-full flex items-center justify-between"
    >
      <span>
        {icone} {!compacto && titulo}
      </span>

      {!compacto && <span>{aberto ? "▼" : "▶"}</span>}
    </button>
  );
}

function ItemMenu({
  href,
  icone,
  titulo,
  fecharMenu,
  compacto,
}: {
  href: string;
  icone: string;
  titulo: string;
  fecharMenu: () => void;
  compacto: boolean;
}) {
  return (
    <Link
      onClick={fecharMenu}
      href={href}
      className="menu-item ml-3 text-sm"
      title={titulo}
    >
      <span>{icone}</span>
      {!compacto && <span>{titulo}</span>}
    </Link>
  );
}

function Divisor() {
  return <div className="border-t border-slate-800 my-3" />;
}