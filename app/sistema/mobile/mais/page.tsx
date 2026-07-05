"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import MobileBottomNav from "@/components/MobileBottomNav";

import {
  ArrowLeft,
  Bell,
  Bot,
  BookOpen,
  Car,
  ClipboardList,
  FileText,
  Flame,
  LogOut,
  Settings,
  ShieldAlert,
  UserRound,
  Users,
  WifiOff,
} from "lucide-react";

const itens = [
  { titulo: "Ativar Push", icone: Bell, href: "/sistema/perfil", },
  { titulo: "Meu Perfil", icone: UserRound, href: "/sistema/perfil" },
  { titulo: "Notificações", icone: Bell, href: "/sistema/notificacoes" },
  { titulo: "Central SOS", icone: ShieldAlert, href: "/sistema/central-sos" },
  { titulo: "Guardas", icone: Users, href: "/sistema/guardas" },
  { titulo: "Viaturas", icone: Car, href: "/sistema/viaturas" },
  { titulo: "Relatórios", icone: ClipboardList, href: "/sistema/relatorios" },
  { titulo: "IA Operacional", icone: Bot, href: "/sistema/ia" },
  { titulo: "Legislação", icone: BookOpen, href: "/sistema/legislacao" },
  { titulo: "Ofícios", icone: FileText, href: "/sistema/oficios" },
  { titulo: "Offline", icone: WifiOff, href: "/sistema/ocorrencias/offline" },
  { titulo: "Configurações", icone: Settings, href: "/sistema/configuracoes" },
  {
    titulo: "Mancha Criminal",
    icone: Flame,
    href: "/sistema/mobile/mancha-criminal",
  },
];

export default function MaisPage() {
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const salvo = localStorage.getItem("usuarioLogado");

    if (!salvo) {
      window.location.href = "/login";
      return;
    }

    const dados = JSON.parse(salvo);

    if (!dados?.id || !dados?.municipio_id) {
      window.location.href = "/login";
      return;
    }

    setUsuario(dados);
  }, []);

  function sair() {
    localStorage.removeItem("usuarioLogado");
    window.location.href = "/login";
  }

  return (
    <main className="min-h-screen bg-[#02060f] text-white p-5 pb-28">
      <button
        type="button"
        onClick={() => window.history.back()}
        className="mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2 active:scale-95"
      >
        <ArrowLeft className="w-5 h-5" />
        Voltar
      </button>

      <section className="mb-6 rounded-3xl border border-slate-800 bg-slate-900 p-5">
        <p className="text-xs text-blue-400 font-bold">
          SIG-GCM Brasil Mobile
        </p>

        <h1 className="text-3xl font-black mt-1">Mais Opções</h1>

        <p className="text-slate-400 mt-2">
          Ferramentas e módulos adicionais do sistema.
        </p>

        {usuario && (
          <p className="mt-3 text-sm text-slate-500">
            {usuario.nome || "Usuário"} • {usuario.perfil || "Perfil"}
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4">
        {itens.map((item) => {
          const Icone = item.icone;

          return (
            <Link
              key={item.titulo}
              href={item.href}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-h-36 active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-3">
                <Icone className="w-7 h-7 text-blue-400" />
              </div>

              <span className="font-bold">{item.titulo}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={sair}
          className="bg-red-950/60 border border-red-800 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-h-36 active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-600/20 flex items-center justify-center mb-3">
            <LogOut className="w-7 h-7 text-red-400" />
          </div>

          <span className="font-bold text-red-300">Sair</span>
        </button>
      </div>

      <MobileBottomNav />
    </main>
  );
}