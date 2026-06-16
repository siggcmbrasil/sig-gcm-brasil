"use client";

import { useParams } from "next/navigation";

export default function DocumentosGuardaPage() {
  const params = useParams();

  return (
    <div className="p-6 text-white">
      <h1 className="text-3xl font-black mb-2">
        📄 Documentos do Guarda
      </h1>

      <p className="text-slate-400 mb-6">
        Guarda ID: {params.id}
      </p>

      <div className="painel-premium p-6">
        <h2 className="font-bold mb-4">
          Novo Documento
        </h2>

        <div className="grid gap-4">
          <input
            className="input"
            placeholder="Título do documento"
          />

          <select className="input">
            <option>RG</option>
            <option>CPF</option>
            <option>CNH</option>
            <option>Portaria</option>
            <option>Certificado</option>
            <option>Outro</option>
          </select>

          <input
            type="date"
            className="input"
          />

          <textarea
            className="input"
            placeholder="Observação"
          />

          <input
            type="file"
            className="input"
          />

          <button className="btn-primary">
            Salvar Documento
          </button>
        </div>
      </div>
    </div>
  );
}