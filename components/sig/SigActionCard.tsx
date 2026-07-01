"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Props = {
  href: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
  detalhe?: string;
};

export default function SigActionCard({
  href,
  titulo,
  descricao,
  icone: Icon,
  detalhe,
}: Props) {
  return (
    <Link
      href={href}
      className="
        painel-premium
        p-4
        min-h-[150px]
        hover:border-yellow-500
        hover:scale-[1.02]
        transition
        block
      "
    >
      <Icon className="w-10 h-10 text-yellow-400 mb-4" />

      <h2 className="text-lg font-black text-white">
        {titulo}
      </h2>

      <p className="text-slate-400 text-sm mt-3 leading-relaxed">
        {descricao}
      </p>

      {detalhe && (
        <p className="text-yellow-400 text-xs font-bold mt-4">
          {detalhe}
        </p>
      )}
    </Link>
  );
}