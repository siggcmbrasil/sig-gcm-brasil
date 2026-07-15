"use client";

import Link from "next/link";
import {
  CarFront,
  ChevronRight,
  ShieldCheck,
  UserRound,
} from "lucide-react";

export default function MobileGuarnicaoCard({
  guarnicaoDia,
}: {
  guarnicaoDia: any;
}) {
  return (
    <Link
      href="/sistema/mobile/guarnicao"
      className="block rounded-[28px] border border-blue-300/25 bg-gradient-to-br from-blue-600/18 via-slate-900 to-slate-950 p-4 shadow-xl transition active:scale-[0.99]"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-blue-400/15 ring-1 ring-blue-300/20">
          <ShieldCheck className="h-7 w-7 text-blue-200" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-300">
              Equipe de serviço
            </p>

            {guarnicaoDia ? (
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                ATIVA
              </span>
            ) : null}
          </div>

          <h2 className="mt-1 text-xl font-black text-white">
            {guarnicaoDia?.nome || "Sem guarnição definida"}
          </h2>

          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 shrink-0 text-cyan-300" />
              <span className="truncate">
                {guarnicaoDia?.comandante ||
                  "Comandante não informado"}
              </span>
            </p>

            <p className="flex items-center gap-2">
              <CarFront className="h-4 w-4 shrink-0 text-cyan-300" />
              <span className="truncate">
                {guarnicaoDia?.viatura ||
                  "Viatura não informada"}
              </span>
            </p>
          </div>
        </div>

        <ChevronRight className="mt-1 h-6 w-6 text-blue-200/70" />
      </div>
    </Link>
  );
}
