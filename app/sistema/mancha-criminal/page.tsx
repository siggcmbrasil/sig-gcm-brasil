"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Activity, AlertTriangle, MapPin, Search } from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

const MapaManchaCriminal = dynamic(
  () => import("@/components/MapaManchaCriminal"),
  { ssr: false }
);

type Ocorrencia = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  data: string | null;
  status: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
};

export default function ManchaCriminalPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const hoje = new Date().toISOString().split("T")[0];

const [busca, setBusca] = useState("");
const [dataInicio, setDataInicio] = useState(hoje);
const [dataFim, setDataFim] = useState(hoje);
const [carregando, setCarregando] = useState(true);

  useEffect(() => {
  carregar();
}, [dataInicio, dataFim]);

  async function carregar() {
  setCarregando(true);

  const usuario = JSON.parse(localStorage.getItem("usuarioLogado") || "{}");

  if (!usuario?.municipio_id) {
    alert("Município não identificado.");
    setCarregando(false);
    return;
  }

  let query = supabase
    .from("ocorrencias")
    .select("id, protocolo, tipo, local, data, status, latitude, longitude")
    .eq("municipio_id", usuario.municipio_id)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("id", { ascending: false })
    .limit(300);

  if (dataInicio) query = query.gte("data", dataInicio);
  if (dataFim) query = query.lte("data", dataFim);

  const { data, error } = await query;

  setCarregando(false);

  if (error) {
    console.error(error);
    alert("Erro ao carregar mancha criminal.");
    return;
  }

  setOcorrencias(data || []);
}

  const lista = ocorrencias.filter((o) => {
    const texto = `
      ${o.protocolo || ""}
      ${o.tipo || ""}
      ${o.local || ""}
      ${o.status || ""}
      ${o.data || ""}
    `.toLowerCase();

    return texto.includes(busca.toLowerCase());
  });

  const tiposUnicos = new Set(lista.map((o) => o.tipo).filter(Boolean)).size;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Mancha Criminal"
        subtitulo="Mapa estratégico das ocorrências registradas com localização."
        icone={Activity}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SigCard>
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-400 text-sm">Ocorrências no mapa</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {lista.length}
          </h2>
        </SigCard>

        <SigCard>
          <Activity className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Tipos diferentes</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {tiposUnicos}
          </h2>
        </SigCard>

        <SigCard>
          <MapPin className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Base de análise</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            GPS
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="relative">
          <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />

          <input
            className="input pl-12"
            placeholder="Filtrar por tipo, protocolo, local, status ou data..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </SigCard>

      <SigCard>
  <div className="grid md:grid-cols-3 gap-3">
    <input
      type="date"
      className="input"
      value={dataInicio}
      onChange={(e) => setDataInicio(e.target.value)}
    />

    <input
      type="date"
      className="input"
      value={dataFim}
      onChange={(e) => setDataFim(e.target.value)}
    />

    <button
      type="button"
      onClick={() => {
        setDataInicio("");
        setDataFim("");
      }}
      className="rounded-2xl bg-slate-700 hover:bg-slate-600 px-4 py-3 font-bold text-white"
    >
      Ver todos
    </button>
  </div>
</SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Mapa da Mancha Criminal
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando mapa...</p>
        ) : lista.length === 0 ? (
          <p className="text-slate-400">
            Nenhuma ocorrência com GPS encontrada.
          </p>
        ) : (
          <div className="h-[520px] rounded-2xl overflow-hidden border border-slate-800">
            <MapaManchaCriminal ocorrencias={lista} />
          </div>
        )}
      </SigCard>
    </div>
  );
}