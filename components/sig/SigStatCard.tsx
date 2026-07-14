"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  titulo: string;
  valor: string | number;
  icone?: LucideIcon;
  className?: string;
  subtitulo?: string;
  detalhe?: ReactNode;
  destaque?: "cyan" | "blue" | "green" | "amber" | "red" | "slate";
};

const variantes = {
  cyan: {
    icon: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
    glow: "shadow-[0_0_35px_rgba(34,211,238,.06)]",
  },
  blue: {
    icon: "border-blue-400/25 bg-blue-400/10 text-blue-300",
    glow: "shadow-[0_0_35px_rgba(59,130,246,.06)]",
  },
  green: {
    icon: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    glow: "shadow-[0_0_35px_rgba(52,211,153,.06)]",
  },
  amber: {
    icon: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    glow: "shadow-[0_0_35px_rgba(251,191,36,.06)]",
  },
  red: {
    icon: "border-red-400/25 bg-red-400/10 text-red-300",
    glow: "shadow-[0_0_35px_rgba(248,113,113,.06)]",
  },
  slate: {
    icon: "border-slate-600 bg-slate-800 text-slate-300",
    glow: "",
  },
};

export default function SigStatCard({
  titulo,
  valor,
  icone: Icon,
  className = "",
  subtitulo,
  detalhe,
  destaque = "cyan",
}: Props) {
  const variante = variantes[destaque];

  return (
    <article
      className={`
        min-h-[132px] rounded-[22px]
        border border-slate-800/90
        bg-[#07162b]/90 p-5
        shadow-[0_18px_50px_rgba(0,0,0,.20)]
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-cyan-400/20
        ${variante.glow}
        ${className}
      `}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {titulo}
          </p>

          <h2 className="mt-2 break-words text-3xl font-black tracking-tight text-white md:text-4xl">
            {valor}
          </h2>

          {subtitulo ? (
            <p className="mt-2 text-sm text-slate-400">
              {subtitulo}
            </p>
          ) : null}

          {detalhe ? (
            <div className="mt-3 text-xs text-slate-500">
              {detalhe}
            </div>
          ) : null}
        </div>

        {Icon ? (
          <div
            className={`
              flex h-12 w-12 shrink-0
              items-center justify-center rounded-2xl border
              ${variante.icon}
            `}
          >
            <Icon className="h-6 w-6" />
          </div>
        ) : null}
      </div>
    </article>
  );
}
