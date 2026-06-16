"use client";

import { useParams } from "next/navigation";

export default function EstatisticasGuardaPage() {
  const { id } = useParams();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">📊 Estatísticas do Guarda</h1>
      <p className="text-slate-400 mb-6">Guarda ID: {id}</p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card titulo="Ocorrências" valor="0" />
        <Card titulo="Patrulhamentos" valor="0" />
        <Card titulo="Cursos" valor="0" />
        <Card titulo="Elogios" valor="0" />
      </div>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="painel-premium p-6">
      <p className="text-slate-400">{titulo}</p>
      <h2 className="text-4xl font-black">{valor}</h2>
    </div>
  );
}