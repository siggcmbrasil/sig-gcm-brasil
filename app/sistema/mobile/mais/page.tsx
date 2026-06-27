"use client";

import Link from "next/link";
import MobileBottomNav from "@/components/MobileBottomNav";

import {
  Users,
  Car,
  ClipboardList,
  Bot,
  BookOpen,
  FileText,
  WifiOff,
  Settings,
  Flame,
  ArrowLeft,
} from "lucide-react";

const itens = [
  { titulo: "Guardas", icone: Users, href: "/sistema/guardas" },
  { titulo: "Viaturas", icone: Car, href: "/sistema/viaturas" },
  { titulo: "Relatórios", icone: ClipboardList, href: "/sistema/relatorios" },
  { titulo: "IA Operacional", icone: Bot, href: "/sistema/ia" },
  { titulo: "Legislação", icone: BookOpen, href: "/sistema/legislacao" },
  { titulo: "Ofícios", icone: FileText, href: "/sistema/oficios" },
  { titulo: "Offline", icone: WifiOff, href: "/sistema/offline" },
  { titulo: "Configurações", icone: Settings, href: "/sistema/configuracoes" },
  {
    titulo: "Mancha Criminal",
    icone: Flame,
    href: "/sistema/mobile/mancha-criminal",
  },
];

export default function MaisPage() {
  return (
    <main className="min-h-screen bg-[#02060f] text-white p-5">
        
        <button
  onClick={() => window.history.back()}
  className="mb-5 bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-2"
>
  <ArrowLeft className="w-5 h-5" />
  Voltar
</button>
      <h1 className="text-3xl font-black mb-2">
  Mais Opções
</h1>

<p className="text-slate-400 mb-6">
  Ferramentas e módulos adicionais do SIG-GCM Brasil.
</p>

      <div className="grid grid-cols-2 gap-4">
        {itens.map((item) => {
  const Icone = item.icone;

  return (
          <Link
            key={item.titulo}
            href={item.href}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col items-center justify-center text-center min-h-36"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-3">
  <Icone className="w-7 h-7 text-blue-400" />
</div>

            <span className="font-bold">
              {item.titulo}
            </span>
          </Link>
        );
})}
<main className="min-h-screen bg-[#02060f] text-white p-5 pb-28"></main>
      </div>

<MobileBottomNav />

    </main>
  );
}