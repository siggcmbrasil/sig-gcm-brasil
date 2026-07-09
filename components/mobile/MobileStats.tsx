"use client";

import Link from "next/link";

export default function MobileStats({
  totalOcorrencias,
  totalChamados,
  totalPatrulhamentos,
}: {
  totalOcorrencias: number;
  totalChamados: number;
  totalPatrulhamentos: number;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-base font-black">Resumo do dia</h2>

        <Link href="/sistema/relatorios" className="text-xs text-blue-400">
          Relatório
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Resumo titulo="Ocorr." valor={String(totalOcorrencias)} />
        <Resumo titulo="Cham." valor={String(totalChamados)} />
        <Resumo titulo="Patr." valor={String(totalPatrulhamentos)} />
      </div>
    </section>
  );
}

function Resumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-3 text-center">
      <h3 className="text-2xl font-black">{valor}</h3>

      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>

      <p className="text-[10px] text-blue-400">Hoje</p>
    </div>
  );
}