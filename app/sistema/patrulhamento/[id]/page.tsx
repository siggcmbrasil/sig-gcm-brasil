"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, MapPin, RefreshCw, Route, Timer } from "lucide-react";
import "leaflet/dist/leaflet.css";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { finalizarPatrulhamentoV2 } from "@/lib/patrulhamento/finalizarPatrulhamento";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

const Polyline = dynamic(
  () => import("react-leaflet").then((m) => m.Polyline),
  { ssr: false }
);

type UsuarioLogado = {
  id: string;
  perfil: string;
  municipio_id: number;
  nome?: string;
};

type Patrulhamento = {
  id: number;
  municipio_id: number;
  data: string | null;
  hora: string | null;
  local: string | null;
  guarda: string | null;
  equipe: string | null;
  viatura: string | null;
  latitude: string | null;
  longitude: string | null;
  observacao: string | null;
  status: string | null;
  criado_em?: string | null;
  finalizado_em?: string | null;
};

type PontoGPS = {
  id: string;
  municipio_id: number;
  patrulhamento_id: number;
  latitude: number;
  longitude: number;
  velocidade: number | null;
  precisao: number | null;
  criado_em: string;
  tipo: string | null;
  observacao: string | null;
};

function obterUsuarioLogado(): UsuarioLogado | null {
  try {
    if (typeof window === "undefined") return null;

    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo);

    if (!usuario?.id || !usuario?.perfil || !usuario?.municipio_id) {
      return null;
    }

    return {
      id: String(usuario.id),
      perfil: String(usuario.perfil).toUpperCase(),
      municipio_id: Number(usuario.municipio_id),
      nome: usuario.nome || "",
    };
  } catch {
    return null;
  }
}

function distanciaMetros(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function formatarDataHora(valor?: string | null) {
  if (!valor) return "-";

  try {
    return new Date(valor).toLocaleString("pt-BR");
  } catch {
    return valor;
  }
}

function formatarDistancia(metros: number) {
  if (metros >= 1000) return `${(metros / 1000).toFixed(2)} km`;
  return `${Math.round(metros)} m`;
}

export default function DetalhePatrulhamentoPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id || 0);

  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [patrulhamento, setPatrulhamento] = useState<Patrulhamento | null>(null);
  const [pontos, setPontos] = useState<PontoGPS[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  const podeFinalizar = useMemo(() => {
    if (!usuario) return false;

    return [
      "DESENVOLVEDOR",
      "ADMIN",
      "COMANDANTE",
      "DIRETOR",
      "PLANTONISTA",
      "CMT_GUARNICAO",
      "GUARDA",
    ].includes(usuario.perfil);
  }, [usuario]);

  const pontosValidos = useMemo(() => {
    return pontos.filter((p) => {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);

      return Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0;
    });
  }, [pontos]);

  const posicoes = useMemo(() => {
    return pontosValidos.map((p) => [Number(p.latitude), Number(p.longitude)] as [number, number]);
  }, [pontosValidos]);

  const centro = useMemo<[number, number]>(() => {
    if (posicoes.length > 0) return posicoes[posicoes.length - 1];

    if (patrulhamento?.latitude && patrulhamento?.longitude) {
      return [Number(patrulhamento.latitude), Number(patrulhamento.longitude)];
    }

    return [-11.621296322631357, -38.80684199142887];
  }, [posicoes, patrulhamento]);

  const distanciaTotal = useMemo(() => {
    if (posicoes.length < 2) return 0;

    let total = 0;

    for (let i = 1; i < posicoes.length; i++) {
      total += distanciaMetros(
        posicoes[i - 1][0],
        posicoes[i - 1][1],
        posicoes[i][0],
        posicoes[i][1]
      );
    }

    return total;
  }, [posicoes]);

  async function carregarDados() {
    const usuarioAtual = obterUsuarioLogado();
    setUsuario(usuarioAtual);

    if (!usuarioAtual) {
      router.replace("/login");
      return;
    }

    if (!id || Number.isNaN(id)) {
      setPatrulhamento(null);
      setPontos([]);
      setCarregando(false);
      return;
    }

    setCarregando(true);

    const { data: patrulhamentoData, error: erroPatrulhamento } = await supabase
      .from("patrulhamentos")
      .select(
        "id, municipio_id, data, hora, local, guarda, equipe, viatura, latitude, longitude, observacao, status, criado_em, finalizado_em"
      )
      .eq("id", id)
      .eq("municipio_id", usuarioAtual.municipio_id)
      .single();

    if (erroPatrulhamento || !patrulhamentoData) {
      console.error("Erro patrulhamento:", erroPatrulhamento);
      setPatrulhamento(null);
      setPontos([]);
      setCarregando(false);
      return;
    }

    const { data: pontosData, error: erroPontos } = await supabase
      .from("gps_patrulhamento")
      .select("id, municipio_id, patrulhamento_id, latitude, longitude, velocidade, precisao, criado_em, tipo, observacao")
      .eq("patrulhamento_id", id)
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: true })
      .limit(5000);

    if (erroPontos) {
      console.error("Erro pontos GPS:", erroPontos);
      alert("Erro ao carregar pontos GPS.");
      setPontos([]);
    } else {
      setPontos((pontosData || []) as PontoGPS[]);
    }

    setPatrulhamento(patrulhamentoData as Patrulhamento);
    setCarregando(false);
  }

  async function finalizar() {
    if (!usuario || !patrulhamento) return;

    if (!podeFinalizar) {
      alert("Você não possui permissão para finalizar patrulhamento.");
      return;
    }

    if (patrulhamento.status === "FINALIZADO") {
      alert("Este patrulhamento já foi finalizado.");
      return;
    }

    const confirmar = confirm("Deseja finalizar este patrulhamento agora?");
    if (!confirmar) return;

    setFinalizando(true);

    try {
      await finalizarPatrulhamentoV2({
        municipio_id: usuario.municipio_id,
        patrulhamento_id: patrulhamento.id,
      });

      await registrarAuditoria({
        modulo: "Patrulhamento",
        acao: "FINALIZAR",
        descricao: `Finalizou o patrulhamento ${patrulhamento.id}.`,
        tabela: "patrulhamentos",
        registro_id: patrulhamento.id,
        detalhes: {
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
        },
      });

      alert("Patrulhamento finalizado com sucesso.");
      await carregarDados();
    } catch (error: any) {
      console.error("Erro ao finalizar patrulhamento:", error);
      alert(error?.message || "Erro ao finalizar patrulhamento.");
    } finally {
      setFinalizando(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, [id]);

  useEffect(() => {
    if (!usuario || !id) return;

    const canal = supabase
      .channel(`gps_patrulhamento_${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "gps_patrulhamento",
          filter: `patrulhamento_id=eq.${id}`,
        },
        (payload) => {
          const novo = payload.new as PontoGPS;

          if (Number(novo.municipio_id) !== Number(usuario.municipio_id)) return;

          setPontos((atuais) => {
            if (atuais.some((p) => p.id === novo.id)) return atuais;
            return [...atuais, novo];
          });
        }
      )
      .subscribe();

    const intervalo = window.setInterval(() => {
      void carregarDados();
    }, 15000);

    return () => {
      supabase.removeChannel(canal);
      window.clearInterval(intervalo);
    };
  }, [usuario?.municipio_id, id]);

  if (carregando) {
    return (
      <div className="p-6 text-slate-400">
        Carregando patrulhamento...
      </div>
    );
  }

  if (!patrulhamento) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-slate-400">Patrulhamento não encontrado.</p>
        <Link href="/sistema/patrulhamento" className="text-blue-400 font-bold">
          Voltar
        </Link>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 pb-24 space-y-5">
      <header className="border-b border-slate-800 pb-5 space-y-3">
        <Link
          href="/sistema/patrulhamento"
          className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300"
        >
          <ArrowLeft size={18} />
          Voltar para Patrulhamentos
        </Link>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
              Patrulhamento #{patrulhamento.id}
            </h1>
            <p className="text-slate-400 text-base md:text-lg mt-1">
              Rota GPS, pontos registrados e dados da equipe.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => carregarDados()}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Atualizar
            </button>

            {podeFinalizar && patrulhamento.status !== "FINALIZADO" && (
              <button
                type="button"
                onClick={finalizar}
                disabled={finalizando}
                className="bg-green-700 hover:bg-green-800 disabled:opacity-60 text-white px-4 py-3 rounded-xl font-bold inline-flex items-center gap-2"
              >
                <CheckCircle2 size={18} />
                {finalizando ? "Finalizando..." : "Finalizar"}
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 text-blue-400 font-bold">
            <MapPin size={18} />
            Pontos GPS
          </div>
          <p className="text-3xl font-black mt-2">{pontosValidos.length}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Route size={18} />
            Distância
          </div>
          <p className="text-3xl font-black mt-2">{formatarDistancia(distanciaTotal)}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-yellow-400 font-bold">
            <Timer size={18} />
            Status
          </div>
          <p className="text-xl font-black mt-3">
            {patrulhamento.status || "EM_ANDAMENTO"}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 text-green-400 font-bold">
            <CheckCircle2 size={18} />
            Último ponto
          </div>
          <p className="text-sm text-slate-300 mt-3">
            {pontosValidos.length
              ? formatarDataHora(pontosValidos[pontosValidos.length - 1].criado_em)
              : "Nenhum"}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="card xl:col-span-1 space-y-3">
          <h2 className="text-xl font-bold">Dados</h2>

          <p><span className="text-slate-500">Data: </span>{patrulhamento.data || "-"}</p>
          <p><span className="text-slate-500">Hora: </span>{patrulhamento.hora || "-"}</p>
          <p><span className="text-slate-500">Local: </span>{patrulhamento.local || "-"}</p>
          <p><span className="text-slate-500">Viatura: </span>{patrulhamento.viatura || "-"}</p>
          <p><span className="text-slate-500">Guarda: </span>{patrulhamento.guarda || "-"}</p>

          {patrulhamento.equipe && (
            <div>
              <p className="text-slate-500">Equipe:</p>
              <pre className="font-sans whitespace-pre-wrap text-slate-300 text-sm">
                {patrulhamento.equipe}
              </pre>
            </div>
          )}

          {patrulhamento.observacao && (
            <p className="text-slate-400 text-sm border-t border-slate-800 pt-3">
              {patrulhamento.observacao}
            </p>
          )}
        </div>

        <div className="card xl:col-span-3">
          <h2 className="text-xl font-bold mb-4">Mapa da Rota</h2>

          {pontosValidos.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6 text-slate-400">
              Nenhum ponto GPS registrado para este patrulhamento.
            </div>
          ) : (
            <div className="h-[70vh] rounded-2xl overflow-hidden border border-slate-800">
              <MapContainer
                center={centro}
                zoom={16}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {posicoes.length > 1 && (
                  <Polyline
                    positions={posicoes}
                    pathOptions={{ color: "#2563eb", weight: 6 }}
                  />
                )}

                {pontosValidos.map((ponto, index) => (
                  <Marker
                    key={ponto.id}
                    position={[Number(ponto.latitude), Number(ponto.longitude)]}
                  >
                    <Popup>
                      <strong>{ponto.tipo || "GPS"}</strong>
                      <br />
                      Ordem: {index + 1}
                      <br />
                      Horário: {formatarDataHora(ponto.criado_em)}
                      {ponto.precisao && (
                        <>
                          <br />
                          Precisão: {Math.round(ponto.precisao)}m
                        </>
                      )}
                      {ponto.observacao && (
                        <>
                          <br />
                          {ponto.observacao}
                        </>
                      )}
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
