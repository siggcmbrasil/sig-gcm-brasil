"use client";

import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock3,
  FileSearch,
  FileText,
  MapPinned,
  PackageSearch,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  id?: string | number;
  perfil?: string;
  municipio_id?: number;
};

type Ocorrencia = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  bairro: string | null;
  data: string | null;
  hora: string | null;
  status: string | null;
};

type FiltroStatus =
  | "TODAS"
  | "PENDENTES"
  | "FINALIZADAS"
  | "HOJE";

const cards = [
  {
    titulo: "Consultar Ocorrências",
    href: "/sistema/ocorrencias",
    descricao:
      "Pesquisar, filtrar e acompanhar todos os registros operacionais.",
    icone: FileSearch,
    detalhe: "Abrir listagem",
  },
  {
    titulo: "Nova Ocorrência",
    href: "/sistema/ocorrencias/nova",
    descricao:
      "Registrar ocorrência completa com envolvidos, veículos, objetos e equipe.",
    icone: PlusCircle,
    detalhe: "Iniciar registro",
  },
  {
    titulo: "Ocorrência Expressa",
    href: "/sistema/ocorrencias/expressa",
    descricao:
      "Registro rápido para atendimento em campo, com localização e anexos.",
    icone: Zap,
    detalhe: "Registrar rapidamente",
  },
  {
    titulo: "Mapa de Ocorrências",
    href: "/sistema/mapa-operacional",
    descricao:
      "Visualizar ocorrências e pontos operacionais no mapa integrado.",
    icone: MapPinned,
    detalhe: "Abrir mapa",
  },
  {
    titulo: "Objetos Relacionados",
    href: "/sistema/ocorrencias/objetos",
    descricao:
      "Consultar objetos apreendidos, localizados, entregues ou vinculados.",
    icone: PackageSearch,
    detalhe: "Consultar objetos",
  },
  {
    titulo: "Relatórios",
    href: "/sistema/ocorrencias/relatorios",
    descricao:
      "Emitir relatórios operacionais por período, tipo, situação e localização.",
    icone: FileText,
    detalhe: "Gerar relatório",
  },
  {
    titulo: "Análise de Ocorrências",
    href: "/sistema/analise-ocorrencias",
    descricao:
      "Identificar tendências, recorrências, horários e locais críticos.",
    icone: BarChart3,
    detalhe: "Abrir análise",
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

function statusNormalizado(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function statusFinalizado(valor: unknown) {
  return [
    "FINALIZADA",
    "FINALIZADO",
    "ENCERRADA",
    "ENCERRADO",
    "ARQUIVADA",
    "ARQUIVADO",
  ].includes(statusNormalizado(valor));
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

function formatarData(valor: string | null) {
  if (!valor) return "-";

  const [ano, mes, dia] = valor.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : valor;
}

export default function CentralOcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [municipioNome, setMunicipioNome] = useState("");
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroStatus>("TODAS");

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

      const [municipioResposta, ocorrenciasResposta] =
        await Promise.all([
          supabase
            .from("municipios")
            .select("nome")
            .eq("id", municipioId)
            .maybeSingle(),

          supabase
            .from("ocorrencias")
            .select(
              "id,protocolo,tipo,local,bairro,data,hora,status"
            )
            .eq("municipio_id", municipioId)
            .order("id", { ascending: false })
            .limit(200),
        ]);

      if (municipioResposta.error) {
        console.error(
          "Erro ao carregar município:",
          municipioResposta.error
        );
      }

      if (ocorrenciasResposta.error) {
        throw ocorrenciasResposta.error;
      }

      setMunicipioNome(
        String(
          municipioResposta.data?.nome ||
            contexto?.nome ||
            "Município"
        )
      );

      setOcorrencias(
        (ocorrenciasResposta.data as Ocorrencia[] | null) || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar Central de Ocorrências:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as ocorrências."
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
    const ocorrenciasHoje = ocorrencias.filter(
      (item) => item.data === hoje
    );

    const abertas = ocorrencias.filter(
      (item) => !statusFinalizado(item.status)
    );

    const finalizadasHoje = ocorrenciasHoje.filter(
      (item) => statusFinalizado(item.status)
    );

    const bairros = new Set(
      ocorrencias
        .map((item) => item.bairro?.trim())
        .filter((item): item is string => Boolean(item))
    );

    const tipos = new Set(
      ocorrencias
        .map((item) => item.tipo?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      hoje: ocorrenciasHoje.length,
      abertas: abertas.length,
      finalizadasHoje: finalizadasHoje.length,
      bairros: bairros.size,
      tipos: tipos.size,
      total: ocorrencias.length,
    };
  }, [ocorrencias, hoje]);

  const ocorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return ocorrencias.filter((item) => {
      const correspondeBusca =
        !termo ||
        [
          item.protocolo,
          item.tipo,
          item.local,
          item.bairro,
          item.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(termo);

      const correspondeFiltro =
        filtro === "TODAS" ||
        (filtro === "HOJE" && item.data === hoje) ||
        (filtro === "PENDENTES" &&
          !statusFinalizado(item.status)) ||
        (filtro === "FINALIZADAS" &&
          statusFinalizado(item.status));

      return correspondeBusca && correspondeFiltro;
    });
  }, [busca, filtro, hoje, ocorrencias]);

  const locaisCriticos = useMemo(() => {
    const contagem = new Map<string, number>();

    for (const item of ocorrencias) {
      const local =
        item.bairro?.trim() ||
        item.local?.trim() ||
        "Local não informado";

      contagem.set(local, (contagem.get(local) || 0) + 1);
    }

    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [ocorrencias]);

  return (
    <ProtecaoModulo modulo="ocorrencias">
      <main className="sig-page">
        <div className="sig-page-content">
          <SigPageHeader
            titulo="Central de Ocorrências"
            subtitulo={`${municipioNome} • Registro, acompanhamento, consulta, análise e integração operacional.`}
            detalhe="Gestão operacional"
            icone={ShieldCheck}
            acoes={
              <>
                <Link href="/sistema/ocorrencias/nova">
                  <SigButton
                    type="primary"
                    icon={PlusCircle}
                    size="sm"
                  >
                    Nova ocorrência
                  </SigButton>
                </Link>

                <Link href="/sistema/ocorrencias/expressa">
                  <SigButton
                    type="cyan"
                    icon={Zap}
                    size="sm"
                  >
                    Expressa
                  </SigButton>
                </Link>

                <SigButton
                  type="secondary"
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
            <SigStatCard
              titulo="Ocorrências hoje"
              valor={metricas.hoje}
              subtitulo="Registros do dia"
              icone={Activity}
              destaque="cyan"
            />

            <SigStatCard
              titulo="Pendentes"
              valor={metricas.abertas}
              subtitulo="Aguardando conclusão"
              icone={AlertTriangle}
              destaque="red"
            />

            <SigStatCard
              titulo="Finalizadas hoje"
              valor={metricas.finalizadasHoje}
              subtitulo="Encerradas no dia"
              icone={ShieldCheck}
              destaque="green"
            />

            <SigStatCard
              titulo="Locais identificados"
              valor={metricas.bairros}
              subtitulo="Bairros e regiões"
              icone={MapPinned}
              destaque="blue"
            />

            <SigStatCard
              titulo="Tipos registrados"
              valor={metricas.tipos}
              subtitulo="Naturezas diferentes"
              icone={BarChart3}
              destaque="amber"
            />

            <SigStatCard
              titulo="Base consultada"
              valor={metricas.total}
              subtitulo="Registros recentes"
              icone={FileSearch}
              destaque="slate"
            />
          </section>

          {carregando ? (
            <div className="sig-loading">
              <div>
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                <p className="mt-4 text-slate-400">
                  Carregando ocorrências...
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="grid gap-4 xl:grid-cols-12">
                <SigCard className="xl:col-span-8">
                  <CabecalhoSecao
                    titulo="Situação operacional"
                    subtitulo="Ocorrências mais recentes e seus status"
                    icone={Clock3}
                  />

                  <div className="mt-5 flex flex-col gap-3 lg:flex-row">
                    <div className="flex min-h-12 flex-1 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/70 px-4">
                      <Search className="h-5 w-5 text-slate-500" />
                      <input
                        value={busca}
                        onChange={(evento) =>
                          setBusca(evento.target.value)
                        }
                        placeholder="Buscar protocolo, tipo, local ou bairro..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          "TODAS",
                          "HOJE",
                          "PENDENTES",
                          "FINALIZADAS",
                        ] as FiltroStatus[]
                      ).map((opcao) => (
                        <button
                          key={opcao}
                          type="button"
                          onClick={() => setFiltro(opcao)}
                          className={`min-h-11 rounded-xl border px-4 text-xs font-black transition ${
                            filtro === opcao
                              ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                              : "border-slate-700 bg-slate-900/70 text-slate-400 hover:text-white"
                          }`}
                        >
                          {opcao}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {ocorrenciasFiltradas.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
                        Nenhuma ocorrência encontrada.
                      </div>
                    ) : (
                      ocorrenciasFiltradas
                        .slice(0, 10)
                        .map((item) => (
                          <Link
                            key={item.id}
                            href={`/sistema/ocorrencias/${item.id}`}
                            className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                          >
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="font-black text-white">
                                    {item.tipo ||
                                      "Ocorrência sem tipo"}
                                  </h3>

                                  <span
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${
                                      statusFinalizado(item.status)
                                        ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                                        : "border-amber-400/25 bg-amber-400/10 text-amber-300"
                                    }`}
                                  >
                                    {item.status || "PENDENTE"}
                                  </span>
                                </div>

                                <p className="mt-2 truncate text-sm text-slate-400">
                                  {item.local ||
                                    "Local não informado"}
                                  {item.bairro
                                    ? ` • ${item.bairro}`
                                    : ""}
                                </p>
                              </div>

                              <div className="flex shrink-0 items-center gap-4 text-xs text-slate-500">
                                <span>
                                  {formatarData(item.data)}
                                </span>
                                <span>{item.hora || "--:--"}</span>
                                <span className="font-black text-cyan-300">
                                  #
                                  {item.protocolo ||
                                    item.id}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                    )}
                  </div>

                  {ocorrenciasFiltradas.length > 10 ? (
                    <Link
                      href="/sistema/ocorrencias"
                      className="mt-5 block rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] py-3 text-center text-sm font-black text-cyan-200 transition hover:bg-cyan-400/10"
                    >
                      Ver todas as ocorrências
                    </Link>
                  ) : null}
                </SigCard>

                <div className="space-y-4 xl:col-span-4">
                  <SigCard>
                    <CabecalhoSecao
                      titulo="Locais com mais registros"
                      subtitulo="Concentração na base recente"
                      icone={MapPinned}
                    />

                    <div className="mt-5 space-y-3">
                      {locaisCriticos.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Nenhum local identificado.
                        </p>
                      ) : (
                        locaisCriticos.map(
                          ([local, quantidade], indice) => (
                            <div
                              key={local}
                              className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3"
                            >
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-sm font-black text-cyan-300">
                                {indice + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-black text-white">
                                  {local}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {quantidade} ocorrência(s)
                                </p>
                              </div>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </SigCard>

                  <SigCard destaque>
                    <CabecalhoSecao
                      titulo="Integração operacional"
                      subtitulo="Dados compartilhados entre módulos"
                      icone={ShieldCheck}
                    />

                    <div className="mt-5 space-y-3 text-sm text-slate-300">
                      <LinhaIntegracao texto="Pessoas e envolvidos vinculados à ocorrência" />
                      <LinhaIntegracao texto="Veículos e objetos consultáveis pelo histórico" />
                      <LinhaIntegracao texto="Patrulhamento, equipe e viatura relacionados" />
                      <LinhaIntegracao texto="Mapa, relatórios, estatísticas e SIGIA atualizados" />
                    </div>
                  </SigCard>
                </div>
              </section>

              <section>
                <div className="mb-4">
                  <h2 className="text-2xl font-black text-white">
                    Ações e ferramentas
                  </h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Acesse os recursos da Central de Ocorrências.
                  </p>
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
  icone: typeof ShieldCheck;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <div>
        <h2 className="font-black text-white">
          {titulo}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {subtitulo}
        </p>
      </div>
    </div>
  );
}

function LinhaIntegracao({
  texto,
}: {
  texto: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/35 p-3">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
      <span>{texto}</span>
    </div>
  );
}