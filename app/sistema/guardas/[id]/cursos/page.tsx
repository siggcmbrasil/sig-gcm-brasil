"use client";

import { useParams } from "next/navigation";

export default function CursosPage() {
  const { id } = useParams();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">🎓 Cursos</h1>
      <p className="text-slate-400 mb-6">Guarda ID: {id}</p>

      <div className="painel-premium p-6 space-y-4">
        <input className="input" placeholder="Nome do curso" />
        <input className="input" placeholder="Instituição" />
        <input className="input" placeholder="Carga horária" />
        <input type="date" className="input" />
        <input type="file" className="input" />

        <button className="btn-primary w-full">
          Salvar Curso
        </button>
      </div>
    </div>
  );
}