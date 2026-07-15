"use client";
export default function MobileTimeline(){
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/85 p-5">
      <h2 className="font-black">Linha do Tempo</h2>
      <div className="mt-4 space-y-3 text-sm">
        <div>08:02 • Patrulhamento iniciado</div>
        <div>08:35 • Visita registrada</div>
        <div>09:10 • Ocorrência atendida</div>
      </div>
    </section>
  );
}
