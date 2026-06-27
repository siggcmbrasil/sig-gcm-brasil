"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LicencasPage() {
  const [tipo, setTipo] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  async function salvar() {
    await supabase.from("licencas").insert([
      {
        municipio_id: usuario.municipio_id,
        tipo,
        data_inicio: inicio,
        data_fim: fim,
        observacao,
        criado_por: usuario.id,
      },
    ]);

    alert("Licença cadastrada.");
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black mb-6">
        Licenças
      </h1>

      <div className="painel-premium p-6">
        <input
          className="input"
          placeholder="Tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />

        <input
          type="date"
          className="input mt-3"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />

        <input
          type="date"
          className="input mt-3"
          value={fim}
          onChange={(e) => setFim(e.target.value)}
        />

        <textarea
          className="input mt-3"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <button
          onClick={salvar}
          className="sig-btn-gold mt-4"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}