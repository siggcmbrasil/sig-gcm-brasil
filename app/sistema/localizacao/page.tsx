"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LocalizacaoPage() {
  const [rastreamentoId, setRastreamentoId] = useState<number | null>(null);
  const [ativo, setAtivo] = useState(false);

  async function salvarLocalizacao(latitude: number, longitude: number) {
    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    await supabase.from("localizacoes_tempo_real").insert({
      usuario_id: usuario.id,
      nome: usuario.nome,
      latitude,
      longitude,
      municipio_id: usuario.municipio_id,
    });
  }

  function enviarUmaVez() {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await salvarLocalizacao(
          pos.coords.latitude,
          pos.coords.longitude
        );

        alert("Localização enviada com sucesso!");
      },
      () => alert("Não foi possível obter sua localização."),
      { enableHighAccuracy: true }
    );
  }

  function iniciarRastreamento() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        await salvarLocalizacao(
          pos.coords.latitude,
          pos.coords.longitude
        );
      },
      () => alert("Erro ao rastrear localização."),
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    setRastreamentoId(id);
    setAtivo(true);
    alert("Rastreamento iniciado.");
  }

  function pararRastreamento() {
    if (rastreamentoId !== null) {
      navigator.geolocation.clearWatch(rastreamentoId);
    }

    setRastreamentoId(null);
    setAtivo(false);
    alert("Rastreamento parado.");
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-6">
      <h1 className="text-3xl font-black mb-2">
        📍 GPS Operacional
      </h1>

      <p className="text-slate-400 mb-6">
        Envie sua localização ou ative o rastreamento em tempo real.
      </p>

      <div className="space-y-4">
        <button
          onClick={enviarUmaVez}
          className="w-full bg-blue-600 px-6 py-5 rounded-2xl font-black text-lg"
        >
          📍 Enviar localização agora
        </button>

        {!ativo ? (
          <button
            onClick={iniciarRastreamento}
            className="w-full bg-green-700 px-6 py-5 rounded-2xl font-black text-lg"
          >
            🟢 Iniciar rastreamento
          </button>
        ) : (
          <button
            onClick={pararRastreamento}
            className="w-full bg-red-700 px-6 py-5 rounded-2xl font-black text-lg"
          >
            🔴 Parar rastreamento
          </button>
        )}

        {ativo && (
          <div className="painel-premium p-4 text-center text-green-400 font-bold">
            🟢 Rastreamento ativo
          </div>
        )}
      </div>
    </div>
  );
}