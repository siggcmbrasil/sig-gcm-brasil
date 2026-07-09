"use client";

import Link from "next/link";
import {
  Car,
  ClipboardList,
  FileText,
  MapPin,
  Radio,
  UserRound,
} from "lucide-react";

export default function MobileQuickMenu({
  carregando,
  atualizadoEm,
}: {
  carregando: boolean;
  atualizadoEm: Date | null;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-black">Operação rápida</h2>

        <span className="text-[10px] text-slate-500">
          {carregando
            ? "Atualizando..."
            : atualizadoEm
            ? atualizadoEm.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Agora"}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Atalho
          href="/sistema/ocorrencias/offline"
          icone={FileText}
          texto="Offline"
          destaque="emerald"
        />

        <Atalho href="/sistema/chamados" icone={Radio} texto="Chamados" />

        <Atalho href="/sistema/mobile/gps" icone={MapPin} texto="GPS" />

        <Atalho href="/sistema/viaturas" icone={Car} texto="Viaturas" />

        <Atalho
          href="/sistema/mobile/guarnicao"
          icone={UserRound}
          texto="Equipe"
        />

        <Atalho
          href="/sistema/relatorios/plantao"
          icone={ClipboardList}
          texto="Plantão"
        />
      </div>
    </section>
  );
}

function Atalho({
  href,
  icone: Icone,
  texto,
  destaque,
}: {
  href: string;
  icone: any;
  texto: string;
  destaque?: "emerald";
}) {
  const classeIcone =
    destaque === "emerald"
      ? "bg-emerald-600/20 text-emerald-400"
      : "bg-blue-600/20 text-blue-400";

  return (
    <Link
      href={href}
      className="
        flex
        min-h-[74px]
        flex-col
        items-center
        justify-center
        gap-1.5
        rounded-2xl
        border
        border-slate-800
        bg-slate-900/95
        p-2
        text-center
        transition
        active:scale-95
      "
    >
      <div
        className={`
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-2xl
          ${classeIcone}
        `}
      >
        <Icone className="h-4 w-4" />
      </div>

      <span className="text-[10px] font-semibold leading-tight">
        {texto}
      </span>
    </Link>
  );
}