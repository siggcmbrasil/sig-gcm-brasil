"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabase";

const MapaOperacional = dynamic(
  () => import("@/components/MapaOperacional"),
  { ssr: false }
);

export default function MapaOperacionalPage() {
  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
const [viaturas, setViaturas] = useState<any[]>([]);
const [localizacoes, setLocalizacoes] = useState<any[]>([]);
const [carregando, setCarregando] = useState(true);

  async function carregarDados() {
    setCarregando(true);

    const usuarioLogado = JSON.parse(
  localStorage.getItem("usuarioLogado") || "{}"
);

const municipioId = usuarioLogado.municipio_id;

   const { data, error } = await supabase
  .from("ocorrencias")
  .select(`
    *,
    locais:local_id (
      id,
      nome,
      latitude,
      longitude
    )
  `)
  .eq("municipio_id", municipioId)
  .order("id", { ascending: false });

const { data: viaturasData } = await supabase
  .from("viaturas")
  .select("*")
  .eq("municipio_id", municipioId);

const { data: gpsData } = await supabase
  .from("localizacoes_tempo_real")
  .select("*")
  .eq("municipio_id", municipioId)
  .order("atualizado_em", { ascending: false });

setOcorrencias(data || []);
setViaturas(viaturasData || []);
setLocalizacoes(gpsData || []);
setCarregando(false);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const hoje = new Date().toISOString().split("T")[0];

  const ocorrenciasHoje = ocorrencias.filter(
    (o) => o.data === hoje
  ).length;

  const abertas = ocorrencias.filter(
    (o) => o.status === "Aberta"
  ).length;

  const finalizadas = ocorrencias.filter(
    (o) => o.status === "Finalizada"
  ).length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <header>
        <h1 className="text-3xl font-bold">
          🗺️ Centro Operacional
        </h1>
        <p className="text-slate-400">
          Mapa operacional expandido com estatísticas em tempo real.
        </p>
      </header>

      {carregando ? (
        <div className="card">Carregando mapa...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-[calc(100vh-160px)]">
  <section className="xl:col-span-9 painel-premium p-3 h-[70vh] min-h-[420px]">
            <MapaOperacional
  ocorrencias={ocorrencias}
  viaturas={viaturas}
  localizacoes={localizacoes}
/>
          </section>

          <aside className="xl:col-span-3 space-y-4 overflow-y-auto">
            <div className="painel-premium p-4">
              <h2 className="font-bold mb-4">📊 Estatísticas</h2>

              <div className="space-y-3">
                <CardInfo titulo="Ocorrências Hoje" valor={ocorrenciasHoje} />
                <CardInfo titulo="Ocorrências Abertas" valor={abertas} />
                <CardInfo titulo="Finalizadas" valor={finalizadas} />
                <CardInfo titulo="Total no Mapa" valor={ocorrencias.length} />
              </div>
            </div>

            <div className="painel-premium p-4">
              <h2 className="font-bold mb-4">🚨 Últimas Ocorrências</h2>

              <div className="space-y-3">
                {ocorrencias.slice(0, 6).map((o) => (
                  <div
                    key={o.id}
                    className="border border-slate-700 rounded-xl p-3"
                  >
                    <p className="font-bold text-red-400">
                      {o.tipo}
                    </p>
                    <p className="text-sm text-slate-400">
                      {o.local}
                    </p>
                    <p className="text-xs text-slate-500">
                      {o.hora || "--:--"} • {o.status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function CardInfo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: number;
}) {
  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
      <p className="text-slate-400 text-sm">{titulo}</p>
      <h3 className="text-3xl font-black">{valor}</h3>
    </div>
  );
}