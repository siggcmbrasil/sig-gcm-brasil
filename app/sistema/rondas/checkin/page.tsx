"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CheckinRondaPage() {
  const params = useSearchParams();
  const pontoId = params.get("ponto");

  const [status, setStatus] = useState("");
  const [observacao, setObservacao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);

  async function fazerUploadFoto() {
    if (!foto) return null;

    const nomeArquivo = `rondas/${pontoId}/${Date.now()}-${foto.name}`;

    const { error: uploadError } = await supabase.storage
      .from("documentos-guardas")
      .upload(nomeArquivo, foto);

    if (uploadError) {
      console.error(uploadError);
      throw new Error("Erro ao enviar foto.");
    }

    const { data } = supabase.storage
      .from("documentos-guardas")
      .getPublicUrl(nomeArquivo);

    return data.publicUrl;
  }

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
        try {
          setStatus("Enviando foto...");

          const fotoUrl = await fazerUploadFoto();

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
            observacao: observacao || "Check-in via QR Code",
            foto_url: fotoUrl,
          });

          if (error) {
            console.error(error);
            setStatus(error.message);
            alert(error.message);
            return;
          }

          setStatus("✅ Check-in registrado com sucesso!");
          alert("Check-in registrado com sucesso!");

          setObservacao("");
          setFoto(null);
        } catch (e: any) {
          setStatus(e.message || "Erro ao registrar check-in.");
          alert(e.message || "Erro ao registrar check-in.");
        }
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

      <p className="text-slate-400 mb-4">
        Ponto ID: {pontoId || "inválido"}
      </p>

      <div className="painel-premium p-5 space-y-4 mb-5">
        <div>
          <label className="label">Observação</label>
          <textarea
            className="input h-28"
            placeholder="Ex: local verificado, sem alterações."
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </div>

        <div>
          <label className="label">Foto do local</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="input"
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />
        </div>
      </div>

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