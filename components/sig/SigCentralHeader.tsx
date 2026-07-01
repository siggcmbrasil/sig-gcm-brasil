"use client";

import { LucideIcon } from "lucide-react";

interface Props {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
}

export default function SigCentralHeader({
  titulo,
  descricao,
  icone: Icon,
}: Props) {
  return (
    <div className="painel-premium p-6 md:p-8">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
          <Icon className="w-9 h-9 text-cyan-400" />
        </div>

        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white">
            {titulo}
          </h1>

          <p className="text-slate-400 mt-2">
            {descricao}
          </p>
        </div>
      </div>
    </div>
  );
}