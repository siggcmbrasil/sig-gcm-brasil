"use client";

import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CheckinRondaPage() {
  const params = useSearchParams();
  const pontoId = params.get("ponto");

  async function fazerCheckin() {
    if (!pontoId) {
      alert("Ponto inválido.");
      return;
    }

    const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

    const { data: ponto } = await supabase
      .from("pontos_ronda")
      .select("*")
      .eq("id", Number(pontoId))
      .single();

    if (!ponto) {
      alert("Ponto não encontrado.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase.from("checkins_ronda").insert({
          ponto_id: Number(pontoId),
          plano_id: ponto.plano_id,
          usuario_id: usuario.id,
          nome: usuario.nome,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });

        if (error) {
          alert("Erro ao registrar check-in.");
          return;
        }

        alert("Check-in registrado com sucesso!");
      },
      () => {
        alert("Não foi possível obter a localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-6 flex flex-col justify-center">
      <h1 className="text-3xl font-black mb-2">
        📍 Check-in de Ronda
      </h1>

      <p className="text-slate-400 mb-6">
        Confirme sua presença neste ponto da ronda.
      </p>

      <button
        onClick={fazerCheckin}
        className="bg-green-700 hover:bg-green-800 px-6 py-5 rounded-2xl font-black text-lg"
      >
        ✅ Fazer Check-in
      </button>
    </div>
  );
}   