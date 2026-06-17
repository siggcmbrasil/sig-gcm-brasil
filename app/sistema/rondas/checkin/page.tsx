"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CheckinRondaPage() {
  const params = useSearchParams();
  const pontoId = params.get("ponto");

  const [status, setStatus] = useState("");

  async function fazerCheckin() {
    setStatus("Iniciando check-in...");

    if (!pontoId) {
      alert("Ponto inválido.");
      return;
    }

    const { data: ponto, error: erroPonto } = await supabase
      .from("pontos_ronda")
      .select("*")
      .eq("id", Number(pontoId))
      .single();

    if (erroPonto || !ponto) {
      setStatus("Erro: ponto não encontrado.");
      alert("Ponto não encontrado.");
      return;
    }

    setStatus("Obtendo GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setStatus("Salvando no Supabase...");

        const usuario = JSON.parse(
          localStorage.getItem("usuarioLogado") || "{}"
        );

        const { error } = await supabase.from("checkins_ronda").insert({
          ponto_id: Number(pontoId),
          plano_id: Number(ponto.plano_id),
          nome: usuario?.nome || "Usuário não identificado",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          observacao: "Check-in via QR Code",
        });

        if (error) {
          console.error(error);
          setStatus(error.message);
          alert(error.message);
          return;
        }

        setStatus("✅ Check-in registrado com sucesso!");
        alert("Check-in registrado com sucesso!");
      },
      (erro) => {
        console.error(erro);
        setStatus("Erro ao obter GPS.");
        alert("Permita o acesso à localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
      }
    );
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-6 flex flex-col justify-center">
      <h1 className="text-3xl font-black mb-2">
        📍 Check-in de Ronda
      </h1>

      <p className="text-slate-400 mb-2">
        Ponto ID: {pontoId || "inválido"}
      </p>

      <p className="text-yellow-400 mb-6">
        {status}
      </p>

      <button
        type="button"
        onClick={fazerCheckin}
        className="bg-green-700 hover:bg-green-800 px-6 py-5 rounded-2xl font-black text-lg"
      >
        ✅ Fazer Check-in
      </button>
    </div>
  );
}