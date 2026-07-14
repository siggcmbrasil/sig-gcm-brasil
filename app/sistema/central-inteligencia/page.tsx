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
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Inteligência"
            subtitulo={`${municipioNome} • Análise de dados, indicadores, mapas estratégicos e apoio à tomada de decisão.`}
            detalhe="Inteligência operacional"
            icone={Brain}
            acoes={
              <>
                <Link href="/sistema/sigia">
                  <SigButton
                    type="primary"
                    icon={Brain}
                    size="sm"
                  >
                    Abrir SIGIA
                  </SigButton>
                </Link>

                <SigButton
                  type="cyan"
                  icon={RefreshCw}
                  size="sm"
                  loading={carregando}
                  onClick={() => void carregar()}
                >
                  Atualizar
                </SigButton>
              </>
            }
          />

          {erro ? <div className="sig-error">{erro}</div> : null}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <SigStatCard titulo="Ocorrências hoje" valor={metricas.ocorrenciasHoje} subtitulo="Registros do dia" icone={Activity} destaque="cyan" />
            <SigStatCard titulo="Ocorrências abertas" valor={metricas.ocorrenciasAbertas} subtitulo="Aguardando conclusão" icone={AlertTriangle} destaque="red" />
            <SigStatCard titulo="Localizações online" valor={metricas.localizacoesOnline} subtitulo="Posições recebidas" icone={MapPinned} destaque="green" />
            <SigStatCard titulo="Patrulhamentos ativos" valor={metricas.patrulhamentosAtivos} subtitulo="Ativos ou pausados" icone={Activity} destaque="blue" />
            <SigStatCard titulo="Equipes monitoradas" valor={metricas.equipesAtivas} subtitulo="Equipes identificadas" icone={Target} destaque="amber" />
            <SigStatCard titulo="Bairros monitorados" valor={metricas.bairrosMonitorados} subtitulo="Base recente" icone={Map} destaque="slate" />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">Carregando dados de inteligência...</p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-6">
                  <CabecalhoSecao titulo="Locais com maior incidência" subtitulo="Concentração na base recente" icone={MapPinned} />
                  <div className="mt-5 space-y-3">
                    {locaisCriticos.length === 0 ? (
                      <p className="text-sm text-slate-500">Nenhum local identificado.</p>
                    ) : (
                      locaisCriticos.map(([local, quantidade], indice) => (
                        <div key={local} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] font-black text-cyan-300">{indice + 1}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-black text-white">{local}</p>
                            <p className="mt-1 text-sm text-slate-500">{quantidade} ocorrência(s)</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SigCard>

                <SigCard className="xl:col-span-6">
                  <CabecalhoSecao titulo="Naturezas mais frequentes" subtitulo="Tipos com maior número de registros" icone={BarChart3} />
                  <div className="mt-5 space-y-3">
                    {tiposFrequentes.length === 0 ? (
                      <p className="text-sm text-slate-500">Nenhum tipo identificado.</p>
                    ) : (
                      tiposFrequentes.map(([tipo, quantidade], indice) => (
                        <div key={tipo} className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/[0.07] font-black text-blue-300">{indice + 1}</div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-black text-white">{tipo}</p>
                            <p className="mt-1 text-sm text-slate-500">{quantidade} ocorrência(s)</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </SigCard>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">Ferramentas de Inteligência</h2>
                  <p className="mt-1 text-sm text-slate-400">Acesse os recursos analíticos e operacionais.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {cards.map((card) => (
                    <SigActionCard
                      key={card.href}
                      titulo={card.titulo}
                      descricao={card.descricao}
                      href={card.href}
                      icone={card.icone}
                      detalhe={card.detalhe}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </ProtecaoModulo>
  );
}

function CabecalhoSecao({
  titulo,
  subtitulo,
  icone: Icone,
}: {
  titulo: string;
  subtitulo: string;
  icone: typeof Brain;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-black text-white">{titulo}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitulo}</p>
      </div>
    </div>
  );
}
