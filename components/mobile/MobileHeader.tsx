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
    <header className="overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/80 p-4 shadow-2xl">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-300/20">
          <Shield className="h-7 w-7 text-cyan-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
              {saudacao}
            </p>
            <span className="text-[11px] font-bold text-slate-500">
              {agora}
            </span>
          </div>

          <h1 className="mt-1 truncate text-xl font-black text-white">
            {usuario?.nome || "Usuário"}
          </h1>

          <p className="mt-1 truncate text-sm font-medium text-slate-400">
            {usuario?.municipio_nome || "SIG-GCM Brasil"}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            online
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-amber-400/10 text-amber-300"
          }`}
          title={online ? "Online" : "Offline"}
        >
          {online ? (
            <Wifi className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
        </div>

        <Link
          href="/sistema/notificacoes"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-slate-200 ring-1 ring-white/10"
        >
          <Bell className="h-5 w-5" />

          {notificacoes > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
              {notificacoes > 99 ? "99+" : notificacoes}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
