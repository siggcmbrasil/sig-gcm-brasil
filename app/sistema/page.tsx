"use client";

import "./dashboard-equilibrado.css";

import "./dashboard-hierarquia.css";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronRight,
  Clock3,
  MapPin,
  Megaphone,
  PhoneCall,
  RefreshCw,
  Shield,
  Users,
  Radio,
  ArrowUpRight,
  LayoutDashboard,
} from "lucide-react";

import CardNoticiasClima from "@/components/dashboard/CardNoticiasClima";
import SigButton from "@/components/sig/SigButton";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigStatCard from "@/components/sig/SigStatCard";
import TelaMobile from "@/components/TelaMobile";
import { registrarAuditoria } from "@/lib/auditoria";
import {
  lerMunicipioContextoLocal,
  obterMunicipioIdEfetivo,
} from "@/lib/contextoMunicipio";
import { supabase } from "@/lib/supabase";

const MapaOperacional = dynamic(
  () => import("@/components/MapaOperacional"),
  { ssr: false }
);

type UsuarioLocal = {
  id: string | number;
  nome: string;
  email?: string;
  perfil: string;
  municipio_id?: number;
};

type Municipio = {
  id: number;
  nome: string;
  estado: string;
  brasao: string | null;
  cor_principal: string | null;
  ativo: boolean;
};

type Ocorrencia = {
  id: number;
  protocolo: string | null;
  tipo: string | null;
  local: string | null;
  bairro?: string | null;
  data?: string | null;
  hora?: string | null;
  status: string | null;
  local_id?: number | null;
  locais?: {
    id: number;
    nome: string | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
};

type Guarda = {
  id: number;
  nome: string;
  status: string | null;
  data_nascimento: string | null;
  foto_url: string | null;
};

type Viatura = {
  id: number;
  prefixo: string;
  modelo: string;
  placa: string;
  status: string | null;
  combustivel: string | null;
  quilometragem: string | null;
};

type Aviso = {
  id: number;
  titulo: string;
  descricao: string;
};

type Permuta = {
  id: number;
  status: string;
  criado_em?: string | null;
};

type EscalaHoje = {
  id: number;
  data_servico: string;
  guarda_id: number | null;
  guarda_nome: string;
  matricula: string | null;
  turno: string | null;
  equipe: string | null;
  funcao: string | null;
};

type Chamado = {
  id: number;
  status: string | null;
  tipo: string | null;
  local: string | null;
  criado_em: string | null;
};

type Atividade = {
  id: string;
  titulo: string;
  detalhe: string;
  hora: string;
  tipo: "ocorrencia" | "permuta" | "chamado";
};

type DashboardState = {
  municipio: Municipio | null;
  ocorrencias: Ocorrencia[];
  guardas: Guarda[];
  viaturas: Viatura[];
  avisos: Aviso[];
  notificacoes: Array<{
    id: number;
    titulo: string;
    mensagem: string;
    lida: boolean;
  }>;
  permutas: Permuta[];
  escalaHoje: EscalaHoje[];
  chamados: Chamado[];
  datasHoje: Array<{
    id: number;
    titulo: string;
    categoria: string | null;
  }>;
  fraseDoDia: {
    texto?: string | null;
    referencia?: string | null;
  } | null;
};

const estadoInicial: DashboardState = {
  municipio: null,
  ocorrencias: [],
  guardas: [],
  viaturas: [],
  avisos: [],
  notificacoes: [],
  permutas: [],
  escalaHoje: [],
  chamados: [],
  datasHoje: [],
  fraseDoDia: null,
};

function dataLocalBahia() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bahia",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function obterUsuarioLogado(): UsuarioLocal | null {
  if (typeof window === "undefined") return null;

  try {
    const salvo = localStorage.getItem("usuarioLogado");
    if (!salvo) return null;

    const usuario = JSON.parse(salvo) as UsuarioLocal;
    if (!usuario?.id || !usuario?.perfil) return null;

    const contexto = lerMunicipioContextoLocal();
    const municipioId = obterMunicipioIdEfetivo({
      perfil: usuario.perfil,
      municipioIdUsuario: usuario.municipio_id,
    });

    if (!municipioId) return null;

    return {
      ...usuario,
      municipio_id: municipioId,
      nome: usuario.nome || "Usuário",
      email: usuario.email || "",
      perfil: String(usuario.perfil).toUpperCase(),
      ...(contexto?.nome ? { municipio_nome: contexto.nome } : {}),
    } as UsuarioLocal;
  } catch {
    return null;
  }
}

function statusNormalizado(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

export default function Dashboard() {
  const [dados, setDados] = useState<DashboardState>(estadoInicial);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [agora, setAgora] = useState(new Date());
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);

  const usuario = useMemo(() => obterUsuarioLogado(), []);
  const municipioId = usuario?.municipio_id;

  async function carregarDashboard(silencioso = false) {
    if (!municipioId || !usuario) {
      setErro("Município ou usuário não identificado.");
      setCarregando(false);
      return;
    }

    if (silencioso) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }
    setErro("");

    try {
      const hoje = dataLocalBahia();
      const inicioAno = new Date(new Date().getFullYear(), 0, 0);
      const diaAno = Math.floor(
        (Date.now() - inicioAno.getTime()) / 86_400_000
      );

      const [
        municipioResposta,
        ocorrenciasResposta,
        guardasResposta,
        viaturasResposta,
        avisosResposta,
        notificacoesResposta,
        permutasResposta,
        escalaResposta,
        chamadosResposta,
        datasResposta,
        fraseResposta,
      ] = await Promise.all([
        supabase
          .from("municipios")
          .select("id,nome,estado,brasao,cor_principal,ativo")
          .eq("id", municipioId)
          .maybeSingle(),

        supabase
          .from("ocorrencias")
          .select(`
            id,
            protocolo,
            tipo,
            local,
            bairro,
            data,
            hora,
            status,
            local_id,
            locais:local_id (
              id,
              nome,
              latitude,
              longitude
            )
          `)
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(50),

        supabase
          .from("guardas")
          .select("id,nome,status,data_nascimento,foto_url")
          .eq("municipio_id", municipioId),

        supabase
          .from("viaturas")
          .select(
            "id,prefixo,modelo,placa,status,combustivel,quilometragem"
          )
          .eq("municipio_id", municipioId)
          .order("prefixo")
          .limit(100),

        supabase
          .from("avisos")
          .select("id,titulo,descricao")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(10),

        supabase
          .from("notificacoes")
          .select("id,titulo,mensagem,lida,usuario_id,perfil_destino")
          .eq("municipio_id", municipioId)
          .or(
            `usuario_id.eq.${usuario.id},usuario_id.is.null,perfil_destino.eq.${usuario.perfil}`
          )
          .eq("lida", false)
          .order("id", { ascending: false })
          .limit(20),

        supabase
          .from("permutas_plantao")
          .select("id,status,criado_em")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(50),

        supabase
          .from("escalas_servico")
          .select(
            "id,data_servico,guarda_id,guarda_nome,matricula,turno,equipe,funcao"
          )
          .eq("municipio_id", municipioId)
          .eq("data_servico", hoje)
          .order("equipe")
          .order("guarda_nome"),

        supabase
          .from("chamados")
          .select("id,status,tipo,local,criado_em")
          .eq("municipio_id", municipioId)
          .order("id", { ascending: false })
          .limit(50),

        supabase
          .from("datas_comemorativas")
          .select("id,titulo,categoria")
          .eq("data_inicio", hoje)
          .eq("ativo", true),

        supabase
          .from("mensagens_dia")
          .select("texto,referencia")
          .eq("dia", diaAno)
          .maybeSingle(),
      ]);

      const erros = [
        municipioResposta.error,
        ocorrenciasResposta.error,
        guardasResposta.error,
        viaturasResposta.error,
        avisosResposta.error,
        notificacoesResposta.error,
        permutasResposta.error,
        escalaResposta.error,
        chamadosResposta.error,
        datasResposta.error,
        fraseResposta.error,
      ].filter(Boolean);

      if (erros.length > 0) {
        console.error("Falhas parciais ao carregar dashboard:", erros);
      }

      setDados({
        municipio: (municipioResposta.data as Municipio | null) || null,
        ocorrencias:
          (ocorrenciasResposta.data as Ocorrencia[] | null) || [],
        guardas: (guardasResposta.data as Guarda[] | null) || [],
        viaturas: (viaturasResposta.data as Viatura[] | null) || [],
        avisos: (avisosResposta.data as Aviso[] | null) || [],
        notificacoes:
          (notificacoesResposta.data as DashboardState["notificacoes"] | null) ||
          [],
        permutas: (permutasResposta.data as Permuta[] | null) || [],
        escalaHoje:
          (escalaResposta.data as EscalaHoje[] | null) || [],
        chamados: (chamadosResposta.data as Chamado[] | null) || [],
        datasHoje:
          (datasResposta.data as DashboardState["datasHoje"] | null) || [],
        fraseDoDia:
          (fraseResposta.data as DashboardState["fraseDoDia"]) || null,
      });
      setUltimaAtualizacao(new Date());
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o dashboard."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }

  useEffect(() => {
    if (usuario?.municipio_id) {
      void registrarAuditoria({
        modulo: "Dashboard",
        acao: "ACESSO",
        descricao: "Acessou o Centro de Comando.",
        tabela: "dashboard",
        detalhes: {
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
          perfil: usuario.perfil,
        },
      });
    }

    void carregarDashboard();

    const relogio = window.setInterval(() => {
      setAgora(new Date());
    }, 1000);

    const atualizacaoAutomatica = window.setInterval(() => {
      void carregarDashboard(true);
    }, 300_000);

    return () => {
      window.clearInterval(relogio);
      window.clearInterval(atualizacaoAutomatica);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hoje = dataLocalBahia();

  const metricas = useMemo(() => {
    const ocorrenciasHoje = dados.ocorrencias.filter(
      (item) => item.data === hoje
    );

    const ocorrenciasAbertas = dados.ocorrencias.filter((item) => {
      const status = statusNormalizado(item.status);
      return !["FINALIZADA", "ENCERRADA", "ARQUIVADA"].includes(status);
    }).length;

    const chamadosAbertos = dados.chamados.filter((item) => {
      const status = statusNormalizado(item.status);
      return !["FINALIZADO", "ENCERRADO", "CANCELADO"].includes(status);
    }).length;

    const viaturasOperacionais = dados.viaturas.filter((item) => {
      const status = statusNormalizado(item.status);
      return ["ATIVA", "EM_SERVICO", "OPERACIONAL", "DISPONIVEL"].includes(
        status
      );
    }).length;

    const permutasPendentes = dados.permutas.filter((item) =>
      ["AGUARDANDO_SUBSTITUTO", "ACEITA_PELO_SUBSTITUTO"].includes(
        statusNormalizado(item.status)
      )
    ).length;

    const equipes = new Set(
      dados.escalaHoje
        .map((item) => item.equipe?.trim())
        .filter((item): item is string => Boolean(item))
    );

    return {
      ocorrenciasHoje: ocorrenciasHoje.length,
      ocorrenciasAbertas,
      chamadosAbertos,
      viaturasOperacionais,
      permutasPendentes,
      guardasEscalados: dados.escalaHoje.length,
      equipesAtivas: equipes.size,
    };
  }, [dados, hoje]);

  const equipesHoje = useMemo(() => {
    const grupos = new Map<string, EscalaHoje[]>();

    for (const item of dados.escalaHoje) {
      const equipe = item.equipe?.trim() || "Equipe não informada";
      const atual = grupos.get(equipe) || [];
      atual.push(item);
      grupos.set(equipe, atual);
    }

    return Array.from(grupos.entries());
  }, [dados.escalaHoje]);

  const aniversariantesHoje = useMemo(() => {
    const data = new Date();
    const dia = String(data.getDate()).padStart(2, "0");
    const mes = String(data.getMonth() + 1).padStart(2, "0");

    return dados.guardas.filter((guarda) => {
      if (!guarda.data_nascimento) return false;
      const [, mesNascimento, diaNascimento] =
        guarda.data_nascimento.split("-");
      return diaNascimento === dia && mesNascimento === mes;
    });
  }, [dados.guardas]);

  const atividades = useMemo<Atividade[]>(() => {
    const ocorrencias = dados.ocorrencias.slice(0, 4).map((item) => ({
      id: `oc-${item.id}`,
      titulo: "Ocorrência registrada",
      detalhe: `${item.tipo || "Sem tipo"} • ${
        item.local || "Local não informado"
      }`,
      hora: item.hora || "--:--",
      tipo: "ocorrencia" as const,
    }));

    const permutas = dados.permutas.slice(0, 2).map((item) => ({
      id: `pe-${item.id}`,
      titulo: "Permuta atualizada",
      detalhe: statusNormalizado(item.status).replaceAll("_", " "),
      hora: item.criado_em
        ? new Date(item.criado_em).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--",
      tipo: "permuta" as const,
    }));

    const chamados = dados.chamados.slice(0, 2).map((item) => ({
      id: `ch-${item.id}`,
      titulo: "Chamado operacional",
      detalhe: `${item.tipo || "Sem tipo"} • ${
        item.local || "Local não informado"
      }`,
      hora: item.criado_em
        ? new Date(item.criado_em).toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--:--",
      tipo: "chamado" as const,
    }));

    return [...ocorrencias, ...chamados, ...permutas].slice(0, 8);
  }, [dados.chamados, dados.ocorrencias, dados.permutas]);

const ocorrenciasMapa = useMemo(
  () =>
    dados.ocorrencias.map((item) => ({
      id: item.id,
      protocolo: item.protocolo ?? undefined,
      tipo: item.tipo || "Não informado",
      local: item.local || "Local não informado",
      bairro: item.bairro ?? undefined,
      data: item.data ?? undefined,
      hora: item.hora ?? undefined,
      status: item.status || "PENDENTE",
      local_id: item.local_id ?? undefined,
      locais: item.locais
        ? {
            id: item.locais.id,
            nome: item.locais.nome ?? undefined,
            latitude: item.locais.latitude ?? undefined,
            longitude: item.locais.longitude ?? undefined,
          }
        : undefined,
    })),
  [dados.ocorrencias]
);

  const dataExtenso = agora.toLocaleDateString("pt-BR", {
    timeZone: "America/Bahia",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const horaAtual = agora.toLocaleTimeString("pt-BR", {
    timeZone: "America/Bahia",
  });

  const ultimaAtualizacaoTexto = ultimaAtualizacao
    ? ultimaAtualizacao.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  const nivelOperacional =
    metricas.ocorrenciasAbertas > 0 || metricas.chamadosAbertos > 0
      ? "ATENÇÃO OPERACIONAL"
      : "OPERAÇÃO NORMAL";

  const nivelOperacionalCritico =
    metricas.ocorrenciasAbertas > 0 || metricas.chamadosAbertos > 0;

  return (
    <>

      <style jsx global>{`
        .sig-page {
          height: auto !important;
          min-height: 100vh;
          overflow-y: visible !important;
        }

        .sig-page-content {
          overflow: visible !important;
        }

        .sig-page-content .sig-stat-card,
        .sig-page-content [data-sig-stat-card] {
          min-width: 0;
          height: 100%;
        }

        .sig-page-content .sig-stat-card h3,
        .sig-page-content [data-sig-stat-card] h3 {
          white-space: normal !important;
          overflow: visible !important;
          text-overflow: initial !important;
          line-height: 1.2 !important;
        }

        @media (max-width: 1535px) {
          .sig-page-content {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
      `}</style>
      <div className="block md:hidden">
        <TelaMobile />
      </div>

      <div className="dashboardEquilibrado hidden md:block">
        <main className="sig-page min-h-screen overflow-y-auto">
          <div className="sig-page-content mx-auto w-full max-w-[1880px] space-y-2.5 px-3 pb-5 pt-2.5 lg:px-4 2xl:px-5">
            <SigPageHeader
              titulo="Centro de Comando"
              subtitulo={`${
                dados.municipio
                  ? `${dados.municipio.nome} - ${dados.municipio.estado}`
                  : "Município não identificado"
              } • ${dataExtenso} • ${horaAtual}`}
              detalhe={`Atualizado às ${ultimaAtualizacaoTexto} • atualização automática a cada 5 minutos`}
              icone={LayoutDashboard}
              acoes={
                <>
                  <Link href="/sistema/notificacoes">
                    <SigButton
                      type="secondary"
                      icon={Bell}
                      size="sm"
                    >
                      Notificações ({dados.notificacoes.length})
                    </SigButton>
                  </Link>

                  <SigButton
                    type="cyan"
                    icon={RefreshCw}
                    size="sm"
                    loading={atualizando}
                    onClick={() => void carregarDashboard(true)}
                  >
                    Atualizar
                  </SigButton>
                </>
              }
            />

            {dados.fraseDoDia?.texto ? (
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] px-5 py-3 text-sm text-cyan-100">
                <strong>Mensagem do dia:</strong>{" "}
                {dados.fraseDoDia.texto}
                {dados.fraseDoDia.referencia
                  ? ` — ${dados.fraseDoDia.referencia}`
                  : ""}
              </div>
            ) : null}

            {erro ? <div className="sig-error">{erro}</div> : null}

            <section
              className={`dashboardSituacaoCompacta flex flex-col gap-3 rounded-2xl border px-4 py-3 xl:flex-row xl:items-center xl:justify-between ${
                nivelOperacionalCritico
                  ? "border-amber-400/25 bg-amber-400/[0.06]"
                  : "border-emerald-400/20 bg-emerald-400/[0.05]"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
                    nivelOperacionalCritico
                      ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                      : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  }`}
                >
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Situação do município
                  </p>
                  <p
                    className={`mt-1 text-lg font-black ${
                      nivelOperacionalCritico ? "text-amber-200" : "text-emerald-200"
                    }`}
                  >
                    {nivelOperacional}
                  </p>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 xl:w-auto">
                <ResumoRapido rotulo="Ocorrências" valor={metricas.ocorrenciasAbertas} />
                <ResumoRapido rotulo="Chamados" valor={metricas.chamadosAbertos} />
                <ResumoRapido rotulo="Equipes" valor={metricas.equipesAtivas} />
                <ResumoRapido rotulo="Viaturas" valor={metricas.viaturasOperacionais} />
              </div>
            </section>

            <section className="dashboardAcoesCompactas grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
              <AcaoRapida href="/sistema/central-ocorrencias" titulo="Central de ocorrências" detalhe="Consultar e registrar" icone={AlertTriangle} />
              <AcaoRapida href="/sistema/chamados" titulo="Chamados" detalhe="Atendimento operacional" icone={PhoneCall} />
              <AcaoRapida href="/sistema/mapa-operacional" titulo="Mapa operacional" detalhe="Visualização em tempo real" icone={MapPin} />
              <AcaoRapida href="/sistema/escalas" titulo="Equipes e escalas" detalhe="Efetivo de serviço" icone={Users} />
              <AcaoRapida href="/sistema/central-frota" titulo="Central de frota" detalhe="Viaturas e disponibilidade" icone={CarFront} />
            </section>

            <section className="dashboardResumoGrid grid gap-2 2xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="dashboardIndicadoresPrincipais grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <IndicadorCompacto
                  href="/sistema/escalas"
                  titulo="Equipes em serviço"
                  valor={metricas.equipesAtivas}
                  detalhe={`${metricas.guardasEscalados} guardas escalados`}
                  icone={Users}
                  destaque="green"
                />

                <IndicadorCompacto
                  href="/sistema/central-ocorrencias"
                  titulo="Ocorrências hoje"
                  valor={metricas.ocorrenciasHoje}
                  detalhe={`${metricas.ocorrenciasAbertas} pendentes`}
                  icone={AlertTriangle}
                  destaque="red"
                />

                <IndicadorCompacto
                  href="/sistema/chamados"
                  titulo="Chamados abertos"
                  valor={metricas.chamadosAbertos}
                  detalhe="Aguardando atendimento"
                  icone={PhoneCall}
                  destaque="amber"
                />

                <IndicadorCompacto
                  href="/sistema/central-frota"
                  titulo="Viaturas operacionais"
                  valor={metricas.viaturasOperacionais}
                  detalhe={`${dados.viaturas.length} cadastradas`}
                  icone={CarFront}
                  destaque="blue"
                />
              </div>

              <aside className="dashboardResumoSecundario rounded-2xl border border-slate-800 bg-[#07162b]/90 p-3">
                <div className="mb-2 flex items-center justify-between px-1">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
                      Resumo administrativo
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Informações secundárias
                    </p>
                  </div>
                  <BarChart3 className="h-5 w-5 text-cyan-300" />
                </div>

                <ResumoSecundario
                  href="/sistema/escalas/permutas"
                  titulo="Permutas pendentes"
                  valor={metricas.permutasPendentes}
                  icone={CalendarDays}
                />
                <ResumoSecundario
                  href="/sistema/comunicacao"
                  titulo="Avisos ativos"
                  valor={dados.avisos.length}
                  icone={Megaphone}
                />
                <ResumoSecundario
                  href="/sistema/estatisticas"
                  titulo="Efetivo cadastrado"
                  valor={dados.guardas.length}
                  icone={Users}
                />
              </aside>
            </section>

            {carregando ? (
              <div className="sig-loading">
                <div>
                  <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-cyan-400" />
                  <p className="mt-4 text-slate-400">
                    Carregando dados operacionais...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <section className="dashboardOperacionalGrid grid items-stretch gap-3 2xl:grid-cols-12">
                  <SigCard className="dashboardMapaCard min-w-0 2xl:col-span-7" padding="sm">
                    <CabecalhoPainel
                      titulo="Mapa operacional"
                      subtitulo="Ocorrências e pontos operacionais do município"
                      icone={MapPin}
                      acao={
                        <Link
                          href="/sistema/mapa-operacional"
                          className="text-sm font-black text-cyan-300 hover:text-cyan-200"
                        >
                          Abrir mapa completo
                        </Link>
                      }
                    />

                    <div className="dashboardMapaArea mt-2 h-[245px] min-h-[230px] overflow-hidden rounded-xl border border-slate-800 xl:h-[265px]">
                      <MapaOperacional ocorrencias={ocorrenciasMapa} />
                    </div>
                  </SigCard>

                  <div className="dashboardRail min-w-0 space-y-3 2xl:col-span-5">
                    <SigCard className="dashboardRailCard">
                      <CabecalhoPainel
                        titulo="Equipes de serviço"
                        subtitulo={`${equipesHoje.length} equipe(s) identificada(s)`}
                        icone={Shield}
                      />

                      <div className="dashboardRailScroll mt-2 space-y-1.5">
                        {equipesHoje.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            Nenhuma escala operacional cadastrada para hoje.
                          </p>
                        ) : (
                          equipesHoje.map(([equipe, membros]) => (
                            <div
                              key={equipe}
                              className="rounded-2xl border border-slate-800 bg-slate-950/45 p-3.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <strong className="text-cyan-300">
                                  {equipe}
                                </strong>
                                <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                                  EM SERVIÇO
                                </span>
                              </div>

                              <div className="mt-3 space-y-2">
                                {membros.map((membro) => (
                                  <div
                                    key={membro.id}
                                    className="flex items-center justify-between gap-3 text-sm"
                                  >
                                    <span className="truncate text-slate-300">
                                      {membro.guarda_nome}
                                    </span>
                                    <span className="shrink-0 text-xs text-slate-500">
                                      {membro.funcao || "Sem função"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </SigCard>

                    <SigCard className="dashboardRailCard">
                      <CabecalhoPainel
                        titulo="Últimas ocorrências"
                        subtitulo="Registros mais recentes"
                        icone={Activity}
                      />

                      <div className="dashboardRailScroll mt-2 space-y-1.5">
                        {dados.ocorrencias.length === 0 ? (
                          <p className="text-sm text-slate-500">
                            Nenhuma ocorrência registrada.
                          </p>
                        ) : (
                          dados.ocorrencias.slice(0, 4).map((item) => (
                            <Link
                              href={`/sistema/ocorrencias/${item.id}`}
                              key={item.id}
                              className="block rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-cyan-400/25"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate font-black text-white">
                                    {item.tipo || "Ocorrência"}
                                  </p>
                                  <p className="mt-1 truncate text-sm text-slate-400">
                                    {item.local || "Local não informado"}
                                  </p>
                                </div>

                                <span className="shrink-0 text-xs font-bold text-cyan-300">
                                  {item.hora || "--:--"}
                                </span>
                              </div>
                            </Link>
                          ))
                        )}
                      </div>
                    </SigCard>
                  </div>
                </section>

                <section className="dashboardComplementos grid items-start gap-3 xl:grid-cols-12">
                  <SigCard className="dashboardAtividade xl:col-span-8">
                    <CabecalhoPainel
                      titulo="Atividade operacional"
                      subtitulo="Últimos eventos registrados"
                      icone={Clock3}
                    />

                    <div className="mt-2 space-y-1.5">
                      {atividades.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Nenhuma atividade recente.
                        </p>
                      ) : (
                        atividades.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/35 p-3"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
                              {item.tipo === "ocorrencia" ? (
                                <AlertTriangle className="h-4 w-4" />
                              ) : item.tipo === "chamado" ? (
                                <PhoneCall className="h-4 w-4" />
                              ) : (
                                <CalendarDays className="h-4 w-4" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-white">
                                {item.titulo}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {item.detalhe}
                              </p>
                            </div>

                            <span className="shrink-0 text-xs text-slate-500">
                              {item.hora}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </SigCard>

                  <SigCard className="dashboardDatas xl:col-span-4">
                    <CabecalhoPainel
                      titulo="Datas e alertas"
                      subtitulo="Informações relevantes de hoje"
                      icone={CalendarDays}
                    />

                    <div className="mt-2 space-y-1.5">
                      {aniversariantesHoje.map((guarda) => (
                        <div
                          key={`aniv-${guarda.id}`}
                          className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.05] p-4"
                        >
                          <p className="font-black text-white">
                            Aniversário de {guarda.nome}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            Integrante do efetivo municipal
                          </p>
                        </div>
                      ))}

                      {dados.datasHoje.map((item) => (
                        <div
                          key={`data-${item.id}`}
                          className="rounded-2xl border border-slate-800 bg-slate-950/45 p-3.5"
                        >
                          <p className="font-black text-white">
                            {item.titulo}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {item.categoria || "Data institucional"}
                          </p>
                        </div>
                      ))}

                      {dados.avisos.slice(0, 3).map((aviso) => (
                        <div
                          key={`aviso-${aviso.id}`}
                          className="rounded-2xl border border-amber-400/15 bg-amber-400/[0.05] p-4"
                        >
                          <p className="font-black text-amber-200">
                            {aviso.titulo}
                          </p>
                          <p className="mt-1 text-sm text-slate-400">
                            {aviso.descricao}
                          </p>
                        </div>
                      ))}

                      {aniversariantesHoje.length === 0 &&
                      dados.datasHoje.length === 0 &&
                      dados.avisos.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                          Nenhum alerta ou data importante hoje.
                        </div>
                      ) : null}
                    </div>
                  </SigCard>
                </section>

                <SigCard padding="none" className="dashboardNoticias overflow-hidden">
                  <CardNoticiasClima />
                </SigCard>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function IndicadorCompacto({
  href,
  titulo,
  valor,
  detalhe,
  icone: Icone,
  destaque,
}: {
  href: string;
  titulo: string;
  valor: number;
  detalhe: string;
  icone: typeof Shield;
  destaque: "green" | "red" | "amber" | "blue";
}) {
  const classes = {
    green: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    red: "border-rose-400/25 bg-rose-400/10 text-rose-300",
    amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
    blue: "border-blue-400/25 bg-blue-400/10 text-blue-300",
  }[destaque];

  return (
    <Link
      href={href}
      className="dashboardIndicadorCompacto group flex min-h-[66px] items-center gap-2.5 rounded-xl border border-slate-800 bg-[#07162b]/90 px-3 py-2 transition hover:-translate-y-0.5 hover:border-cyan-400/25"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${classes}`}>
        <Icone className="h-5 w-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-black uppercase leading-tight tracking-[0.08em] text-slate-500">
          {titulo}
        </p>
        <div className="mt-1 flex items-end gap-3">
          <strong className="text-xl font-black leading-none text-white">
            {valor}
          </strong>
          <span className="min-w-0 pb-0.5 text-xs leading-tight text-slate-400">
            {detalhe}
          </span>
        </div>
      </div>

      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-cyan-300" />
    </Link>
  );
}

function ResumoSecundario({
  href,
  titulo,
  valor,
  icone: Icone,
}: {
  href: string;
  titulo: string;
  valor: number;
  icone: typeof Shield;
}) {
  return (
    <Link
      href={href}
      className="group mt-1.5 flex min-h-[38px] items-center gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-2.5 py-1.5 transition hover:border-cyan-400/25"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06] text-cyan-300">
        <Icone className="h-4 w-4" />
      </div>
      <p className="min-w-0 flex-1 text-xs font-bold text-slate-300">
        {titulo}
      </p>
      <strong className="text-base font-black text-white">{valor}</strong>
      <ChevronRight className="h-4 w-4 text-slate-600 transition group-hover:text-cyan-300" />
    </Link>
  );
}

function ResumoRapido({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="min-w-[92px] rounded-xl border border-white/10 bg-slate-950/35 px-3 py-2 text-center">
      <p className="text-xl font-black text-white">{valor}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {rotulo}
      </p>
    </div>
  );
}

function AcaoRapida({
  href,
  titulo,
  detalhe,
  icone: Icone,
}: {
  href: string;
  titulo: string;
  detalhe: string;
  icone: typeof Shield;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:-translate-y-0.5 hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
        <Icone className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black leading-tight text-white">{titulo}</p>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{detalhe}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:text-cyan-300" />
    </Link>
  );
}

function CabecalhoPainel({
  titulo,
  subtitulo,
  icone: Icone,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  icone: typeof Shield;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-800 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/[0.07] text-cyan-300">
          <Icone className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <h2 className="font-black leading-tight text-white">{titulo}</h2>
          {subtitulo ? (
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {subtitulo}
            </p>
          ) : null}
        </div>
      </div>

      {acao}
    </div>
  );
}