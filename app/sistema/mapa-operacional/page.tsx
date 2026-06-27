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
  const [blitzes, setBlitzes] = useState<any[]>([]);
  const [barreiras, setBarreiras] = useState<any[]>([]);
  const [operacoesEspeciais, setOperacoesEspeciais] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const usuarioLogado = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      const municipioId = usuarioLogado?.municipio_id;

      if (!municipioId) {
        setErro("Município do usuário não identificado.");
        setCarregando(false);
        return;
      }

      const { data: ocorrenciasData, error: ocorrenciasError } =
        await supabase
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

      if (ocorrenciasError) throw ocorrenciasError;

      const { data: viaturasData, error: viaturasError } = await supabase
        .from("viaturas")
        .select("*")
        .eq("municipio_id", municipioId)
        .order("id", { ascending: false });

      if (viaturasError) throw viaturasError;

      const { data: gpsData, error: gpsError } = await supabase
        .from("localizacoes_tempo_real")
        .select("*")
        .eq("municipio_id", municipioId)
        .order("atualizado_em", { ascending: false });

      if (gpsError) throw gpsError;

      const { data: blitzesData, error: blitzesError } = await supabase
        .from("blitzes")
        .select("*")
        .eq("municipio_id", municipioId)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false });

      if (blitzesError) throw blitzesError;

      const { data: barreirasData, error: barreirasError } = await supabase
        .from("barreiras")
        .select("*")
        .eq("municipio_id", municipioId)
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false });

      if (barreirasError) throw barreirasError;

      const { data: operacoesData, error: operacoesError } = await supabase
  .from("operacoes_especiais")
  .select("*")
  .eq("municipio_id", municipioId)
  .not("latitude", "is", null)
  .not("longitude", "is", null)
  .order("created_at", { ascending: false });

if (operacoesError) throw operacoesError;

      setOcorrencias(ocorrenciasData || []);
      setViaturas(viaturasData || []);
      setLocalizacoes(gpsData || []);
      const blitzesFiltradas = dataFiltro
  ? (blitzesData || []).filter(
      (b) => b.data?.split("T")[0] === dataFiltro
    )
  : blitzesData || [];

const barreirasFiltradas = dataFiltro
  ? (barreirasData || []).filter(
      (b) => b.data?.split("T")[0] === dataFiltro
    )
  : barreirasData || [];

  const operacoesFiltradas = dataFiltro
  ? (operacoesData || []).filter(
      (o) => o.data?.split("T")[0] === dataFiltro
    )
  : operacoesData || [];

setBlitzes(blitzesFiltradas);
setBarreiras(barreirasFiltradas);
setOperacoesEspeciais(operacoesFiltradas);
    } catch (error) {
      console.error("Erro ao carregar mapa operacional:", error);
      setErro("Erro ao carregar dados do mapa operacional.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();

    const intervalo = setInterval(() => {
      carregarDados();
    }, 30000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
  carregarDados();
}, [dataFiltro]);

  const hoje = new Date().toISOString().split("T")[0];

  const ocorrenciasHoje = ocorrencias.filter((o) => {
    const dataOcorrencia = o.data?.split("T")[0];
    return dataOcorrencia === hoje;
  }).length;

  const abertas = ocorrencias.filter(
    (o) => o.status === "Aberta" || o.status === "ABERTA"
  ).length;

  const finalizadas = ocorrencias.filter(
    (o) => o.status === "Finalizada" || o.status === "FINALIZADA"
  ).length;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-wrap gap-3">
  <input
    type="date"
    className="input-premium max-w-[220px]"
    value={dataFiltro}
    onChange={(e) => setDataFiltro(e.target.value)}
  />

  <button
    onClick={carregarDados}
    className="
      bg-blue-700
      hover:bg-blue-600
      text-white
      px-4
      py-2
      rounded-xl
      font-bold
    "
  >
    Atualizar
  </button>
</div>

      {erro && (
        <div className="bg-red-950/60 border border-red-800 text-red-300 rounded-xl p-4">
          {erro}
        </div>
      )}

      {carregando ? (
        <div className="painel-premium p-6 text-slate-300">
          Carregando mapa operacional...
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-[calc(100vh-160px)]">
          <section className="xl:col-span-9 painel-premium p-3 h-[70vh] min-h-[420px]">
            <MapaOperacional
              ocorrencias={ocorrencias}
              viaturas={viaturas}
              localizacoes={localizacoes}
              blitzes={blitzes}
              barreiras={barreiras}
              operacoesEspeciais={operacoesEspeciais}
            />
          </section>

          <aside className="xl:col-span-3 space-y-4 overflow-y-auto">
            <div className="painel-premium p-4">
              <h2 className="font-bold mb-4 text-white">📊 Estatísticas</h2>

              <div className="space-y-3">
                <CardInfo titulo="Ocorrências Hoje" valor={ocorrenciasHoje} />
                <CardInfo titulo="Ocorrências Abertas" valor={abertas} />
                <CardInfo titulo="Finalizadas" valor={finalizadas} />
                <CardInfo titulo="Viaturas" valor={viaturas.length} />
                <CardInfo titulo="GPS Ativos" valor={localizacoes.length} />
                <CardInfo titulo="Blitzes no Mapa" valor={blitzes.length} />
                <CardInfo titulo="Barreiras no Mapa" valor={barreiras.length} />
                <CardInfo titulo="Operações no Mapa" valor={operacoesEspeciais.length} />
              </div>
            </div>

            <div className="painel-premium p-4">
              <h2 className="font-bold mb-4 text-white">
                🚧 Blitzes e Barreiras
              </h2>

              <div className="space-y-3">
                {[...blitzes, ...barreiras].length === 0 ? (
                  <p className="text-slate-400 text-sm">
                    Nenhuma blitz ou barreira com GPS.
                  </p>
                ) : (
                  [...blitzes, ...barreiras].slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="border border-slate-700 rounded-xl p-3 bg-slate-950/50"
                    >
                      <p className="font-bold text-yellow-400">
                        {item.nome || "Operação"}
                      </p>

                      <p className="text-sm text-slate-400">
                        {item.local || "Local não informado"}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.status || "Sem status"}
                      </p>
                    </div>
                  ))
                )}
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
      <h3 className="text-3xl font-black text-white">{valor}</h3>
    </div>
  );
}