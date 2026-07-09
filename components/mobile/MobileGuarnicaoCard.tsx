"use client";

import Link from "next/link";
import { ChevronRight, Clock, Shield, Users } from "lucide-react";

export default function MobileGuarnicaoCard({
  guarnicaoDia,
}: {
  guarnicaoDia: any;
}) {
  return (
    <Link
      href="/sistema/mobile/guarnicao"
      className="
        block
        rounded-3xl
        border
        border-slate-800
        bg-slate-900/90
        p-4
        shadow-xl
        active:scale-[0.99]
      "
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-400" />
          <span className="font-bold text-slate-200">
            Guarnição do Dia
          </span>
        </div>

        <ChevronRight className="h-5 w-5 text-slate-500" />
      </div>

      {guarnicaoDia ? (
        <>
          <h2 className="text-2xl font-black text-blue-300">
            {guarnicaoDia.viatura}
          </h2>

          <p className="mt-1 text-sm font-semibold text-white">
            {guarnicaoDia.nome}
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">

            <div className="rounded-2xl bg-slate-800/60 p-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-slate-400">
                  Integrantes
                </span>
              </div>

              <p className="mt-1 text-lg font-bold">
                {guarnicaoDia.membros.length}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/60 p-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-400" />
                <span className="text-xs text-slate-400">
                  Turno
                </span>
              </div>

              <p className="mt-1 text-sm font-bold text-green-400">
                Em Serviço
              </p>
            </div>

          </div>

          <div className="mt-4 rounded-2xl bg-slate-800/50 p-3">
            <p className="text-xs text-slate-400">
              Comandante
            </p>

            <p className="mt-1 font-semibold">
              {guarnicaoDia.comandante}
            </p>
          </div>
        </>
      ) : (
        <div className="rounded-2xl bg-slate-800/50 p-4 text-center text-sm text-slate-400">
          Nenhuma guarnição encontrada para hoje.
        </div>
      )}
    </Link>
  );
}