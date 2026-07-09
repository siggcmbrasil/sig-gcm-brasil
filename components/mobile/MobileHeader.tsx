"use client";

import Link from "next/link";
import { Bell, Circle, Wifi, WifiOff } from "lucide-react";

export default function MobileHeader({
  usuario,
  online,
  saudacao,
  dataHoje,
  guarnicaoDia,
}: {
  usuario: any;
  online: boolean;
  saudacao: string;
  dataHoje: string;
  guarnicaoDia: any;
}) {
  return (
    <header className="rounded-3xl border border-slate-800/80 bg-slate-950/65 p-3 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-300">
            SIG-GCM Mobile
          </p>

          <h1 className="mt-1 truncate text-xl font-black">
            👮 {usuario?.nome?.split(" ")[0] || "Guarda"}
          </h1>

          <p className="mt-0.5 text-xs text-slate-400">
            {saudacao} • {dataHoje}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-flex h-9 items-center gap-1 rounded-2xl border px-2 text-[10px] font-black ${
              online
                ? "border-green-500/30 bg-green-500/15 text-green-400"
                : "border-red-500/30 bg-red-500/15 text-red-400"
            }`}
          >
            {online ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            {online ? "ON" : "OFF"}
          </span>

          <Link
            href="/sistema/notificacoes"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900"
          >
            <Bell className="h-4 w-4 text-blue-300" />
          </Link>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-300">
            {guarnicaoDia
              ? `${guarnicaoDia.viatura} • ${guarnicaoDia.nome}`
              : "Guarnição não localizada"}
          </p>

          <p className="truncate text-[11px] text-slate-500">
            {guarnicaoDia
              ? `CMT: ${guarnicaoDia.comandante}`
              : "Configure a escala operacional"}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-green-400">
          <Circle className="h-2.5 w-2.5 fill-current" />
          Serviço
        </span>
      </div>
    </header>
  );
}