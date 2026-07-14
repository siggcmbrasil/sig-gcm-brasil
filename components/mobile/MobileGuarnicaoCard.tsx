"use client";

import Link from "next/link";
import {
  CarFront,
  ChevronRight,
  Shield,
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
      className="block rounded-3xl border border-blue-400/25 bg-gradient-to-br from-blue-600/15 to-slate-950 p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15">
          <Shield className="h-7 w-7 text-blue-300" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wider text-blue-300">
            Guarnição do dia
          </p>

          <h2 className="mt-1 text-xl font-black text-white">
            {guarnicaoDia?.nome || "Sem guarnição definida"}
          </h2>

          <div className="mt-3 grid gap-2 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-cyan-300" />
              {guarnicaoDia?.comandante || "Comandante não informado"}
            </p>

            <p className="flex items-center gap-2">
              <CarFront className="h-4 w-4 text-cyan-300" />
              {guarnicaoDia?.viatura || "Viatura não informada"}
            </p>
          </div>
        </div>

        <ChevronRight className="h-6 w-6 text-slate-500" />
      </div>
    </Link>
  );
}
