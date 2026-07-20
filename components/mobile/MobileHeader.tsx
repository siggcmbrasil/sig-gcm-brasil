"use client";

import Link from "next/link";
import { Bell, Shield, Wifi, WifiOff } from "lucide-react";

export default function MobileHeader({
  usuario,
  online,
  saudacao,
  notificacoes,
}: {
  usuario: any;
  online: boolean;
  saudacao: string;
  notificacoes: number;
}) {
  const agora = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <header className="overflow-hidden rounded-[26px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.15),transparent_42%),linear-gradient(135deg,#0a1b35,#041025)] p-3.5 shadow-2xl shadow-black/25">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10">
          <Shield className="h-6 w-6 text-cyan-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-300">
              {saudacao}
            </p>
            <span className="text-[9px] font-bold text-slate-500">{agora}</span>
          </div>
          <h1 className="mt-0.5 truncate text-lg font-black text-white">
            {usuario?.nome || "Usuário"}
          </h1>
          <p className="truncate text-[11px] font-medium text-slate-400">
            {usuario?.municipio_nome || "SIG-GCM Brasil"}
          </p>
        </div>

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
            online
              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
              : "border-amber-400/20 bg-amber-400/10 text-amber-300"
          }`}
        >
          {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        </div>

        <Link
          href="/sistema/notificacoes"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[.04] text-slate-200"
        >
          <Bell className="h-4 w-4" />
          {notificacoes > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[8px] font-black text-white">
              {notificacoes > 99 ? "99+" : notificacoes}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
