"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BellRing,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Gauge,
  MapPinned,
  PhoneCall,
  Radio,
  RefreshCw,
  ShieldCheck,
  Siren,
  TrendingUp,
  UsersRound,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type ResumoCentral = {
  municipio_id: number;
  ocorrencias_total: number;
  chamados_total: number;
  guarnicoes_total: number;
  viaturas_total: number;
  alertas_total: number;
  atualizado_em: string;
};

type RegistroGenerico = Record<string, unknown>;

type Indicador = {
  titulo: string;
  valor: number;
  descricao: string;
  icone: LucideIcon;
  href: string;
  destaque: "cyan" | "amber" | "emerald" | "blue" | "rose";
};

const obterTexto = (
  registro: RegistroGenerico,
  campos: string[],
  padrao = "Não informado",
): string => {
  for (const campo of campos) {
    const valor = registro[campo];

    if (typeof valor === "string" && valor.trim()) {
      return valor.trim();
    }

    if (typeof valor === "number") {
      return String(valor);
    }
  }

  return padrao;
};

const normalizarNumero = (valor: unknown): number => {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : 0;
};

const formatarData = (valor: unknown): string => {
  if (typeof valor !== "string" || !valor) return "Agora";

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(data);
};

const obterPrioridade = (registro: RegistroGenerico): string =>
  obterTexto(
    registro,
    ["prioridade", "nivel", "gravidade", "nivel_alerta", "criticidade"],
    "NORMAL",
  ).toUpperCase();

const obterStatus = (registro: RegistroGenerico): string =>
  obterTexto(
    registro,
    ["status", "situacao", "estado", "andamento"],
    "REGISTRADO",
  ).toUpperCase();

const classePrioridade = (prioridade: string): string => {
  if (
    prioridade.includes("URGENTE") ||
    prioridade.includes("CRITIC") ||
    prioridade.includes("ALTO")
  ) {
    return "border-rose-400/30 bg-rose-400/10 text-rose-300";
  }

  if (
    prioridade.includes("MEDIA") ||
    prioridade.includes("MÉDIA") ||
    prioridade.includes("ATENCAO") ||
    prioridade.includes("ATENÇÃO")
  ) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  }

  return "border-cyan-400/25 bg-cyan-400/10 text-cyan-300";
};

const classeStatus = (status: string): string => {
  if (
    status.includes("CONCLUID") ||
    status.includes("FINALIZ") ||
    status.includes("ENCERRAD")
  ) {
    return "bg-emerald-400";
  }

  if (
    status.includes("ABERTO") ||
    status.includes("PENDENTE") ||
    status.includes("AGUARD")
  ) {
    return "bg-amber-400";
  }

  if (
    status.includes("CANCEL") ||
    status.includes("RECUS")
  ) {
    return "bg-rose-400";
  }

  return "bg-cyan-400";
};

export default function CentralComandoOperacional() {
  const [resumo, setResumo] = useState<ResumoCentral | null>(null);
  const [chamados, setChamados] = useState<RegistroGenerico[]>([]);
  const [alertas, setAlertas] = useState<RegistroGenerico[]>([]);
  const [ocorrencias, setOcorrencias] = useState<RegistroGenerico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const carregarPainel = useCallback(async (silencioso = false) => {
    if (!silencioso) setCarregando(true);
    setErro("");

    const [
      resumoResposta,
      chamadosResposta,
      alertasResposta,
      ocorrenciasResposta,
    ] = await Promise.all([
      supabase
        .from("vw_central_comando_resumo")
        .select("*")
        .limit(1)
        .maybeSingle(),

      supabase
        .from("chamados")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),

      supabase
        .from("alertas_operacionais")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),

      supabase
        .from("ocorrencias")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const primeiraFalha = [
      resumoResposta.error,
      chamadosResposta.error,
      alertasResposta.error,
      ocorrenciasResposta.error,
    ].find(Boolean);

    if (primeiraFalha) {
      setErro(primeiraFalha.message);
    }

    if (resumoResposta.data) {
      setResumo({
        municipio_id: normalizarNumero(
          resumoResposta.data.municipio_id,
        ),
        ocorrencias_total: normalizarNumero(
          resumoResposta.data.ocorrencias_total,
        ),
        chamados_total: normalizarNumero(
          resumoResposta.data.chamados_total,
        ),
        guarnicoes_total: normalizarNumero(
          resumoResposta.data.guarnicoes_total,
        ),
        viaturas_total: normalizarNumero(
          resumoResposta.data.viaturas_total,
        ),
        alertas_total: normalizarNumero(
          resumoResposta.data.alertas_total,
        ),
        atualizado_em: String(
          resumoResposta.data.atualizado_em ??
            new Date().toISOString(),
        ),
      });
    }

    setChamados(
      (chamadosResposta.data ?? []) as RegistroGenerico[],
    );
    setAlertas(
      (alertasResposta.data ?? []) as RegistroGenerico[],
    );
    setOcorrencias(
      (ocorrenciasResposta.data ?? []) as RegistroGenerico[],
    );
    setAtualizadoEm(new Date());
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregarPainel();

    const intervalo = window.setInterval(() => {
      void carregarPainel(true);
    }, 30000);

    const canal = supabase
      .channel("central-comando-operacional")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "ocorrencias",
        },
        () => void carregarPainel(true),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chamados",
        },
        () => void carregarPainel(true),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "alertas_operacionais",
        },
        () => void carregarPainel(true),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "guarnicoes",
        },
        () => void carregarPainel(true),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "viaturas",
        },
        () => void carregarPainel(true),
      )
      .subscribe();

    return () => {
      window.clearInterval(intervalo);
      void supabase.removeChannel(canal);
    };
  }, [carregarPainel]);

  const indicadores = useMemo<Indicador[]>(
    () => [
      {
        titulo: "Ocorrências",
        valor: resumo?.ocorrencias_total ?? 0,
        descricao: "Registros no município",
        icone: Siren,
        href: "/sistema/central-ocorrencias",
        destaque: "rose",
      },
      {
        titulo: "Chamados",
        valor: resumo?.chamados_total ?? 0,
        descricao: "Demandas operacionais",
        icone: PhoneCall,
        href: "/sistema/chamados",
        destaque: "amber",
      },
      {
        titulo: "Guarnições",
        valor: resumo?.guarnicoes_total ?? 0,
        descricao: "Equipes disponíveis",
        icone: UsersRound,
        href: "/sistema/guarnicoes",
        destaque: "emerald",
      },
      {
        titulo: "Viaturas",
        valor: resumo?.viaturas_total ?? 0,
        descricao: "Frota monitorada",
        icone: CarFront,
        href: "/sistema/frota",
        destaque: "blue",
      },
      {
        titulo: "Alertas",
        valor: resumo?.alertas_total ?? 0,
        descricao: "Atenção do comando",
        icone: BellRing,
        href: "/sistema/notificacoes",
        destaque: "cyan",
      },
    ],
    [resumo],
  );

  const alertasCriticos = useMemo(
    () =>
      alertas.filter((registro) => {
        const prioridade = obterPrioridade(registro);
        return (
          prioridade.includes("URGENTE") ||
          prioridade.includes("CRITIC") ||
          prioridade.includes("ALTO")
        );
      }).length,
    [alertas],
  );

  const ocorrenciasAbertas = useMemo(
    () =>
      ocorrencias.filter((registro) => {
        const status = obterStatus(registro);
        return !(
          status.includes("CONCLUID") ||
          status.includes("FINALIZ") ||
          status.includes("ENCERRAD") ||
          status.includes("CANCEL")
        );
      }).length,
    [ocorrencias],
  );

  const chamadosPendentes = useMemo(
    () =>
      chamados.filter((registro) => {
        const status = obterStatus(registro);
        return !(
          status.includes("CONCLUID") ||
          status.includes("FINALIZ") ||
          status.includes("ENCERRAD") ||
          status.includes("CANCEL")
        );
      }).length,
    [chamados],
  );

  const nivelOperacional = useMemo(() => {
    const pontos =
      alertasCriticos * 3 +
      ocorrenciasAbertas * 2 +
      chamadosPendentes;

    if (pontos >= 15) {
      return {
        titulo: "Atenção elevada",
        descricao:
          "Há volume relevante de eventos pendentes.",
        classe:
          "border-rose-400/30 bg-rose-400/10 text-rose-200",
        ponto: "bg-rose-400",
      };
    }

    if (pontos >= 6) {
      return {
        titulo: "Operação moderada",
        descricao:
          "Acompanhe chamados e ocorrências em andamento.",
        classe:
          "border-amber-400/30 bg-amber-400/10 text-amber-200",
        ponto: "bg-amber-400",
      };
    }

    return {
      titulo: "Operação estável",
      descricao:
        "Nenhuma sobrecarga operacional identificada.",
      classe:
        "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
      ponto: "bg-emerald-400",
    };
  }, [
    alertasCriticos,
    chamadosPendentes,
    ocorrenciasAbertas,
  ]);

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-5 text-white lg:px-7">
      <div className="mx-auto w-full max-w-[1800px] space-y-5">
        <header className="relative overflow-hidden rounded-[34px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.10),transparent_36%),linear-gradient(135deg,#081a34,#020817)] p-5 shadow-2xl shadow-black/30 lg:p-8">
          <div className="absolute right-8 top-8 hidden h-24 w-24 rounded-full border border-cyan-400/10 xl:block" />
          <div className="absolute right-14 top-14 hidden h-12 w-12 rounded-full border border-cyan-400/15 xl:block" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-black tracking-[0.18em] text-emerald-300">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                CENTRAL CONECTADA
              </div>

              <h1 className="text-3xl font-black tracking-[-0.04em] lg:text-5xl">
                Centro de Comando
              </h1>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 lg:text-base">
                Visão operacional integrada do município,
                com monitoramento de ocorrências, chamados,
                equipes, viaturas e alertas em tempo real.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                  Última atualização
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm font-black text-slate-100">
                  <Clock3 className="h-4 w-4 text-cyan-300" />
                  {atualizadoEm
                    ? atualizadoEm.toLocaleTimeString(
                        "pt-BR",
                      )
                    : "Carregando"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void carregarPainel()}
                disabled={carregando}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-cyan-300/30 bg-cyan-400 px-5 font-black text-[#03111f] shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-5 w-5 ${
                    carregando ? "animate-spin" : ""
                  }`}
                />
                Atualizar painel
              </button>
            </div>
          </div>
        </header>

        {erro ? (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-black">
                Falha ao atualizar parte do painel
              </p>
              <p className="mt-1 text-rose-200/80">
                {erro}
              </p>
            </div>
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className={`rounded-3xl border p-5 ${nivelOperacional.classe}`}>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-current/20 bg-black/10">
                  <Gauge className="h-7 w-7" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${nivelOperacional.ponto}`} />
                    <p className="text-xs font-black uppercase tracking-[0.18em]">
                      Situação operacional
                    </p>
                  </div>

                  <h2 className="mt-2 text-2xl font-black">
                    {nivelOperacional.titulo}
                  </h2>

                  <p className="mt-1 text-sm opacity-75">
                    {nivelOperacional.descricao}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <MiniNumero
                  valor={ocorrenciasAbertas}
                  titulo="Ocorrências"
                />
                <MiniNumero
                  valor={chamadosPendentes}
                  titulo="Chamados"
                />
                <MiniNumero
                  valor={alertasCriticos}
                  titulo="Críticos"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#071225] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  Acesso imediato
                </p>
                <h2 className="mt-1 text-xl font-black">
                  Ações do comando
                </h2>
              </div>
              <Zap className="h-6 w-6 text-cyan-300" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <AcaoRapida
                href="/sistema/ocorrencias/nova"
                titulo="Nova ocorrência"
                icone={Siren}
              />
              <AcaoRapida
                href="/sistema/chamados"
                titulo="Novo chamado"
                icone={PhoneCall}
              />
              <AcaoRapida
                href="/sistema/mapa-operacional"
                titulo="Abrir mapa"
                icone={MapPinned}
              />
              <AcaoRapida
                href="/sistema/notificacoes"
                titulo="Ver alertas"
                icone={BellRing}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {indicadores.map((item) => (
            <IndicadorCard
              key={item.titulo}
              indicador={item}
              carregando={carregando && !resumo}
            />
          ))}
        </section>

        <section className="grid gap-5 2xl:grid-cols-[1.15fr_1fr]">
          <PainelPrincipal
            titulo="Alertas prioritários"
            subtitulo="Eventos que exigem atenção do comando"
            href="/sistema/notificacoes"
            icone={ShieldCheck}
            registros={alertas}
            tipo="alerta"
            obterTitulo={(registro) =>
              obterTexto(
                registro,
                ["titulo", "tipo", "categoria"],
                "Alerta operacional",
              )
            }
            obterDescricao={(registro) =>
              obterTexto(registro, [
                "mensagem",
                "descricao",
                "observacao",
                "detalhes",
              ])
            }
          />

          <div className="grid gap-5">
            <PainelLista
              titulo="Chamados recentes"
              subtitulo="Solicitações operacionais"
              href="/sistema/chamados"
              icone={Radio}
              registros={chamados}
              obterTitulo={(registro) =>
                obterTexto(
                  registro,
                  [
                    "protocolo",
                    "tipo",
                    "natureza",
                    "titulo",
                  ],
                  "Chamado",
                )
              }
              obterDescricao={(registro) =>
                obterTexto(registro, [
                  "endereco",
                  "local",
                  "descricao",
                  "solicitante_nome",
                ])
              }
            />

            <PainelLista
              titulo="Ocorrências recentes"
              subtitulo="Registros mais novos"
              href="/sistema/central-ocorrencias"
              icone={Siren}
              registros={ocorrencias}
              obterTitulo={(registro) =>
                obterTexto(
                  registro,
                  [
                    "protocolo",
                    "numero",
                    "tipo",
                    "natureza",
                  ],
                  "Ocorrência",
                )
              }
              obterDescricao={(registro) =>
                obterTexto(registro, [
                  "endereco",
                  "local",
                  "bairro",
                  "descricao",
                ])
              }
            />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Navegação operacional
              </p>
              <h2 className="mt-1 text-xl font-black">
                Áreas estratégicas
              </h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Atalho
              href="/sistema/mapa-operacional"
              titulo="Mapa operacional"
              descricao="Equipes, ocorrências e pontos críticos"
              icone={MapPinned}
            />
            <Atalho
              href="/sistema/patrulhamento"
              titulo="Patrulhamento"
              descricao="Rotas e atividade das guarnições"
              icone={Radio}
            />
            <Atalho
              href="/sistema/escalas"
              titulo="Escalas e plantões"
              descricao="Efetivo disponível no serviço"
              icone={UsersRound}
            />
            <Atalho
              href="/sistema/central-relatorios"
              titulo="Relatórios gerenciais"
              descricao="Indicadores para tomada de decisão"
              icone={TrendingUp}
            />
          </div>
        </section>
      </div>
    </main>
  );
}

function IndicadorCard({
  indicador,
  carregando,
}: {
  indicador: Indicador;
  carregando: boolean;
}) {
  const Icone = indicador.icone;

  const classes = {
    cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    emerald:
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    blue: "border-blue-400/20 bg-blue-400/10 text-blue-300",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  }[indicador.destaque];

  return (
    <Link
      href={indicador.href}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#071225] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-[#091a33]"
    >
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-cyan-400/[0.035]" />

      <div className="relative flex items-start justify-between">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${classes}`}>
          <Icone className="h-6 w-6" />
        </div>

        <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-300" />
      </div>

      <p className="relative mt-5 text-3xl font-black tracking-tight">
        {carregando ? "—" : indicador.valor}
      </p>

      <p className="relative mt-1 font-black text-slate-100">
        {indicador.titulo}
      </p>

      <p className="relative mt-1 text-xs text-slate-500">
        {indicador.descricao}
      </p>
    </Link>
  );
}

function MiniNumero({
  valor,
  titulo,
}: {
  valor: number;
  titulo: string;
}) {
  return (
    <div className="rounded-2xl border border-current/15 bg-black/10 px-3 py-3 text-center">
      <p className="text-xl font-black">{valor}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-wider opacity-65">
        {titulo}
      </p>
    </div>
  );
}

function AcaoRapida({
  href,
  titulo,
  icone: Icone,
}: {
  href: string;
  titulo: string;
  icone: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020817] p-3 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.05]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>

      <p className="text-sm font-black text-slate-200">
        {titulo}
      </p>
    </Link>
  );
}

type PainelBaseProps = {
  titulo: string;
  subtitulo: string;
  href: string;
  icone: LucideIcon;
  registros: RegistroGenerico[];
  obterTitulo: (registro: RegistroGenerico) => string;
  obterDescricao: (registro: RegistroGenerico) => string;
};

function PainelPrincipal({
  titulo,
  subtitulo,
  href,
  icone: Icone,
  registros,
  obterTitulo,
  obterDescricao,
}: PainelBaseProps & { tipo: "alerta" }) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#071225]">
      <div className="flex items-center justify-between border-b border-white/10 bg-[linear-gradient(135deg,rgba(244,63,94,0.08),transparent)] p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 text-rose-300">
            <Icone className="h-6 w-6" />
          </div>

          <div>
            <h2 className="font-black">{titulo}</h2>
            <p className="text-xs text-slate-500">
              {subtitulo}
            </p>
          </div>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-black text-cyan-300"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-white/[0.07]">
        {registros.length === 0 ? (
          <EstadoVazio />
        ) : (
          registros.map((registro, indice) => {
            const prioridade = obterPrioridade(registro);
            const status = obterStatus(registro);

            return (
              <div
                key={String(registro.id ?? indice)}
                className="p-4 transition hover:bg-white/[0.025]"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${classeStatus(status)}`} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-black text-slate-100">
                        {obterTitulo(registro)}
                      </p>

                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase ${classePrioridade(prioridade)}`}>
                        {prioridade}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                      {obterDescricao(registro)}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {status}
                      </span>

                      <span className="text-[10px] font-bold text-slate-500">
                        {formatarData(
                          registro.created_at ??
                            registro.criado_em ??
                            registro.data ??
                            registro.data_hora,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function PainelLista({
  titulo,
  subtitulo,
  href,
  icone: Icone,
  registros,
  obterTitulo,
  obterDescricao,
}: PainelBaseProps) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#071225]">
      <div className="flex items-center justify-between border-b border-white/10 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
            <Icone className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-black">{titulo}</h2>
            <p className="text-xs text-slate-500">
              {subtitulo}
            </p>
          </div>
        </div>

        <Link
          href={href}
          className="inline-flex items-center gap-1 text-xs font-black text-cyan-300"
        >
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="divide-y divide-white/[0.07]">
        {registros.length === 0 ? (
          <EstadoVazio />
        ) : (
          registros.slice(0, 4).map((registro, indice) => {
            const status = obterStatus(registro);

            return (
              <div
                key={String(registro.id ?? indice)}
                className="p-4 transition hover:bg-white/[0.025]"
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${classeStatus(status)}`} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="truncate text-sm font-black text-slate-100">
                        {obterTitulo(registro)}
                      </p>

                      <span className="shrink-0 text-[10px] font-bold text-slate-500">
                        {formatarData(
                          registro.created_at ??
                            registro.criado_em ??
                            registro.data ??
                            registro.data_hora,
                        )}
                      </span>
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {obterDescricao(registro)}
                    </p>

                    <p className="mt-2 text-[9px] font-black uppercase tracking-wider text-slate-600">
                      {status}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </article>
  );
}

function EstadoVazio() {
  return (
    <div className="p-8 text-center">
      <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
      <p className="mt-3 font-bold text-slate-300">
        Nenhum registro recente
      </p>
      <p className="mt-1 text-xs text-slate-600">
        A situação operacional está estável.
      </p>
    </div>
  );
}

function Atalho({
  href,
  titulo,
  descricao,
  icone: Icone,
}: {
  href: string;
  titulo: string;
  descricao: string;
  icone: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-3xl border border-white/10 bg-[#071225] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-[#091a33]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
        <Icone className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-black text-slate-100">
          {titulo}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {descricao}
        </p>
      </div>

      <ExternalLink className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-300" />
    </Link>
  );
}
