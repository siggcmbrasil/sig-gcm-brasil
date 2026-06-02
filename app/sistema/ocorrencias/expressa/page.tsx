"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OcorrenciaExpressa() {
  const router = useRouter();

  const [tipo, setTipo] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [capturandoGps, setCapturandoGps] = useState(false);

  function obterLocalizacao() {
    if (!navigator.geolocation) {
      alert("GPS não suportado neste dispositivo.");
      return;
    }

    setCapturandoGps(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
        setCapturandoGps(false);
        alert("GPS capturado com sucesso.");
      },
      () => {
        setCapturandoGps(false);
        alert("Não foi possível obter a localização.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function salvarExpressa() {
    if (!tipo || !local || !descricao) {
      alert("Preencha tipo, local e descrição.");
      return;
    }

    setSalvando(true);

    const agora = new Date();
    const protocolo = "OC-" + Date.now();
    const data = agora.toISOString().split("T")[0];
    const hora = agora.toTimeString().slice(0, 8);

    let fotoUrl = "";

    if (foto) {
      const nomeArquivo = `${protocolo}-${foto.name}`;

      const { error: uploadError } = await supabase.storage
        .from("fotos-ocorrencias")
        .upload(nomeArquivo, foto);

      if (uploadError) {
        console.error(uploadError);
        alert("Erro ao enviar foto.");
        setSalvando(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from("fotos-ocorrencias")
        .getPublicUrl(nomeArquivo);

      fotoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from("ocorrencias").insert([
      {
        protocolo,
        tipo,
        status: "Aberta",
        data,
        hora,
        bairro: "",
        local,
        numero: "",
        envolvidos: "",
        descricao,
        foto_url: fotoUrl,
        latitude,
        longitude,
      },
    ]);

    setSalvando(false);

    if (error) {
      console.error(error);
      alert("Erro ao salvar ocorrência.");
      return;
    }

    alert("Ocorrência expressa salva com sucesso!");
    router.push("/sistema/ocorrencias");
  }

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-3xl font-bold">Ocorrência Expressa</h1>

        <p className="text-slate-400">
          Registro rápido para uso em campo pelo celular.
        </p>
      </header>

      <div className="card space-y-5">
        <div>
          <label className="label">Tipo da ocorrência</label>

          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Selecione</option>
            <option value="Perturbação do sossego">Perturbação do sossego</option>
            <option value="Apoio ao cidadão">Apoio ao cidadão</option>
            <option value="Patrulhamento preventivo">Patrulhamento preventivo</option>
            <option value="Fiscalização">Fiscalização</option>
            <option value="Acidente">Acidente</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        <div>
          <label className="label">Local</label>

          <input
            className="input"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            placeholder="Ex: Praça Principal"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={obterLocalizacao}
            disabled={capturandoGps}
            className="btn-secondary w-full text-lg disabled:opacity-50"
          >
            {capturandoGps ? "Capturando GPS..." : "📍 Capturar GPS Atual"}
          </button>

          {latitude && longitude && (
            <div className="mt-3 rounded-xl border border-green-700 bg-green-950/40 p-3 text-sm text-green-300">
              <p>Latitude: {latitude}</p>
              <p>Longitude: {longitude}</p>
            </div>
          )}
        </div>

        <div>
          <label className="label">Descrição rápida</label>

          <textarea
            className="input h-40 resize-none"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descreva rapidamente o fato..."
          />
        </div>

        <div>
          <label className="label">Foto</label>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="input"
            onChange={(e) => setFoto(e.target.files?.[0] || null)}
          />

          <p className="text-sm text-slate-500 mt-2">
            No celular, este campo abre a câmera traseira.
          </p>
        </div>

        <button
          type="button"
          onClick={salvarExpressa}
          disabled={salvando}
          className="btn-primary w-full text-xl disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar Ocorrência Expressa"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/sistema")}
          className="btn-secondary w-full text-xl"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}