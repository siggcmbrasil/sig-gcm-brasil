"use client";

import type { LucideIcon } from "lucide-react";

type SigPageHeaderProps = {
  titulo: string;
  subtitulo?: string;
  icone?: LucideIcon;
};

export default function SigPageHeader({
  titulo,
  subtitulo,
  icone: Icon,
}: SigPageHeaderProps) {
  return (
    <div className="painel-premium p-6">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-8 h-8 text-yellow-400" />}

        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">
            {titulo}
          </h1>

          {subtitulo && (
            <p className="text-slate-400 mt-1">
              {subtitulo}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}