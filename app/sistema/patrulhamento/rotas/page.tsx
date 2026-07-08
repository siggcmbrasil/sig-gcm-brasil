"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, CheckCircle, Clock3, Gauge, MapPin, RefreshCw, Route, Timer } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { finalizarPatrulhamentoV2 } from "@/lib/patrulhamento/finalizarPatrulhamento";

const MapContainer = dynamic(() => import("react-leaflet").then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((m) => m.Polyline), { ssr: false });

const CENTRO_PADRAO: [number, number] = [-11.621296322631357, -38.80684199142887];

type UsuarioLogado = { id: string; perfil: string; municipio_id: number };

type Patrulhamento = {
  id: number;
  municipio_id: number;
  data: string;
  hora: string;
  local: string;
  guarda: string;
  equipe: string | null;
  viatura: string | null;
  observacao: string | null;
  status: string | null;
  finalizado_em?: string | null;
};

type PontoGps = {
  id: string;
  municipio_id: number;
  patrulhamento_id: number;
  latitude: number;
  longitude: number;
  velocidade: number | null;
  precisao: number | null;
  tipo: "INICIAL" | "AUTOMATICO" | "MANUAL" | "FINAL" | string;
  observacao: string | null;
  criado_em: string;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;
    const usuario = JSON.parse(salvo);
    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) return null;
    return {
      id: String(usuario.id),
      perfil: usuario.perfil,
      municipio_id: Number(usuario.municipio_id),
    };
  } catch {
    return null;
  }
}

function calcularDistanciaMetros(pontos: PontoGps[]) {
  let total = 0;
  for (let i = 1; i < pontos.length; i++) {
    const a = pontos[i - 1];
    const b = pontos[i];
    const r = 6371000;
    const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
    const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.latitude * Math.PI) / 180) *
        Math.cos((b.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    total += r * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
  }
  return total;
}

function formatarDistancia(metros: number) {
  if (metros >= 1000) return `${(metros / 1000).toFixed(2)} km`;
  return `${Math.round(metros)} m`;
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "-";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function criarIcone(tipo: string) {
  if (typeof window === "undefined") return undefined;
  const L = require("leaflet");
  const emoji = tipo === "INICIAL" ? "🚩" : tipo === "FINAL" ? "🏁" : tipo === "MANUAL" ? "📍" : "🔵";
  const cor = tipo === "INICIAL" ? "#22c55e" : tipo === "FINAL" ? "#ef4444" : tipo === "MANUAL" ? "#f59e0b" : "#2563eb";

  return L.divIcon({
    className: "sig-ponto-gps",
    html: `<div style="width:30px;height:30px;border-radius:999px;background:${cor};border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 8px 22px rgba(0,0,0,.35)">${emoji}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function MapController({ posicoes }: { posicoes: [number, number][] }) {
  const { useMap } = require("react-leaflet");
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
      if (posicoes.length > 1) map.fitBounds(posicoes, { padding: [50, 50] });
      else if (posicoes.length === 1) map.setView(posicoes[0], 17);
    }, 300);
  }, [map, posicoes]);

  return null;
}

function StatCard({ titulo, valor, subtitulo, icon: Icon, cor }: any) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-[#07182c] p-4 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-black" style={{ color: cor }}>
        <Icon size={18} />
        {titulo}
      </div>
      <div className="mt-2 text-3xl font-black text-white">{valor}</div>
      {subtitulo && <div className="mt-1 text-sm text-slate-400">{subtitulo}</div>}
    </div>
  );
}

export default function RotaPatrulhamentoPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id || 0);

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [patrulhamento, setPatrulhamento] = useState<Patrulhamento | null>(null);
  const [pontos, setPontos] = useState<PontoGps[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  async function carregarDados() {
    const u = obterUsuarioLogado();
    setUsuario(u);
    if (!u || !id) {
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data: patrulhamentoData, error: erroPatrulhamento } = await supabase
      .from("patrulhamentos")
      .select("id, municipio_id, data, hora, local, guarda, equipe, viatura, observacao, status, finalizado_em")
      .eq("id", id)
      .eq("municipio_id", u.municipio_id)
      .single();

    if (erroPatrulhamento || !patrulhamentoData) {
      setPatrulhamento(null);
      setPontos([]);
      setCarregando(false);
      return;
    }

    const { data: pontosData, error: erroPontos } = await supabase
      .from("gps_patrulhamento")
      .select("id, municipio_id, patrulhamento_id, latitude, longitude, velocidade, precisao, tipo, observacao, criado_em")
      .eq("patrulhamento_id", id)
      .eq("municipio_id", u.municipio_id)
      .order("criado_em", { ascending: true });

    if (erroPontos) {
      console.error(erroPontos);
      alert("Erro ao carregar pontos GPS.");
    }

    setPatrulhamento(patrulhamentoData as Patrulhamento);
    setPontos((pontosData || []) as PontoGps[]);
    setCarregando(false);
  }

  async function finalizar() {
    if (!usuario || !patrulhamento) return;
    const ok = confirm("Finalizar este patrulhamento?");
    if (!ok) return;

    setFinalizando(true);
    try {
      await finalizarPatrulhamentoV2({
        municipio_id: usuario.municipio_id,
        patrulhamento_id: patrulhamento.id,
      });
      await carregarDados();
      alert("Patrulhamento finalizado.");
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Erro ao finalizar patrulhamento.");
    } finally {
      setFinalizando(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, [id]);

  const pontosValidos = pontos.filter(
    (p) => Number.isFinite(Number(p.latitude)) && Number.isFinite(Number(p.longitude))
  );

  const posicoes = pontosValidos.map((p) => [p.latitude, p.longitude]) as [number, number][];
  const centro = posicoes[0] || CENTRO_PADRAO;
  const distancia = useMemo(() => calcularDistanciaMetros(pontosValidos), [pontosValidos]);
  const ultimoPonto = pontosValidos[pontosValidos.length - 1];
  const automaticos = pontosValidos.filter((p) => p.tipo === "AUTOMATICO").length;
  const manuais = pontosValidos.filter((p) => p.tipo === "MANUAL").length;
  const precisaoMedia = pontosValidos.length
    ? Math.round(
        pontosValidos.reduce((acc, p) => acc + Number(p.precisao || 0), 0) / pontosValidos.length
      )
    : 0;

  if (carregando) {
    return <div className="p-6 text-slate-300">Carregando patrulhamento...</div>;
  }

  if (!patrulhamento) {
    return <div className="p-6 text-slate-300">Patrulhamento não encontrado.</div>;
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-5 text-white">
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => router.push("/sistema/patrulhamento")}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-bold hover:bg-slate-800 flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-4xl md:text-5xl font-black">Patrulhamento #{patrulhamento.id}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-black border ${patrulhamento.status === "FINALIZADO" ? "bg-green-500/10 text-green-400 border-green-500/40" : "bg-yellow-500/10 text-yellow-300 border-yellow-500/40"}`}>
                {patrulhamento.status || "EM_ANDAMENTO"}
              </span>
            </div>
            <p className="text-slate-400 mt-1">Rota GPS, pontos registrados e dados da equipe.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={carregarDados} className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-3 font-bold flex items-center gap-2">
            <RefreshCw size={18} /> Atualizar
          </button>

          {patrulhamento.status !== "FINALIZADO" && (
            <button
              onClick={finalizar}
              disabled={finalizando}
              className="rounded-xl bg-green-700 hover:bg-green-800 px-4 py-3 font-black disabled:opacity-60"
            >
              {finalizando ? "Finalizando..." : "Finalizar"}
            </button>
          )}
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard titulo="Pontos GPS" valor={pontosValidos.length} subtitulo="Total registrados" icon={MapPin} cor="#38bdf8" />
        <StatCard titulo="Distância" valor={formatarDistancia(distancia)} subtitulo="Distância percorrida" icon={Route} cor="#22d3ee" />
        <StatCard titulo="Status" valor={patrulhamento.status || "-"} subtitulo="Situação atual" icon={Timer} cor="#facc15" />
        <StatCard titulo="Precisão média" valor={precisaoMedia ? `${precisaoMedia} m` : "-"} subtitulo="Quanto menor, melhor" icon={Gauge} cor="#a78bfa" />
        <StatCard titulo="Último ponto" valor={ultimoPonto ? formatarDataHora(ultimoPonto.criado_em) : "-"} subtitulo="Última atualização" icon={CheckCircle} cor="#22c55e" />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-700/70 bg-[#07182c] p-5">
            <h2 className="text-xl font-black mb-4">Dados do Patrulhamento</h2>
            <div className="space-y-3 text-sm">
              <p><span className="text-slate-400">Data:</span> {patrulhamento.data}</p>
              <p><span className="text-slate-400">Hora:</span> {patrulhamento.hora}</p>
              <p><span className="text-slate-400">Local:</span> {patrulhamento.local}</p>
              <p><span className="text-slate-400">Viatura:</span> {patrulhamento.viatura || "-"}</p>
              <p><span className="text-slate-400">Guarda:</span> {patrulhamento.guarda}</p>
              <div>
                <p className="text-slate-400">Equipe:</p>
                <pre className="whitespace-pre-wrap font-sans text-slate-200 text-sm">{patrulhamento.equipe || "-"}</pre>
              </div>
              <p><span className="text-slate-400">Observação:</span> {patrulhamento.observacao || "-"}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-[#07182c] p-5">
            <h2 className="text-xl font-black mb-4">Estatísticas</h2>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between"><span>Distância total</span><b>{formatarDistancia(distancia)}</b></p>
              <p className="flex justify-between"><span>Pontos registrados</span><b>{pontosValidos.length}</b></p>
              <p className="flex justify-between"><span>Automáticos</span><b>{automaticos}</b></p>
              <p className="flex justify-between"><span>Manuais</span><b>{manuais}</b></p>
            </div>
          </div>
        </aside>

        <div className="xl:col-span-3 space-y-4">
          <div className="rounded-2xl border border-slate-700/70 bg-[#07182c] p-4">
            <h2 className="text-xl font-black mb-3">Mapa da Rota</h2>

            {pontosValidos.length === 0 ? (
              <div className="h-[65vh] rounded-2xl border border-slate-700 flex items-center justify-center text-slate-400">
                Nenhum ponto GPS registrado para este patrulhamento.
              </div>
            ) : (
              <div className="h-[65vh] rounded-2xl overflow-hidden border border-slate-700 bg-slate-900">
                <MapContainer center={centro} zoom={16} style={{ width: "100%", height: "100%" }}>
                  <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <MapController posicoes={posicoes} />

                  {posicoes.length > 1 && (
                    <Polyline positions={posicoes} pathOptions={{ color: "#2563eb", weight: 6, opacity: 0.9 }} />
                  )}

                  {pontosValidos.map((p, index) => (
                    <Marker key={p.id} position={[p.latitude, p.longitude]} icon={criarIcone(p.tipo)}>
                      <Popup>
                        <strong>{p.tipo}</strong><br />
                        Ordem: {index + 1}<br />
                        {formatarDataHora(p.criado_em)}<br />
                        Precisão: {p.precisao ? `${p.precisao} m` : "-"}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-700/70 bg-[#07182c] p-4">
            <h2 className="text-xl font-black mb-3">Linha do tempo dos pontos</h2>
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
              {pontosValidos.map((p, index) => (
                <div key={p.id} className="rounded-xl border border-slate-700 bg-slate-950/40 p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black">{index + 1}. {p.tipo}</p>
                    <p className="text-sm text-slate-400">{p.observacao || "Ponto GPS"}</p>
                  </div>
                  <div className="text-right text-sm text-slate-300">
                    <p>{formatarDataHora(p.criado_em)}</p>
                    <p className="text-slate-500">Precisão: {p.precisao ? `${p.precisao} m` : "-"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
