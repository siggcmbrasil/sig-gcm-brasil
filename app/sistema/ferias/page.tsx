"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function FeriasPage() {
  const [guardaId, setGuardaId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [observacao, setObservacao] = useState("");

  const usuario =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("usuarioLogado") || "{}")
      : {};

  async function salvar() {
    await supabase
      .from("ferias")
      .insert([
        {
          municipio_id: usuario.municipio_id,
          guarda_id: guardaId,
          data_inicio: inicio,
          data_fim: fim,
          observacao,
          criado_por: usuario.id,
        },
      ]);

    alert("Férias registradas.");
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-black mb-6">
        Controle de Férias
      </h1>

      <div className="painel-premium p-6">
        <input
          className="input"
          placeholder="ID do Guarda"
          value={guardaId}
          onChange={(e) => setGuardaId(e.target.value)}
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
          placeholder="Observações"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />

        <button
          onClick={salvar}
          className="sig-btn-gold mt-4"
        >
          Registrar Férias
        </button>
      </div>
    </div>
  );
}