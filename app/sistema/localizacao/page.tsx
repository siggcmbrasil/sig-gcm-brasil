"use client";

import { supabase } from "@/lib/supabase";

export default function LocalizacaoPage() {
  async function enviarLocalizacao() {
    navigator.geolocation.getCurrentPosition(async (pos) => {
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
        });

      if (!error) {
        alert("Localização enviada!");
      }
    });
  }

  return (
    <div className="p-6">
      <button
        onClick={enviarLocalizacao}
        className="bg-blue-600 px-6 py-4 rounded-xl text-white font-bold"
      >
        📍 Enviar Minha Localização
      </button>
    </div>
  );
}