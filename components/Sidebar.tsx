"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Activity,
  Scale,
  Newspaper,
  Boxes,
  Brain,
  Building2,
  CarFront,
  Code2,
  Cog,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  PhoneCall,
  Shield,
  ShieldCheck,
  Users,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

type Perfil =
  | "DESENVOLVEDOR"
  | "ADMIN"
  | "COMANDANTE"
  | "DIRETOR"
  | "CMT_GUARNICAO"
  | "PLANTONISTA"
  | "GUARDA"
  | "CONSULTA";

export default function Sidebar({
  usuario,
}: {
  usuario: {
    id: string;
    nome: string;
    matricula?: string;
    email: string;
    perfil: Perfil;
    municipio_id?: number;
    foto_url?: string;
  } | null;
}) {
  const pathname = usePathname();
  const [aberto, setAberto] = useState(false);
  const [menuCompacto, setMenuCompacto] = useState(false);
  const [brasaoMunicipio, setBrasaoMunicipio] = useState("");

  useEffect(() => {
    if (!usuario) return;
    carregarBrasaoMunicipio(usuario.municipio_id);
  }, [usuario]);

  async function carregarBrasaoMunicipio(municipioId?: number) {
    if (!municipioId) {
      setBrasaoMunicipio("/brasoes/sig-gcm-logo.png");
      return;
    }

    const { data, error } = await supabase
      .from("municipios")
      .select("brasao_gcm")
      .eq("id", municipioId)
      .single();

    if (error) {
      console.error("Erro ao carregar brasão:", error);
      setBrasaoMunicipio("/brasoes/sig-gcm-logo.png");
      return;
    }

    setBrasaoMunicipio(data?.brasao_gcm || "/brasoes/sig-gcm-logo.png");
  }

  async function sair() {
    if (!confirm("Deseja realmente sair do sistema?")) return;

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    }

    localStorage.clear();
    sessionStorage.clear();
    window.location.replace("/login");
  }

  function fecharMenu() {
    setAberto(false);
  }

  return (
    <>
      <div className="md:hidden bg-[#020b1c] border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src={brasaoMunicipio || "/brasoes/sig-gcm-logo.png"}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                "/brasoes/sig-gcm-logo.png";
            }}
            alt="Brasão GCM"
            className="w-16 h-16 object-contain"
          />

          <div>
            <h1 className="font-bold text-white">SIG-GCM</h1>
            <p className="text-xs text-slate-400">
              {usuario?.municipio_id
                ? `Município ID: ${usuario.municipio_id}`
                : "Município"}
            </p>
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
          bg-slate-950/80 backdrop-blur-xl border-r border-blue-900/40
          shadow-[0_0_30px_rgba(0,80,255,0.15)]
          text-white flex flex-col z-50
          fixed md:sticky top-0 left-0 h-screen
          w-80 ${menuCompacto ? "md:w-20" : "md:w-72"}
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
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {usuario && (
          <div
            className={`p-5 border-b border-slate-800 bg-slate-950/40 ${
              menuCompacto ? "text-center" : ""
            }`}
          >
            <div className="flex flex-col items-center">
              <img
                src={brasaoMunicipio || "/brasoes/sig-gcm-logo.png"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "/brasoes/sig-gcm-logo.png";
                }}
                alt="Brasão GCM"
                className={
                  menuCompacto
                    ? "w-12 h-12 object-contain"
                    : "w-40 h-40 object-contain mb-4"
                }
              />

              {!menuCompacto && (
                <>
                  <p className="font-black text-lg text-center">
                    {usuario.nome}
                  </p>

                  <p className="text-xs text-slate-400 mt-1">
                    Matrícula: {usuario.matricula || "-"}
                  </p>

                  <p className="text-xs text-blue-400 font-bold">
                    Perfil: {usuario.perfil}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        <nav className="p-0 space-y-0 flex-1 overflow-y-auto min-h-0">
         <GrupoMenu titulo="Principal" compacto={menuCompacto} />

<ItemMenu
  href="/sistema"
  icone={LayoutDashboard}
  titulo="Centro de Comando"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname === "/sistema"}
/>

<GrupoMenu titulo="Operacional" compacto={menuCompacto} />

<ItemMenu
  href="/sistema/central-ocorrencias"
  icone={Activity}
  titulo="Ocorrências"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={
    pathname.startsWith("/sistema/central-ocorrencias") ||
    pathname.startsWith("/sistema/ocorrencias")
  }
/>

<ItemMenu
  href="/sistema/chamados"
  icone={PhoneCall}
  titulo="Chamados"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname.startsWith("/sistema/chamados")}
/>

<ItemMenu
  href="/sistema/operacional"
  icone={Shield}
  titulo="Centro Operacional"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={
    pathname.startsWith("/sistema/operacional") ||
    pathname.startsWith("/sistema/patrulhamento") ||
    pathname.startsWith("/sistema/abordagens") ||
    pathname.startsWith("/sistema/operacoes")
  }
/>

<ItemMenu
  href="/sistema/central-inteligencia"
  icone={Brain}
  titulo="Inteligência"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={
    pathname.startsWith("/sistema/central-inteligencia") ||
    pathname.startsWith("/sistema/inteligencia") ||
    pathname.startsWith("/sistema/estatisticas")
  }
/>

<GrupoMenu titulo="Gestão da Guarda" compacto={menuCompacto} />

<ItemMenu
  href="/sistema/central-rh"
  icone={Users}
  titulo="RH"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname.startsWith("/sistema/rh")}
/>

<ItemMenu
  href="/sistema/central-frota"
  icone={CarFront}
  titulo="Frota"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname.startsWith("/sistema/frota")}
/>

<ItemMenu
  href="/sistema/armamentos"
  icone={ShieldCheck}
  titulo="Armamento"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname.startsWith("/sistema/armamentos")}
/>

<ItemMenu
  href="/sistema/central-patrimonio"
  icone={Boxes}
  titulo="Patrimônio"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname.startsWith("/sistema/central-patrimonio")}
/>

<GrupoMenu titulo="Jurídico e Documentos" compacto={menuCompacto} />

<ItemMenu
  href="/sistema/central-legislacao"
  icone={Scale}
  titulo="Central de Legislação"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={
    pathname.startsWith("/sistema/central-legislacao") ||
    pathname.startsWith("/sistema/legislacao") ||
    pathname.startsWith("/sistema/ia-juridica")
  }
/>

<ItemMenu
  href="/sistema/central-relatorios"
  icone={FileText}
  titulo="Relatórios"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname.startsWith("/sistema/central-relatorios")}
/>

<GrupoMenu titulo="Comunicação e Cidadão" compacto={menuCompacto} />

<ItemMenu
  href="/sistema/portal-cidadao"
  icone={Landmark}
  titulo="Portal Cidadão"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={
    pathname.startsWith("/sistema/portal-cidadao") ||
    pathname.startsWith("/sistema/central-cidadao")
  }
/>

<ItemMenu
  href="/sistema/comunicacao"
  icone={MessageCircle}
  titulo="Comunicação"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={
    pathname.startsWith("/sistema/comunicacao") ||
    pathname.startsWith("/sistema/central-comunicacao") ||
    pathname.startsWith("/sistema/chat") ||
    pathname.startsWith("/sistema/avisos") ||
    pathname.startsWith("/sistema/notificacoes") ||
    pathname.startsWith("/sistema/blog-operacional") ||
    pathname.startsWith("/sistema/agenda-institucional")
  }
/>

<GrupoMenu titulo="Administração" compacto={menuCompacto} />

<ItemMenu
  href="/sistema/central-administrativa"
  icone={Building2}
  titulo="Central Administrativa"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname.startsWith("/sistema/central-administrativa")}
/>

{["DESENVOLVEDOR", "ADMIN", "COMANDANTE", "DIRETOR"].includes(
  usuario?.perfil || ""
) && (
  <ItemMenu
    href="/sistema/administracao"
    icone={ShieldCheck}
    titulo="Administração"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
    ativo={pathname.startsWith("/sistema/administracao")}
  />
)}

<ItemMenu
  href="/sistema/configuracoes"
  icone={Cog}
  titulo="Configurações"
  fecharMenu={fecharMenu}
  compacto={menuCompacto}
  ativo={pathname.startsWith("/sistema/configuracoes")}
/>

{usuario?.perfil === "DESENVOLVEDOR" && (
  <ItemMenu
    href="/sistema/desenvolvedor"
    icone={Code2}
    titulo="Desenvolvedor"
    fecharMenu={fecharMenu}
    compacto={menuCompacto}
    ativo={pathname.startsWith("/sistema/desenvolvedor")}
  />
)}
        </nav>

        <div className="shrink-0 p-3 border-t border-slate-800 bg-slate-950">
          <div
            className={`flex gap-3 items-center mb-4 ${
              menuCompacto ? "justify-center" : ""
            }`}
          >
            <img
              src={brasaoMunicipio || "/brasoes/sig-gcm-logo.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "/brasoes/sig-gcm-logo.png";
              }}
              alt="Brasão GCM"
              className="w-12 h-12 object-contain"
            />

            {!menuCompacto && (
              <div>
                <p className="font-semibold">SIG-GCM Brasil</p>
                <p className="text-xs text-slate-400">{usuario?.nome}</p>
                <p className="text-xs text-blue-400">{usuario?.perfil}</p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={sair}
            className="w-full bg-red-700 hover:bg-red-800 px-3 py-3 rounded-lg text-base font-semibold"
          >
            {menuCompacto ? (
              <LogOut className="w-5 h-5 mx-auto" />
            ) : (
              "Sair do Sistema"
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

function GrupoMenu({
  titulo,
  compacto,
}: {
  titulo: string;
  compacto: boolean;
}) {
  if (compacto) {
    return <div className="h-3 border-b border-slate-800" />;
  }

  return (
    <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/60">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#C9A227]">
        {titulo}
      </p>
    </div>
  );
}

function ItemMenu({
  href,
  icone: Icone,
  titulo,
  fecharMenu,
  compacto,
  ativo,
}: {
  href: string;
  icone: LucideIcon;
  titulo: string;
  fecharMenu: () => void;
  compacto: boolean;
  ativo: boolean;
}) {
  return (
    <Link
      onClick={fecharMenu}
      href={href}
      className={`
        w-full flex items-center gap-4
        px-5 py-5
        text-lg font-bold
        border-b border-slate-800
        transition-all duration-200
        ${
          ativo
            ? "bg-blue-700/40 text-white border-l-4 border-l-cyan-400"
            : "text-slate-200 hover:bg-blue-700/40 hover:text-white"
        }
        ${compacto ? "justify-center px-0" : ""}
      `}
      title={titulo}
    >
      <Icone
  className={`w-9 h-9 shrink-0 ${
          ativo ? "text-cyan-300" : "text-blue-400"
        }`}
      />

      {!compacto && <span>{titulo}</span>}
    </Link>
  );
}