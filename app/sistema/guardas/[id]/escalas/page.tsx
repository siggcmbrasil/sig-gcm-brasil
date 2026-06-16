"use client";

import { useParams } from "next/navigation";

export default function EscalasGuardaPage() {
  const { id } = useParams();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">📅 Escalas do Guarda</h1>
      <p className="text-slate-400 mb-6">Guarda ID: {id}</p>

      <div className="painel-premium p-6">
        Em breve: escalas cumpridas, plantões e banco de horas.
      </div>
    </div>
  );
}