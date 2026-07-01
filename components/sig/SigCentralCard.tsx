"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface Props {
  titulo: string;
  descricao: string;
  href: string;
  icone: LucideIcon;
}

export default function SigCentralCard({
  titulo,
  descricao,
  href,
  icone: Icon,
}: Props) {
  return (
    <Link
      href={href}
      className="
        painel-premium
        min-h-[240px]
        p-5
        hover:border-cyan-400/50
        hover:shadow-[0_0_25px_rgba(34,211,238,0.18)]
        hover:-translate-y-1
        transition-all
        duration-300
        group
      "
    >
      <div className="flex items-center justify-between">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Icon className="w-9 h-9 text-cyan-400" />
        </div>

        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-400 text-xs font-black">
          ONLINE
        </span>
      </div>

      <h2 className="mt-5 text-[2.1rem] font-black text-white leading-none">
        {titulo}
      </h2>

      <div className="h-10" />

      <p className="text-yellow-400 text-sm font-medium leading-relaxed">
        {descricao}
      </p>
    </Link>
  );
}