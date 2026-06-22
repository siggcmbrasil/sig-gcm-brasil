"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function PatrulhamentoGpsPage() {
  const [tipo, setTipo] = useState("VIATURA");
  const [observacao, setObservacao] = useState("");

  async function enviarLocalizacao() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const usuario = JSON.parse(
          localStorage.getItem("usuarioLogado") || "{}"
        );

        const { error } = await supabase
          .from("localizacoes_tempo_real")
          .insert({
            usuario_id: usuario.id,
            nome: usuario.nome,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            municipio_id: usuario.municipio_id,
            status: tipo,
            observacao,
          });

        if (error) {
          alert("Erro ao enviar localização.");
          return;
        }

        alert("Localização enviada com sucesso!");
        setObservacao("");
      },
      () => {
        alert("Não foi possível obter sua localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function limparMeusPontos() {
    const confirmar = confirm("Deseja excluir seus pontos de GPS de teste?");
    if (!confirmar) return;

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    const { error } = await supabase
  .from("localizacoes_tempo_real")
  .delete()
  .eq("usuario_id", usuario.id);

    if (error) {
      alert("Erro ao excluir pontos.");
      return;
    }

    alert("Pontos excluídos.");
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-6">
      <h1 className="text-3xl font-black mb-2">
        🚔 Patrulhamento GPS
      </h1>

      <p className="text-slate-400 mb-6">
        Registre sua localização durante patrulhamento do seu município.
      </p>

      <div className="painel-premium p-5 space-y-5">
        <div>
          <label className="label">Tipo de patrulhamento</label>

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="VIATURA">🚓 Viatura</option>
            <option value="A_PE">🚶 A pé</option>
            <option value="MOTO">🏍️ Motocicleta</option>
          </select>
        </div>

        <div>
          <label className="label">Observação</label>

          <textarea
            className="input h-28 resize-none"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex: ronda preventiva na Praça da Matriz."
          />
        </div>

        <button
          onClick={enviarLocalizacao}
          className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-5 rounded-2xl font-black text-lg"
        >
          📍 Enviar localização atual
        </button>

        <button
          onClick={limparMeusPontos}
          className="w-full bg-red-700 hover:bg-red-800 px-6 py-4 rounded-2xl font-black text-lg"
        >
          🗑️ Limpar meus pontos de teste
        </button>
      </div>
    </div>
  );
}