"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AtestadosPage() {
  const [dias, setDias] = useState("");
  const [cid, setCid] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario = JSON.parse(
    localStorage.getItem("usuarioLogado") || "{}"
  );

  async function salvar() {
    await supabase.from("atestados").insert([
      {
        municipio_id: usuario.municipio_id,
        dias: Number(dias),
        cid,
        observacao,
        criado_por: usuario.id,
      },
    ]);

    alert("Atestado registrado.");
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black">
        Atestados
      </h1>

      <div className="painel-premium p-6 mt-6">
        <input
          className="input"
          placeholder="CID"
          value={cid}
          onChange={(e) => setCid(e.target.value)}
        />

        <input
          className="input mt-3"
          placeholder="Dias"
          value={dias}
          onChange={(e) => setDias(e.target.value)}
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