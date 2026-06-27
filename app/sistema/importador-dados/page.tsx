"use client";

export default function ImportadorDadosPage() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-black">
        Importador de Dados
      </h1>

      <div className="painel-premium p-6 mt-6">
        <input
          type="file"
          className="input"
        />

        <button className="sig-btn-gold mt-4">
          Importar
        </button>
      </div>
    </div>
  );
}