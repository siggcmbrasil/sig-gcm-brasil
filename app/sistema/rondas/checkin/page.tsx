"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Loader2,
  MapPinCheck,
} from "lucide-react";

const RAIO_PERMITIDO_METROS = 200;

export default function CheckinRondaPage() {
  const params = useSearchParams();
  const pontoId = params.get("ponto");

  const [status, setStatus] = useState("");
  const [observacao, setObservacao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  function calcularDistanciaMetros(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  async function fazerUploadFoto() {
    if (!foto) return null;

    const nomeSeguro = foto.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const nomeArquivo = `rondas/${pontoId}/${Date.now()}-${nomeSeguro}`;

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
    if (enviando) return;

    if (!pontoId) {
      alert("Ponto inválido.");
      return;
    }

    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    const usuario = pegarUsuario();

    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário ou município não identificado.");
      return;
    }

    setEnviando(true);
    setStatus("Iniciando check-in...");

    const { data: ponto, error: erroPonto } = await supabase
      .from("pontos_ronda")
      .select("*")
      .eq("id", Number(pontoId))
      .eq("municipio_id", usuario.municipio_id)
      .single();

    if (erroPonto || !ponto) {
      console.error(erroPonto);
      setStatus("Erro: ponto não encontrado.");
      alert("Ponto não encontrado.");
      setEnviando(false);
      return;
    }

    const pontoLatitude = Number(ponto.latitude);
    const pontoLongitude = Number(ponto.longitude);

    if (!pontoLatitude || !pontoLongitude) {
      setStatus("Este ponto não possui latitude e longitude cadastradas.");
      alert("Este ponto não possui latitude e longitude cadastradas.");
      setEnviando(false);
      return;
    }

    setStatus("Obtendo localização GPS...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const latitudeAtual = pos.coords.latitude;
          const longitudeAtual = pos.coords.longitude;

          const distancia = calcularDistanciaMetros(
            latitudeAtual,
            longitudeAtual,
            pontoLatitude,
            pontoLongitude
          );

          const distanciaArredondada = Math.round(distancia);

          if (distancia > RAIO_PERMITIDO_METROS) {
            setStatus(
              `Fora da área permitida. Distância atual: ${distanciaArredondada} metros.`
            );

            alert(
              `Check-in bloqueado. Você está a ${distanciaArredondada} metros do ponto. Aproxime-se até ${RAIO_PERMITIDO_METROS} metros.`
            );

            return;
          }

          setStatus(foto ? "Enviando foto..." : "Registrando check-in...");

          const fotoUrl = await fazerUploadFoto();

          setStatus("Salvando check-in...");

          const { error } = await supabase.from("checkins_ronda").insert({
            municipio_id: usuario.municipio_id,
            ponto_id: Number(pontoId),
            plano_id: Number(ponto.plano_id),
            usuario_id: usuario.id,
            nome: usuario?.nome || "Usuário não identificado",
            latitude: latitudeAtual,
            longitude: longitudeAtual,
            distancia_metros: distanciaArredondada,
            observacao: observacao || "Check-in via QR Code",
            foto_url: fotoUrl,
          });

          if (error) {
            console.error(error);
            setStatus(error.message);
            alert(error.message);
            return;
          }

          setStatus("Check-in registrado com sucesso!");
          alert("Check-in registrado com sucesso!");

          setObservacao("");
          setFoto(null);
        } catch (e: any) {
          console.error(e);
          setStatus(e.message || "Erro ao registrar check-in.");
          alert(e.message || "Erro ao registrar check-in.");
        } finally {
          setEnviando(false);
        }
      },
      (erro) => {
        console.error(erro);
        setStatus("Erro ao obter GPS.");
        alert("Permita o acesso à localização.");
        setEnviando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-white p-6 flex flex-col justify-center">
      <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
        <MapPinCheck className="text-green-400" size={34} />
        Check-in de Ronda
      </h1>

      <p className="text-slate-400 mb-4">
        Raio permitido: {RAIO_PERMITIDO_METROS} metros do ponto cadastrado.
      </p>

      <div className="bg-blue-950/40 border border-blue-800 rounded-2xl p-4 mb-5 flex gap-3">
        <AlertTriangle className="text-yellow-400 shrink-0 mt-1" size={22} />
        <p className="text-slate-300 text-sm">
          O check-in só será aceito se o GPS do dispositivo estiver dentro da
          área permitida do ponto da ronda.
        </p>
      </div>

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
          <label className="label flex items-center gap-2">
            <Camera size={18} />
            Foto do local
          </label>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="input"
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />
        </div>
      </div>

      {status && <p className="text-yellow-400 mb-6">{status}</p>}

      <button
        type="button"
        onClick={fazerCheckin}
        disabled={enviando}
        className="bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2"
      >
        {enviando ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <CheckCircle size={22} />
            Fazer Check-in
          </>
        )}
      </button>
    </div>
  );
}