"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle,
  Crosshair,
  Map,
  RefreshCw,
  Shield,
  Siren,
  Truck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

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

  const hoje = new Date().toISOString().split("T")[0];
  const [dataFiltro, setDataFiltro] = useState(hoje);

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

      const [
        ocorrenciasRes,
        viaturasRes,
        gpsRes,
        blitzesRes,
        barreirasRes,
        operacoesRes,
      ] = await Promise.all([
        supabase
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
          .order("id", { ascending: false }),

        supabase
          .from("viaturas")
          .select("*")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false }),

        supabase
          .from("localizacoes_tempo_real")
          .select("*")
          .eq("municipio_id", municipioId)
          .order("atualizado_em", { ascending: false }),

        supabase
          .from("blitzes")
          .select("*")
          .eq("municipio_id", municipioId)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false }),

        supabase
          .from("barreiras")
          .select("*")
          .eq("municipio_id", municipioId)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false }),

        supabase
          .from("operacoes_especiais")
          .select("*")
          .eq("municipio_id", municipioId)
          .not("latitude", "is", null)
          .not("longitude", "is", null)
          .order("created_at", { ascending: false }),
      ]);

      if (ocorrenciasRes.error) throw ocorrenciasRes.error;
      if (viaturasRes.error) throw viaturasRes.error;
      if (gpsRes.error) throw gpsRes.error;
      if (blitzesRes.error) throw blitzesRes.error;
      if (barreirasRes.error) throw barreirasRes.error;
      if (operacoesRes.error) throw operacoesRes.error;

      const ocorrenciasData = ocorrenciasRes.data || [];
      const viaturasData = viaturasRes.data || [];
      const gpsData = gpsRes.data || [];
      const blitzesData = blitzesRes.data || [];
      const barreirasData = barreirasRes.data || [];
      const operacoesData = operacoesRes.data || [];

      const filtrarPorData = (lista: any[], campos: string[]) => {
        if (!dataFiltro) return lista;

        return lista.filter((item) =>
          campos.some((campo) => {
            const valor = item?.[campo];
            return valor?.split("T")[0] === dataFiltro;
          })
        );
      };

      setOcorrencias(filtrarPorData(ocorrenciasData, ["data", "criado_em", "created_at"]));
      setViaturas(filtrarPorData(viaturasData, ["updated_at", "atualizado_em", "criado_em", "created_at"]));
      setLocalizacoes(filtrarPorData(gpsData, ["atualizado_em", "created_at"]));
      setBlitzes(filtrarPorData(blitzesData, ["data", "created_at", "criado_em"]));
      setBarreiras(filtrarPorData(barreirasData, ["data", "created_at", "criado_em"]));
      setOperacoesEspeciais(filtrarPorData(operacoesData, ["data", "created_at", "criado_em"]));
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
  }, [dataFiltro]);

  const ocorrenciasHoje = ocorrencias.filter(
    (o) => o.data?.split("T")[0] === hoje
  ).length;

  const abertas = ocorrencias.filter(
    (o) => o.status === "Aberta" || o.status === "ABERTA"
  ).length;

  const finalizadas = ocorrencias.filter(
    (o) => o.status === "Finalizada" || o.status === "FINALIZADA"
  ).length;

  const totalPontos =
    ocorrencias.length +
    viaturas.length +
    localizacoes.length +
    blitzes.length +
    barreiras.length +
    operacoesEspeciais.length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Mapa Operacional"
        subtitulo="Visualização em tempo real de ocorrências, GPS, viaturas, blitzes, barreiras e operações especiais."
        icone={Map}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <CardInfo titulo="Pontos" valor={totalPontos} icone={Crosshair} />
        <CardInfo titulo="Ocorrências" valor={ocorrencias.length} icone={AlertTriangle} />
        <CardInfo titulo="Hoje" valor={ocorrenciasHoje} icone={CalendarDays} />
        <CardInfo titulo="Abertas" valor={abertas} icone={Siren} />
        <CardInfo titulo="Finalizadas" valor={finalizadas} icone={CheckCircle} />
        <CardInfo titulo="Viaturas" valor={viaturas.length} icone={Truck} />
        <CardInfo titulo="GPS" valor={localizacoes.length} icone={Shield} />
        <CardInfo titulo="Operações" valor={operacoesEspeciais.length + blitzes.length + barreiras.length} icone={Map} />
      </div>

      <SigCard>
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-white">
              Filtros do mapa
            </h2>
            <p className="text-sm text-slate-400">
              Por padrão o mapa abre com os dados de hoje. Use “Todos” apenas quando precisar consultar histórico.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              className="input-premium max-w-[220px]"
              value={dataFiltro}
              onChange={(e) => setDataFiltro(e.target.value)}
            />

            <SigButton
              type="green"
              onClick={() => setDataFiltro(hoje)}
            >
              Hoje
            </SigButton>

            <SigButton
              type="gray"
              onClick={() => setDataFiltro("")}
            >
              Todos
            </SigButton>

            <SigButton
              type="blue"
              onClick={carregarDados}
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </SigButton>
          </div>
        </div>
      </SigCard>

      {erro && (
        <div className="rounded-2xl border border-red-800 bg-red-950/60 p-4 text-red-300">
          {erro}
        </div>
      )}

      {carregando ? (
        <SigCard>
          <div className="h-[65vh] min-h-[420px] flex items-center justify-center text-slate-400">
            Carregando mapa operacional...
          </div>
        </SigCard>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
          <section className="xl:col-span-9">
            <SigCard className="p-3 h-[70vh] min-h-[460px] overflow-hidden">
              <MapaOperacional
                ocorrencias={ocorrencias}
                viaturas={viaturas}
                localizacoes={localizacoes}
                blitzes={blitzes}
                barreiras={barreiras}
                operacoesEspeciais={operacoesEspeciais}
              />
            </SigCard>
          </section>

          <aside className="xl:col-span-3 space-y-4">
            <PainelLista
              titulo="🚧 Blitzes e Barreiras"
              vazio="Nenhuma blitz ou barreira com GPS."
              itens={[...blitzes, ...barreiras]}
            />

            <PainelLista
              titulo="⭐ Operações Especiais"
              vazio="Nenhuma operação especial com GPS."
              itens={operacoesEspeciais}
            />

            <PainelLista
              titulo="🚓 GPS Ativo"
              vazio="Nenhum GPS ativo no período."
              itens={localizacoes}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function CardInfo({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
          {titulo}
        </p>
        <Icone className="w-5 h-5 text-slate-400" />
      </div>

      <h3 className="mt-3 text-3xl font-black text-white">
        {valor}
      </h3>
    </div>
  );
}

function PainelLista({
  titulo,
  vazio,
  itens,
}: {
  titulo: string;
  vazio: string;
  itens: any[];
}) {
  return (
    <SigCard>
      <h2 className="font-black mb-4 text-white">
        {titulo}
      </h2>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {itens.length === 0 ? (
          <p className="text-slate-400 text-sm">{vazio}</p>
        ) : (
          itens.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-950/60 p-3"
            >
              <p className="font-bold text-white">
                {item.nome || item.prefixo || "Registro"}
              </p>

              <p className="text-sm text-slate-400">
                {item.local || item.observacao || "Local não informado"}
              </p>

              <p className="text-xs text-slate-500 mt-1">
                {item.status || "Sem status"}
              </p>
            </div>
          ))
        )}
      </div>
    </SigCard>
  );
}