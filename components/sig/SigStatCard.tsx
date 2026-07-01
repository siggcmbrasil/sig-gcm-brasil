"use client";

import type { LucideIcon } from "lucide-react";

type Props = {
  titulo: string;
  valor: string | number;
  icone?: LucideIcon;
  className?: string;
};

export default function SigStatCard({
  titulo,
  valor,
  icone: Icon,
  className = "",
}: Props) {
  return (
    <div
      className={`painel-premium p-5 ${className}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-slate-400 text-sm">
            {titulo}
          </p>

          <h2 className="text-3xl font-black text-white">
            {valor}
          </h2>
        </div>

        {Icon && (
          <Icon className="w-7 h-7 text-yellow-400" />
        )}
      </div>
    </div>
  );
}