"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Map,
  MapPinned,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ProtecaoModulo from "@/components/ProtecaoModulo";
import SigActionCard from "@/components/sig/SigActionCard";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";
import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

type UsuarioLocal = {
  perfil?: string;
  municipio_id?: number;
};

type Ocorrencia = {
  id: number;
  tipo: string | null;
  bairro: string | null;
  local: string | null;
  data: string | null;
  status: string | null;
};

type Localizacao = {
  id: number;
  usuario_id: number | null;
  guarda_id: number | null;
  latitude: number | null;
  longitude: number | null;
  atualizado_em: string | null;
};

type Patrulhamento = {
  id: number;
  status: string | null;
  equipe: string | null;
  viatura: string | null;
};

type DadosInteligencia = {
  ocorrencias: Ocorrencia[];
  localizacoes: Localizacao[];
  patrulhamentos: Patrulhamento[];
};

const dadosIniciais: DadosInteligencia = {
  ocorrencias: [],
  localizacoes: [],
  patrulhamentos: [],
};

const cards = [
  {
    titulo: "SIGIA",
    icone: Brain,
    href: "/sistema/sigia",
    descricao:
      "Assistente de inteligência para análise, pesquisa e apoio à decisão.",
    detalhe: "Abrir SIGIA",
  },
  {
    titulo: "Central SOS",
    icone: ShieldAlert,
    href: "/sistema/central-sos",
    descricao:
      "Monitoramento de alertas SOS, emergência e apoio imediato às equipes.",
    detalhe: "Abrir alertas SOS",
  },
  {
    titulo: "Estatísticas",
    icone: BarChart3,
    href: "/sistema/estatisticas",
    descricao:
      "Indicadores, gráficos e desempenho operacional do município.",
    detalhe: "Abrir estatísticas",
  },
  {
    titulo: "Mapa Operacional",
    icone: Map,
    href: "/sistema/mapa-operacional",
    descricao:
      "Ocorrências, equipes, viaturas e pontos estratégicos no mapa.",
    detalhe: "Abrir mapa",
  },
  {
    titulo: "Localização em Tempo Real",
    icone: Activity,
    href: "/sistema/localizacao",
    descricao:
      "Monitoramento das equipes e viaturas em serviço pelo GPS.",
    detalhe: "Abrir rastreamento",
  },
  {
    titulo: "Mancha Criminal",
    icone: Target,
    href: "/sistema/mancha-criminal",
    descricao:
      "Mapa de calor e análise das áreas de maior incidência.",
    detalhe: "Abrir mancha criminal",
  },
  {
    titulo: "Indicadores Operacionais",
    icone: BarChart3,
    href: "/sistema/indicadores",
    descricao:
      "Métricas e acompanhamento operacional em tempo real.",
    detalhe: "Abrir indicadores",
  },
  {
    titulo: "Análise de Ocorrências",
    icone: Search,
    href: "/sistema/analise-ocorrencias",
    descricao:
      "Cruzamento, recorrência e análise inteligente das ocorrências.",
    detalhe: "Abrir análise",
  },
  {
    titulo: "Alertas Operacionais",
    icone: AlertTriangle,
    href: "/sistema/alertas",
    descricao:
      "Alertas automáticos e monitoramento de eventos críticos.",
    detalhe: "Abrir alertas",
  },
];

function dataBahia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizar(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function obterUsuarioLocal(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "null"
    ) as UsuarioLocal | null;
  } catch {
    return null;
  }
}

export default function CentralInteligenciaPage() {
  const [dados, setDados] =
    useState<DadosInteligencia>(dadosIniciais);
  const [municipioNome, setMunicipioNome] =
    useState("Município");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  async function carregar() {
    setCarregando(true);
    setErro("");

    try {
      const usuario = obterUsuarioLocal();

      if (!usuario?.perfil) {
        throw new Error("Usuário não identificado.");
      }

      const contexto = lerMunicipioContextoLocal();

      const municipioId = obterMunicipioIdEfetivo({
        perfil: usuario.perfil,
        municipioIdUsuario: usuario.municipio_id,
      });

      if (!municipioId) {
        throw new Error("Município não identificado.");
      }

      const [
        municipioResposta,
        ocorrenciasResposta,
        localizacoesResposta,
        patrulhamentosResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("nome")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("ocorrencias")
          .select("id,tipo,bairro,local,data,status")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(300),

        supabase
          .from("localizacoes_tempo_real")
          .select(
            "id,usuario_id,guarda_id,latitude,longitude,atualizado_em"
          )
          .eq("municipio_id", municipioId)
          .order("atualizado_em", { ascending: false })
          .limit(100),

        supabase
          .from("patrulhamentos")
          .select("id,status,equipe,viatura")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(100),
      ]);

      if (municipioResposta.error) {
        console.warn(
          "Falha parcial em municipios:",
          municipioResposta.error.message
        );
      }

      if (ocorrenciasResposta.error) {
        throw ocorrenciasResposta.error;
      }

      if (localizacoesResposta.error) {
        console.warn(
          "Falha parcial em localizacoes_tempo_real:",
          localizacoesResposta.error.message
        );
      }

      if (patrulhamentosResposta.error) {
        console.warn(
          "Falha parcial em patrulhamentos:",
          patrulhamentosResposta.error.message
        );
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setDados({
        ocorrencias:
          (ocorrenciasResposta.data as Ocorrencia[] | null) ||
          [],
        localizacoes:
          (localizacoesResposta.data as Localizacao[] | null) ||
          [],
        patrulhamentos:
          (patrulhamentosResposta.data as
            | Patrulhamento[]
            | null) || [],
      });
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Inteligência:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar a Central de Inteligência."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const hoje = dataBahia();

  const metricas = useMemo(() => {
    const ocorrenciasHoje = dados.ocorrencias.filter(
      (item) => item.data === hoje
    );

    const ocorrenciasAbertas = dados.ocorrencias.filter(
      (item) =>
        ![
          "FINALIZADA",
          "FINALIZADO",
          "ENCERRADA",
          "ENCERRADO",
          "ARQUIVADA",
          "ARQUIVADO",
        ].includes(normalizar(item.status))
    );

    const patrulhamentosAtivos =
      dados.patrulhamentos.filter((item) =>
        [
          "ATIVO",
          "EM_ANDAMENTO",
          "PATRULHANDO",
          "EM_PATRULHAMENTO",
          "PAUSADO",
        ].includes(normalizar(item.status))
      );

    const equipes = new Set(
      patrulhamentosAtivos
        .map((item) => item.equipe?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const bairros = new Set(
      dados.ocorrencias
        .map((item) => item.bairro?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      ocorrenciasHoje: ocorrenciasHoje.length,
      ocorrenciasAbertas: ocorrenciasAbertas.length,
      localizacoesOnline: dados.localizacoes.length,
      patrulhamentosAtivos: patrulhamentosAtivos.length,
      equipesAtivas: equipes.size,
      bairrosMonitorados: bairros.size,
    };
  }, [dados, hoje]);

  const locaisCriticos = useMemo(() => {
    const mapa = new globalThis.Map<string, number>();

    for (const item of dados.ocorrencias) {
      const chave =
        item.bairro?.trim() ||
        item.local?.trim() ||
        "Local não informado";

      mapa.set(chave, (mapa.get(chave) || 0) + 1);
    }

    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [dados.ocorrencias]);

  const tiposFrequentes = useMemo(() => {
    const mapa = new globalThis.Map<string, number>();

    for (const item of dados.ocorrencias) {
      const chave = item.tipo?.trim() || "Não informado";
      mapa.set(chave, (mapa.get(chave) || 0) + 1);
    }

    return Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [dados.ocorrencias]);

  return (
    <ProtecaoModulo modulo="estatisticas">
      <main className="min-h-screen bg-[#020817] px-4 py-4 text-white md:px-6 md:py-6">
        <div className="mx-auto w-full max-w-[1800px] space-y-5">
          <header className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,.10),transparent_30%),linear-gradient(135deg,#07182f,#020817)] p-6 shadow-[0_30px_80px_rgba(0,0,0,.35)] md:p-8">
            <div className="absolute right-8 top-8 hidden h-28 w-28 rounded-full border border-cyan-300/10 xl:block" />
            <div className="absolute right-14 top-14 hidden h-16 w-16 rounded-full border border-cyan-300/10 xl:block" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-cyan-200">
                  <Brain className="h-4 w-4" />
                  Inteligência operacional avançada
                </div>

                <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] md:text-6xl">
                  Central de Inteligência
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                  {municipioNome} • leitura estratégica de ocorrências, risco territorial,
                  patrulhamento, equipes e indicadores para apoio à decisão do comando.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href="/sistema/sigia" className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-400 px-5 font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300">
                  <Brain className="h-5 w-5" />
                  Abrir SIGIA
                </Link>

                <button
                  type="button"
                  onClick={() => void carregar()}
                  disabled={carregando}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.05] px-5 font-black text-white transition hover:border-cyan-400/25 hover:bg-cyan-400/[.06] disabled:opacity-60"
                >
                  <RefreshCw className={`h-5 w-5 ${carregando ? "animate-spin" : ""}`} />
                  Atualizar
                </button>
              </div>
            </div>
          </header>

          {erro ? <div className="rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">{erro}</div> : null}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <IndicadorCompacto titulo="Ocorrências hoje" valor={metricas.ocorrenciasHoje} detalhe="Registros do dia" icone={Activity} tom="cyan" />
            <IndicadorCompacto titulo="Ocorrências abertas" valor={metricas.ocorrenciasAbertas} detalhe="Aguardando conclusão" icone={AlertTriangle} tom="rose" />
            <IndicadorCompacto titulo="Localizações online" valor={metricas.localizacoesOnline} detalhe="Posições recebidas" icone={MapPinned} tom="emerald" />
            <IndicadorCompacto titulo="Patrulhamentos ativos" valor={metricas.patrulhamentosAtivos} detalhe="Ativos ou pausados" icone={Activity} tom="blue" />
            <IndicadorCompacto titulo="Equipes monitoradas" valor={metricas.equipesAtivas} detalhe="Equipes identificadas" icone={Target} tom="amber" />
            <IndicadorCompacto titulo="Bairros monitorados" valor={metricas.bairrosMonitorados} detalhe="Base recente" icone={Map} tom="slate" />
          </section>

          {carregando ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-white/10 bg-[#071225]">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">Carregando dados de inteligência...</p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-5 2xl:grid-cols-[minmax(0,1.4fr)_420px]">
                <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,rgba(8,24,46,.98),rgba(3,12,27,.98))] p-5 shadow-2xl shadow-black/20">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200">
                        <Target className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Leitura territorial</p>
                        <h2 className="mt-1 text-xl font-black">Mapa de risco operacional</h2>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href="/sistema/mancha-criminal" className="rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-black text-slate-200 transition hover:border-cyan-400/25">Mancha criminal</Link>
                      <Link href="/sistema/mapa-operacional" className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200 transition hover:bg-cyan-400/15">Abrir mapa</Link>
                    </div>
                  </div>

                  <div className="mt-5 grid min-h-[430px] gap-4 lg:grid-cols-[1.1fr_.9fr]">
                    <div className="relative overflow-hidden rounded-[24px] border border-cyan-400/15 bg-[radial-gradient(circle_at_center,rgba(34,211,238,.12),transparent_38%),linear-gradient(145deg,#07192f,#020817)] p-5">
                      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,.08)_1px,transparent_1px)] [background-size:32px_32px]" />
                      <div className="relative flex h-full min-h-[390px] flex-col justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Situação analítica</p>
                          <h3 className="mt-2 text-3xl font-black tracking-[-0.04em]">{metricas.ocorrenciasAbertas > 0 ? "Atenção necessária" : "Cenário estável"}</h3>
                          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                            Cruzamento dos registros recentes, áreas de incidência e atividade operacional do município.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <ResumoAnalitico titulo="Abertas" valor={metricas.ocorrenciasAbertas} />
                          <ResumoAnalitico titulo="Patrulhas" valor={metricas.patrulhamentosAtivos} />
                          <ResumoAnalitico titulo="Equipes" valor={metricas.equipesAtivas} />
                          <ResumoAnalitico titulo="Bairros" valor={metricas.bairrosMonitorados} />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      <Ranking titulo="Locais com maior incidência" subtitulo="Concentração na base recente" itens={locaisCriticos} icone={MapPinned} tom="cyan" />
                      <Ranking titulo="Naturezas mais frequentes" subtitulo="Tipos com maior número de registros" itens={tiposFrequentes} icone={BarChart3} tom="blue" />
                    </div>
                  </div>
                </div>

                <aside className="space-y-4">
                  <PainelAlerta
                    titulo="Prioridade do comando"
                    status={metricas.ocorrenciasAbertas > 0 ? "Atenção operacional" : "Operação estável"}
                    descricao={metricas.ocorrenciasAbertas > 0 ? `${metricas.ocorrenciasAbertas} ocorrência(s) ainda exigem acompanhamento.` : "Nenhuma sobrecarga operacional identificada."}
                    critico={metricas.ocorrenciasAbertas > 0}
                  />

                  <div className="rounded-[28px] border border-white/10 bg-[#071225] p-5">
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Acessos estratégicos</p>
                    <h2 className="mt-2 text-xl font-black">Ferramentas prioritárias</h2>

                    <div className="mt-4 space-y-2">
                      {cards.slice(0, 6).map((card) => {
                        const Icone = card.icone;
                        return (
                          <Link key={card.href} href={card.href} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-3 transition hover:border-cyan-400/25 hover:bg-cyan-400/[.05]">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-200">
                              <Icone className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-white">{card.titulo}</p>
                              <p className="truncate text-xs text-slate-500">{card.detalhe}</p>
                            </div>
                            <span className="text-slate-600 transition group-hover:text-cyan-300">→</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </aside>
              </section>

              <section>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">Ecossistema analítico</p>
                    <h2 className="mt-1 text-2xl font-black">Todos os recursos de inteligência</h2>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {cards.map((card) => {
                    const Icone = card.icone;
                    return (
                      <Link key={card.href} href={card.href} className="group rounded-[24px] border border-white/10 bg-[#071225] p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-[#091a33]">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-200">
                            <Icone className="h-5 w-5" />
                          </div>
                          <span className="text-xs font-black text-slate-600 transition group-hover:text-cyan-300">ABRIR</span>
                        </div>
                        <h3 className="mt-4 font-black text-white">{card.titulo}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{card.descricao}</p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function IndicadorCompacto({ titulo, valor, detalhe, icone: Icone, tom }: { titulo: string; valor: number; detalhe: string; icone: typeof Brain; tom: "cyan" | "rose" | "emerald" | "blue" | "amber" | "slate" }) {
  const classes = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-300",
    emerald: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    slate: "border-slate-500/20 bg-slate-500/10 text-slate-300",
  }[tom];

  return (
    <article className="rounded-[22px] border border-white/10 bg-[#071225] p-4 shadow-xl">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${classes}`}>
        <Icone className="h-5 w-5" />
      </div>
      <p className="mt-4 text-2xl font-black">{valor}</p>
      <p className="mt-1 text-[11px] font-black uppercase tracking-[.12em] text-slate-300">{titulo}</p>
      <p className="mt-1 text-xs text-slate-500">{detalhe}</p>
    </article>
  );
}

function ResumoAnalitico({ titulo, valor }: { titulo: string; valor: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/15 p-3 text-center backdrop-blur">
      <p className="text-2xl font-black text-white">{valor}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-slate-500">{titulo}</p>
    </div>
  );
}

function Ranking({ titulo, subtitulo, itens, icone: Icone, tom }: { titulo: string; subtitulo: string; itens: Array<[string, number]>; icone: typeof Brain; tom: "cyan" | "blue" }) {
  const classe = tom === "cyan" ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" : "border-blue-400/20 bg-blue-400/10 text-blue-300";
  return (
    <div className="rounded-[24px] border border-white/10 bg-[#071225] p-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${classe}`}>
          <Icone className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white">{titulo}</h3>
          <p className="text-xs text-slate-500">{subtitulo}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {itens.length === 0 ? <p className="text-sm text-slate-500">Nenhum dado identificado.</p> : itens.slice(0, 5).map(([nome, quantidade], indice) => (
          <div key={nome} className="flex items-center gap-3 rounded-xl border border-white/[.07] bg-white/[.025] px-3 py-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[.05] text-xs font-black text-slate-400">{indice + 1}</span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold text-slate-200">{nome}</p>
            <span className="text-sm font-black text-cyan-300">{quantidade}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PainelAlerta({ titulo, status, descricao, critico }: { titulo: string; status: string; descricao: string; critico: boolean }) {
  return (
    <div className={`rounded-[28px] border p-5 ${critico ? "border-amber-400/25 bg-amber-400/[.07]" : "border-emerald-400/25 bg-emerald-400/[.07]"}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${critico ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"}`}>
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">{titulo}</p>
          <h2 className={`mt-1 text-xl font-black ${critico ? "text-amber-200" : "text-emerald-200"}`}>{status}</h2>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-400">{descricao}</p>
    </div>
  );
}
