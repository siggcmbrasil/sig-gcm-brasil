"use client";
export default function MobileMissionCard(){
  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.06] p-5">
      <p className="text-xs font-black uppercase tracking-widest text-cyan-300">
        Missão do Plantão
      </p>
      <div className="mt-4 space-y-2 text-sm">
        <div>✔ Patrulhamento iniciado</div>
        <div>• Chamados pendentes</div>
        <div>• Visitas programadas</div>
        <div>• Comunicados novos</div>
      </div>
    </section>
  );
}
