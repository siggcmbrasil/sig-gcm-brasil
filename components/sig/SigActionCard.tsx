"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

type Props = {
  href: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  detalhe?: string;
  badge?: string;
  className?: string;
  disabled?: boolean;
};

export default function SigActionCard({
  href,
  titulo,
  descricao,
  icone: Icon,
  detalhe,
  badge,
  className = "",
  disabled = false,
}: Props) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 text-cyan-300 transition group-hover:scale-105 group-hover:bg-cyan-400/15">
          <Icon className="h-6 w-6" />
        </div>

        {badge ? (
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="mt-5 min-w-0">
        <h2 className="text-lg font-black text-white md:text-xl">
          {titulo}
        </h2>

        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-400">
          {descricao}
        </p>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <p className="truncate text-xs font-bold text-cyan-300">
          {detalhe || "Acessar módulo"}
        </p>

        <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
      </div>
    </>
  );

  const classes = `
    group flex min-h-[190px] flex-col
    rounded-[24px] border border-slate-800/90
    bg-[#07162b]/90 p-5
    shadow-[0_18px_50px_rgba(0,0,0,.20)]
    transition-all duration-200
    hover:-translate-y-1
    hover:border-cyan-400/25
    hover:shadow-[0_22px_60px_rgba(0,0,0,.28)]
    ${disabled ? "cursor-not-allowed opacity-45" : ""}
    ${className}
  `;

  if (disabled) {
    return <div className={classes}>{conteudo}</div>;
  }

  return (
    <Link href={href} className={classes}>
      {conteudo}
    </Link>
  );
}
