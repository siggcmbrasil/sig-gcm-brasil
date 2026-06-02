"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const MapaOperacional = dynamic(() => import("./MapaOperacional"), {
  ssr: false,
  loading: () => (
    <div className="card h-[70vh] flex items-center justify-center">
      Carregando mapa...
    </div>
  ),
});

type OcorrenciaMapa = {
  id: number;
  protocolo: string;
  tipo: string;
  status: string;
  local: string;
  latitude: string | null;
  longitude: string | null;
};

export default function PaginaMapa() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaMapa[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarOcorrencias() {
    setCarregando(true);

    const { data, error } = await supabase
      .from("ocorrencias")
      .select("id, protocolo, tipo, status, local, latitude, longitude")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar ocorrências no mapa.");
      setCarregando(false);
      return;
    }

    setOcorrencias(data || []);
    setCarregando(false);
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  const comGps = ocorrencias.filter((o) => o.latitude && o.longitude);
  const abertas = ocorrencias.filter((o) => o.status === "Aberta");
  const andamento = ocorrencias.filter((o) => o.status === "Em andamento");

  return (
    <div className="p-3 md:p-6 pb-24">
      <header className="border-b border-slate-800 pb-5 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Mapa Operacional
        </h1>

        <p className="text-slate-400 text-sm md:text-base">
          Ocorrências com GPS registradas pela GCM Biritinga.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card titulo="Ocorrências" valor={ocorrencias.length} />
        <Card titulo="Com GPS" valor={comGps.length} />
        <Card titulo="Abertas" valor={abertas.length} />
        <Card titulo="Em andamento" valor={andamento.length} />
      </section>

      <section className="card p-2 md:p-4">
        {carregando ? (
          <div className="h-[70vh] flex items-center justify-center text-slate-400">
            Carregando ocorrências...
          </div>
        ) : comGps.length === 0 ? (
          <div className="h-[70vh] flex flex-col items-center justify-center text-center text-slate-400 p-6">
            <p className="text-xl font-bold mb-2">
              Nenhuma ocorrência com GPS ainda.
            </p>
            <p>
              Use a Ocorrência Expressa e toque em “Capturar GPS Atual”.
            </p>
          </div>
        ) : (
          <MapaOperacional ocorrencias={ocorrencias} />
        )}
      </section>
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="card min-h-32 flex flex-col justify-center">
      <p className="text-slate-400 text-lg md:text-base">{titulo}</p>
      <h2 className="text-5xl md:text-4xl font-bold">{valor}</h2>
    </div>
  );
}