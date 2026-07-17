"use client";

// SIG MAPA OPERACIONAL TELA CHEIA V4 - PONTOS HISTORICOS + ATUALIZACAO 5 MIN - 2026-07-17

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  Crosshair,
  Eye,
  EyeOff,
  Filter,
  Layers3,
  Maximize2,
  Minimize2,
  RefreshCw,
  Shield,
  Siren,
  Truck,
  X,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { obterMunicipioIdEfetivo } from "@/lib/contextoMunicipio";

const MapaOperacional = dynamic(() => import("@/components/MapaOperacional"), {
  ssr: false,
});

type Camadas = {
  ocorrencias: boolean;
  viaturas: boolean;
  gps: boolean;
  blitzes: boolean;
  barreiras: boolean;
  operacoes: boolean;
  sos: boolean;
};

const CAMADAS_INICIAIS: Camadas = {
  ocorrencias: true,
  viaturas: true,
  gps: true,
  blitzes: true,
  barreiras: true,
  operacoes: true,
  sos: true,
};

function hojeLocal() {
  const deslocamento = new Date().getTimezoneOffset() * 60000;
  return new Date(Date.now() - deslocamento).toISOString().split("T")[0];
}

function pegarUsuario() {
  if (typeof window === "undefined") return null;

  try {
    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo);
    const municipioId = obterMunicipioIdEfetivo({
      perfil: usuario?.perfil,
      municipioIdUsuario: usuario?.municipio_id,
    });

    if (!usuario?.id || !municipioId) return null;

    return { ...usuario, municipio_id: municipioId };
  } catch {
    return null;
  }
}

function filtrarPorData(lista: any[], dataFiltro: string, campos: string[]) {
  if (!dataFiltro) return lista;

  return lista.filter((item) =>
    campos.some((campo) => {
      const valor = item?.[campo];
      return valor && String(valor).split("T")[0] === dataFiltro;
    })
  );
}

function filtrarGpsAtivo(lista: any[]) {
  const agora = Date.now();

  return lista.filter((item) => {
    const data = item.atualizado_em || item.created_at;
    if (!data) return false;
    return (agora - new Date(data).getTime()) / 60000 <= 5;
  });
}

async function carregarAlertasSOSMapa(municipioId: number) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const token = session?.access_token;
  if (sessionError || !token) {
    return { data: [], error: new Error("Sua sessão expirou.") };
  }

  try {
    const resposta = await fetch(`/api/sos/mapa?municipio_id=${municipioId}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const corpo = await resposta.json().catch(() => null);

    if (!resposta.ok || !corpo?.ok) {
      return {
        data: [],
        error: new Error(corpo?.erro || "Não foi possível carregar os alertas SOS."),
      };
    }

    return { data: Array.isArray(corpo.alertas) ? corpo.alertas : [], error: null };
  } catch (error) {
    return {
      data: [],
      error: error instanceof Error ? error : new Error("Erro ao carregar SOS."),
    };
  }
}

export default function MapaOperacionalPage() {
  const hoje = useMemo(() => hojeLocal(), []);
  const [dataFiltro, setDataFiltro] = useState("");
  const [camadas, setCamadas] = useState<Camadas>(CAMADAS_INICIAIS);
  const [painelAberto, setPainelAberto] = useState(true);
  const [legendaAberta, setLegendaAberta] = useState(true);
  const [telaCheia, setTelaCheia] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const primeiraCargaRef = useRef(true);
  const [erro, setErro] = useState("");
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("");

  const [ocorrencias, setOcorrencias] = useState<any[]>([]);
  const [viaturas, setViaturas] = useState<any[]>([]);
  const [localizacoes, setLocalizacoes] = useState<any[]>([]);
  const [blitzes, setBlitzes] = useState<any[]>([]);
  const [barreiras, setBarreiras] = useState<any[]>([]);
  const [operacoesEspeciais, setOperacoesEspeciais] = useState<any[]>([]);
  const [alertasSOS, setAlertasSOS] = useState<any[]>([]);

  const carregarDados = useCallback(async () => {
    const usuario = pegarUsuario();

    if (!usuario?.id || !usuario?.municipio_id) {
      setErro("Usuário ou município não identificado.");
      setCarregando(false);
      return;
    }

    try {
      if (primeiraCargaRef.current) {
        setCarregando(true);
      }
      setAtualizando(true);
      setErro("");
      const municipioId = Number(usuario.municipio_id);

      const [ocorrenciasRes, viaturasRes, gpsRes, blitzesRes, barreirasRes, operacoesRes, sosRes] =
        await Promise.all([
          supabase
            .from("ocorrencias")
            .select("*, locais:local_id(id,nome,latitude,longitude)")
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
          carregarAlertasSOSMapa(municipioId),
        ]);

      if (ocorrenciasRes.error) throw ocorrenciasRes.error;
      if (viaturasRes.error) throw viaturasRes.error;
      if (gpsRes.error) throw gpsRes.error;
      if (blitzesRes.error) throw blitzesRes.error;
      if (barreirasRes.error) throw barreirasRes.error;
      if (operacoesRes.error) throw operacoesRes.error;
      if (sosRes.error) throw sosRes.error;

      setOcorrencias(
        filtrarPorData(ocorrenciasRes.data || [], dataFiltro, ["data", "criado_em", "created_at"])
      );
      setViaturas(viaturasRes.data || []);
      setLocalizacoes(
        filtrarGpsAtivo(
          filtrarPorData(gpsRes.data || [], dataFiltro, ["atualizado_em", "created_at"])
        )
      );
      setBlitzes(
        filtrarPorData(blitzesRes.data || [], dataFiltro, ["data", "created_at", "criado_em"])
      );
      setBarreiras(
        filtrarPorData(barreirasRes.data || [], dataFiltro, ["data", "created_at", "criado_em"])
      );
      setOperacoesEspeciais(
        filtrarPorData(operacoesRes.data || [], dataFiltro, ["data", "created_at", "criado_em"])
      );
      setAlertasSOS(sosRes.data || []);
      setUltimaAtualizacao(new Date().toLocaleTimeString("pt-BR"));
    } catch (error) {
      console.error("Erro ao carregar mapa operacional:", error);
      setErro("Erro ao carregar os dados do mapa operacional.");
    } finally {
      primeiraCargaRef.current = false;
      setCarregando(false);
      setAtualizando(false);
    }
  }, [dataFiltro]);

  useEffect(() => {
    void carregarDados();

    // Atualização automática discreta a cada 5 minutos.
    // O mapa permanece montado para evitar piscar, perder zoom ou reposicionar a tela.
    const intervalo = window.setInterval(() => {
      void carregarDados();
    }, 300000);

    return () => {
      window.clearInterval(intervalo);
    };
  }, [carregarDados]);

  useEffect(() => {
    const aoAlterarTelaCheia = () => setTelaCheia(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", aoAlterarTelaCheia);
    return () => document.removeEventListener("fullscreenchange", aoAlterarTelaCheia);
  }, []);

  async function alternarTelaCheia() {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      setTelaCheia((valor) => !valor);
    }
  }

  function alternarCamada(nome: keyof Camadas) {
    setCamadas((atual) => ({ ...atual, [nome]: !atual[nome] }));
  }

  const abertas = ocorrencias.filter((item) =>
    ["ABERTA", "Aberta", "EM ANDAMENTO", "Em andamento"].includes(item.status)
  ).length;

  const pontosAtivos =
    ocorrencias.length +
    viaturas.length +
    localizacoes.length +
    blitzes.length +
    barreiras.length +
    operacoesEspeciais.length +
    alertasSOS.length;

  return (
    <main className="fixed inset-0 z-[80] overflow-hidden bg-[#020617] text-white">
      <div className="absolute inset-0">
        {carregando ? (
          <div className="flex h-full items-center justify-center bg-[#020617]">
            <div className="text-center">
              <RefreshCw className="mx-auto h-10 w-10 animate-spin text-cyan-400" />
              <p className="mt-4 text-sm font-semibold text-slate-300">Carregando mapa operacional...</p>
            </div>
          </div>
        ) : (
          <MapaOperacional
            ocorrencias={camadas.ocorrencias ? ocorrencias : []}
            viaturas={camadas.viaturas ? viaturas : []}
            localizacoes={camadas.gps ? localizacoes : []}
            blitzes={camadas.blitzes ? blitzes : []}
            barreiras={camadas.barreiras ? barreiras : []}
            operacoesEspeciais={camadas.operacoes ? operacoesEspeciais : []}
            alertasSOS={camadas.sos ? alertasSOS : []}
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-3 md:p-4">
        <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-slate-950/88 px-3 py-2 shadow-2xl shadow-black/50 backdrop-blur-xl md:px-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/sistema"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-cyan-500/50 hover:text-cyan-300"
              title="Voltar"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>

            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-300">
              <Crosshair className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-sm font-black uppercase tracking-[0.16em] text-white md:text-base">
                Central de Mapa Operacional
              </h1>
              <p className="truncate text-[11px] text-slate-400 md:text-xs">
                Atualização automática a cada 5 minutos • Última atualização: {ultimaAtualizacao || "--:--:--"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void carregarDados()}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300"
              title="Atualizar"
            >
              <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
            </button>

            <button
              type="button"
              onClick={() => setPainelAberto((valor) => !valor)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300"
              title="Camadas"
            >
              <Layers3 className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => void alternarTelaCheia()}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/50 hover:text-cyan-300"
              title="Tela cheia"
            >
              {telaCheia ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute left-3 top-24 z-[500] flex max-w-[calc(100vw-1.5rem)] gap-2 overflow-x-auto md:left-4">
        <MiniIndicador icone={Crosshair} rotulo="Pontos" valor={pontosAtivos} />
        <MiniIndicador icone={AlertTriangle} rotulo="Ocorrências" valor={ocorrencias.length} />
        <MiniIndicador icone={Siren} rotulo="Abertas" valor={abertas} destaque={abertas > 0} />
        <MiniIndicador icone={Truck} rotulo="GPS ativo" valor={localizacoes.length} />
        <MiniIndicador icone={Shield} rotulo="SOS" valor={alertasSOS.length} alerta={alertasSOS.length > 0} />
      </div>

      {painelAberto && (
        <aside className="pointer-events-auto absolute right-3 top-24 z-[510] w-[min(340px,calc(100vw-1.5rem))] rounded-2xl border border-slate-700/80 bg-slate-950/92 shadow-2xl shadow-black/60 backdrop-blur-xl md:right-4">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-white">
                <Filter className="h-4 w-4 text-cyan-400" /> Camadas do mapa
              </h2>
              <p className="mt-1 text-[11px] text-slate-500">Ative ou oculte os pontos operacionais. O modo padrão exibe todo o histórico.</p>
            </div>
            <button
              type="button"
              onClick={() => setPainelAberto(false)}
              className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-2">
              <input
                type="date"
                value={dataFiltro}
                onChange={(evento) => setDataFiltro(evento.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setDataFiltro(hoje)}
                className={`rounded-xl border px-3 text-xs font-bold transition ${
                  dataFiltro === hoje
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/50"
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setDataFiltro("")}
                className={`rounded-xl border px-3 text-xs font-bold transition ${
                  !dataFiltro
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200"
                    : "border-slate-700 bg-slate-900 text-slate-200 hover:border-cyan-500/50"
                }`}
              >
                Todos
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <CamadaBotao ativo={camadas.ocorrencias} nome="Ocorrências" ponto="bg-red-500" onClick={() => alternarCamada("ocorrencias")} />
              <CamadaBotao ativo={camadas.viaturas} nome="Viaturas" ponto="bg-emerald-400" onClick={() => alternarCamada("viaturas")} />
              <CamadaBotao ativo={camadas.gps} nome="GPS ativo" ponto="bg-cyan-400" onClick={() => alternarCamada("gps")} />
              <CamadaBotao ativo={camadas.blitzes} nome="Blitzes" ponto="bg-amber-400" onClick={() => alternarCamada("blitzes")} />
              <CamadaBotao ativo={camadas.barreiras} nome="Barreiras" ponto="bg-violet-400" onClick={() => alternarCamada("barreiras")} />
              <CamadaBotao ativo={camadas.operacoes} nome="Operações" ponto="bg-fuchsia-400" onClick={() => alternarCamada("operacoes")} />
              <CamadaBotao ativo={camadas.sos} nome="Alertas SOS" ponto="bg-red-600" onClick={() => alternarCamada("sos")} />
            </div>

            <button
              type="button"
              onClick={() => setCamadas(CAMADAS_INICIAIS)}
              className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-2 text-xs font-black uppercase tracking-wide text-cyan-300 hover:bg-cyan-500/15"
            >
              Exibir todas as camadas
            </button>
          </div>
        </aside>
      )}

      <div className="pointer-events-none absolute bottom-4 left-3 z-[500] md:left-4">
        {legendaAberta ? (
          <div className="pointer-events-auto w-[min(310px,calc(100vw-1.5rem))] rounded-2xl border border-slate-700/80 bg-slate-950/92 p-4 shadow-2xl backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white">Legenda operacional</h3>
              <button
                type="button"
                onClick={() => setLegendaAberta(false)}
                className="text-slate-400 hover:text-white"
              >
                <EyeOff className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] text-slate-300">
              <LegendaItem simbolo="●" classe="text-red-500" texto="Ocorrência aberta" />
              <LegendaItem simbolo="●" classe="text-amber-400" texto="Em andamento" />
              <LegendaItem simbolo="●" classe="text-emerald-400" texto="Finalizada" />
              <LegendaItem simbolo="🚓" texto="Viatura / GPS" />
              <LegendaItem simbolo="🚧" texto="Blitz" />
              <LegendaItem simbolo="🛡️" texto="Barreira" />
              <LegendaItem simbolo="⭐" texto="Operação especial" />
              <LegendaItem simbolo="🚨" texto="Alerta SOS" />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setLegendaAberta(true)}
            className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950/92 px-3 py-2 text-xs font-bold text-white shadow-xl backdrop-blur-xl"
          >
            <Eye className="h-4 w-4 text-cyan-400" /> Legenda
          </button>
        )}
      </div>

      {erro && (
        <div className="absolute bottom-4 right-4 z-[600] max-w-md rounded-xl border border-red-500/30 bg-red-950/90 px-4 py-3 text-sm text-red-200 shadow-xl">
          {erro}
        </div>
      )}
    </main>
  );
}

function MiniIndicador({
  icone: Icone,
  rotulo,
  valor,
  destaque = false,
  alerta = false,
}: {
  icone: any;
  rotulo: string;
  valor: number;
  destaque?: boolean;
  alerta?: boolean;
}) {
  return (
    <div
      className={`pointer-events-auto flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 shadow-xl backdrop-blur-xl ${
        alerta
          ? "border-red-500/50 bg-red-950/90"
          : destaque
          ? "border-amber-500/40 bg-slate-950/92"
          : "border-slate-700/80 bg-slate-950/88"
      }`}
    >
      <Icone className={`h-4 w-4 ${alerta ? "text-red-400" : destaque ? "text-amber-400" : "text-cyan-400"}`} />
      <div>
        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{rotulo}</p>
        <p className="text-sm font-black leading-none text-white">{valor}</p>
      </div>
    </div>
  );
}

function CamadaBotao({
  ativo,
  nome,
  ponto,
  onClick,
}: {
  ativo: boolean;
  nome: string;
  ponto: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-xs font-bold transition ${
        ativo
          ? "border-cyan-500/30 bg-cyan-500/10 text-white"
          : "border-slate-800 bg-slate-900/70 text-slate-500"
      }`}
    >
      <span className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${ponto} ${ativo ? "shadow-[0_0_10px_currentColor]" : "opacity-30"}`} />
        {nome}
      </span>
      {ativo ? <Eye className="h-3.5 w-3.5 text-cyan-300" /> : <EyeOff className="h-3.5 w-3.5" />}
    </button>
  );
}

function LegendaItem({ simbolo, texto, classe = "" }: { simbolo: string; texto: string; classe?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-5 text-center text-sm ${classe}`}>{simbolo}</span>
      <span>{texto}</span>
    </div>
  );
}
