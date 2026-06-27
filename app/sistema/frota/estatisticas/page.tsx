"use client";

export default function FrotaEstatisticasPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="painel-premium p-6">
        <h1 className="text-3xl font-black">Estatísticas da Frota</h1>
        <p className="text-slate-400 mt-2">
          Indicadores de consumo, manutenção, danos e disponibilidade das viaturas.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card titulo="Consumo" icone="⛽" />
        <Card titulo="Manutenção" icone="🔧" />
        <Card titulo="Danos" icone="⚠️" />
        <Card titulo="Disponibilidade" icone="🚓" />
      </div>
    </div>
  );
}

function Card({ titulo, icone }: { titulo: string; icone: string }) {
  return (
    <div className="painel-premium p-5">
      <p className="text-4xl">{icone}</p>
      <h2 className="text-xl font-black mt-4">{titulo}</h2>
      <p className="text-slate-400 text-sm mt-2">Em construção.</p>
    </div>
  );
}