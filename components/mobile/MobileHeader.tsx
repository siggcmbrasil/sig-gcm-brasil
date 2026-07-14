"use client";

import Link from "next/link";
import { Bell, Wifi, WifiOff } from "lucide-react";

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
  return (
    <header className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            {saudacao}
          </p>
          <h1 className="mt-1 truncate text-xl font-black text-white">
            {usuario?.nome || "Usuário"}
          </h1>
          <p className="mt-1 truncate text-sm text-slate-500">
            {usuario?.municipio_nome || "SIG-GCM Brasil"}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            online
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-amber-400/10 text-amber-300"
          }`}
        >
          {online ? (
            <Wifi className="h-5 w-5" />
          ) : (
            <WifiOff className="h-5 w-5" />
          )}
        </div>

        <Link
          href="/sistema/notificacoes"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-300"
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
