"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type SigPageHeaderProps = {
  titulo: string;
  subtitulo?: string;
  icone?: LucideIcon;
  acoes?: ReactNode;
  detalhe?: string;
  className?: string;
};

export default function SigPageHeader({
  titulo,
  subtitulo,
  icone: Icon,
  acoes,
  detalhe,
  className = "",
}: SigPageHeaderProps) {
  return (
    <header
      className={`
        overflow-hidden rounded-[28px]
        border border-cyan-400/15
        bg-[linear-gradient(135deg,rgba(3,13,32,.96),rgba(7,22,43,.92))]
        shadow-[0_24px_70px_rgba(0,0,0,.26)]
        ${className}
      `}
    >
      <div className="flex flex-col gap-5 p-5 md:p-7 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {Icon ? (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,.08)]">
              <Icon className="h-7 w-7" />
            </div>
          ) : null}

          <div className="min-w-0">
            {detalhe ? (
              <p className="mb-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                {detalhe}
              </p>
            ) : null}

            <h1 className="break-words text-2xl font-black tracking-tight text-white md:text-4xl">
              {titulo}
            </h1>

            {subtitulo ? (
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400 md:text-base">
                {subtitulo}
              </p>
            ) : null}
          </div>
        </div>

        {acoes ? (
          <div className="flex w-full flex-wrap gap-2 lg:w-auto lg:justify-end">
            {acoes}
          </div>
        ) : null}
      </div>

      <div className="h-px bg-[linear-gradient(90deg,transparent,rgba(34,211,238,.35),transparent)]" />
    </header>
  );
}
