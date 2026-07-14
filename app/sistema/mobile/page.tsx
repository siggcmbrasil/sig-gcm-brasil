"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Car,
  ChevronRight,
  ClipboardList,
  Clock3,
  Map,
  MapPin,
  QrCode,
  RefreshCw,
  Route,
  Shield,
  ShieldAlert,
  Smartphone,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

import { Geolocation } from "@capacitor/geolocation";

import MobileActionCard from "@/components/mobile/MobileActionCard";
import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGuarnicaoCard from "@/components/mobile/MobileGuarnicaoCard";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileQuickMenu from "@/components/mobile/MobileQuickMenu";
import MobileStats from "@/components/mobile/MobileStats";

import { registrarAuditoria } from "@/lib/auditoria";
import { calcularGuarnicaoDia } from "@/lib/guarnicaoDia";
import { supabase } from "@/lib/supabase";

type UsuarioLogado = {
  id?: string | number;
  nome?: string;
  perfil?: string;
  municipio_id?: number;
  municipio_nome?: string;
};

type PatrulhamentoAtivo = {
  id: number;
  status: string | null;
  iniciado_em: string | null;
  distancia_km: number | null;
  duracao_segundos?: number | null;
};

type ChamadoRecente = {
  id: number;
  tipo: string | null;
  local: string | null;
  status: string | null;
};

type ResumoMobile = {
  ocorrencias: number;
  chamados: number;
  patrulhamentos: number;
  visitas: number;
  notificacoesNaoLidas: number;
  sosAbertos: number;
};

const perfisPermitidosMobile = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
];

const resumoInicial: ResumoMobile = {
  ocorrencias: 0,
  chamados: 0,
  patrulhamentos: 0,
  visitas: 0,
  notificacoesNaoLidas: 0,
  sosAbertos: 0,
};

function podeAcessarMobile(perfil?: string) {
  return perfil
    ? perfisPermitidosMobile.includes(perfil.toUpperCase())
    : false;
}

function pegarUsuario(): UsuarioLogado {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLogado;
  } catch {
    return {};
  }
}

function normalizar(valor: unknown) {
  return String(valor || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function formatarTempo(segundos: number) {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const resto = segundos % 60;

  return [horas, minutos, resto]
    .map((valor) => String(valor).padStart(2, "0"))
    .join(":");
}

function obterPendenciasOffline() {
  if (typeof window === "undefined") {
    return 0;
  }

  const chaves = [
    "ocorrenciasOffline",
    "ocorrencias_offline",
    "filaOffline",
    "fila_offline",
    "pendenciasOffline",
  ];

  let total = 0;

  for (const chave of chaves) {
    try {
      const salvo = localStorage.getItem(chave);

      if (!salvo) continue;

      const conteudo = JSON.parse(salvo);

      if (Array.isArray(conteudo)) {
        total += conteudo.length;
      }
    } catch {
      // Ignora entradas antigas ou inválidas.
    }
  }

  return total;
}

export default function AppPage() {
  const [usuario, setUsuario] =
    useState<UsuarioLogado | null>(null);
  const [guarnicaoDia, setGuarnicaoDia] =
    useState<any>(null);
  const [online, setOnline] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [atualizadoEm, setAtualizadoEm] =
    useState<Date | null>(null);
  const [enviandoSOS, setEnviandoSOS] = useState(false);
  const [resumo, setResumo] =
    useState<ResumoMobile>(resumoInicial);
  const [patrulhamentoAtivo, setPatrulhamentoAtivo] =
    useState<PatrulhamentoAtivo | null>(null);
  const [chamadosRecentes, setChamadosRecentes] =
    useState<ChamadoRecente[]>([]);
  const [pendenciasOffline, setPendenciasOffline] =
    useState(0);
  const [erro, setErro] = useState("");

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia!";
    if (hora < 18) return "Boa tarde!";
    return "Boa noite!";
  }, []);

  const dataHoje = useMemo(
    () =>
      new Date()
        .toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        })
        .replace(".", "")
        .replace(/^./, (letra) => letra.toUpperCase()),
    []
  );

  useEffect(() => {
    const usuarioLocal = pegarUsuario();

    if (!usuarioLocal.id || !usuarioLocal.municipio_id) {
      window.location.replace("/login");
      return;
    }

    if (!podeAcessarMobile(usuarioLocal.perfil)) {
      alert("Seu perfil não possui acesso ao aplicativo mobile.");
      window.location.replace("/sistema");
      return;
    }

    setUsuario(usuarioLocal);
    setPendenciasOffline(obterPendenciasOffline());

    void registrarAuditoria({
      modulo: "MOBILE",
      acao: "ACESSAR_HOME",
      descricao: "Acessou a Home Mobile do SIG-GCM Brasil.",
      registro_id: String(usuarioLocal.id),
    });

    void carregarTudo(usuarioLocal);

    const intervalo = window.setInterval(() => {
      void carregarTudo(usuarioLocal, true);
      setPendenciasOffline(obterPendenciasOffline());
    }, 60000);

    return () => window.clearInterval(intervalo);
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);

    const ficouOnline = () => setOnline(true);
    const ficouOffline = () => setOnline(false);

    window.addEventListener("online", ficouOnline);
    window.addEventListener("offline", ficouOffline);

    return () => {
      window.removeEventListener("online", ficouOnline);
      window.removeEventListener("offline", ficouOffline);
    };
  }, []);

  async function carregarTudo(
    usuarioLocal: UsuarioLogado,
    silencioso = false
  ) {
    if (!silencioso) {
      setCarregando(true);
    }

    setErro("");

    try {
      await Promise.all([
        carregarGuarnicaoDia(usuarioLocal),
        carregarResumoDia(usuarioLocal),
        carregarPatrulhamentoAtivo(usuarioLocal),
        carregarChamadosRecentes(usuarioLocal),
      ]);

      setAtualizadoEm(new Date());
    } catch (error) {
      console.error("Erro ao carregar aplicativo mobile:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o aplicativo."
      );
    } finally {
      if (!silencioso) {
        setCarregando(false);
      }
    }
  }

  async function carregarGuarnicaoDia(
    usuarioLocal: UsuarioLogado
  ) {
    if (!usuarioLocal.municipio_id) return;

    const municipioId = usuarioLocal.municipio_id;

    const [
      configResposta,
      guarnicoesResposta,
      guardasResposta,
      viaturasResposta,
    ] = await Promise.all([
      supabase
        .from("escala_operacional_config")
        .select("*")
        .eq("municipio_id", municipioId)
        .eq("ativo", true)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from("guarnicoes")
        .select("*")
        .eq("municipio_id", municipioId)
        .eq("ativa", true)
        .order("id"),

      supabase
        .from("guardas")
        .select("id,nome")
        .eq("municipio_id", municipioId),

      supabase
        .from("viaturas")
        .select("*")
        .eq("municipio_id", municipioId),
    ]);

    const configEscala = configResposta.data;
    const guarnicoes = guarnicoesResposta.data || [];
    const guardas = guardasResposta.data || [];
    const viaturas = viaturasResposta.data || [];

    const idsGuarnicoes = guarnicoes.map((item: any) => item.id);

    const membrosResposta =
      idsGuarnicoes.length > 0
        ? await supabase
            .from("guarnicao_membros")
            .select("id,guarnicao_id,guarda_id")
            .in("guarnicao_id", idsGuarnicoes)
        : { data: [] as any[] };

    if (!configEscala?.ordem_guarnicoes?.length) {
      setGuarnicaoDia(null);
      return;
    }

    const guarnicaoAtual = calcularGuarnicaoDia(
      configEscala,
      guarnicoes
    );

    if (!guarnicaoAtual) {
      setGuarnicaoDia(null);
      return;
    }

    const comandante = guardas.find(
      (item: any) =>
        Number(item.id) ===
        Number(guarnicaoAtual.comandante_id)
    );

    const viatura = viaturas.find(
      (item: any) =>
        Number(item.id) === Number(guarnicaoAtual.viatura_id)
    );

    const membros =
      (membrosResposta.data || [])
        .filter(
          (item: any) =>
            Number(item.guarnicao_id) ===
            Number(guarnicaoAtual.id)
        )
        .map((item: any) => {
          const guarda = guardas.find(
            (registro: any) =>
              Number(registro.id) === Number(item.guarda_id)
          );

          return guarda?.nome || "Guarda não identificado";
        }) || [];

    setGuarnicaoDia({
      nome: guarnicaoAtual.nome || "Guarnição",
      comandante: comandante?.nome || "Não informado",
      viatura: viatura?.prefixo || "Sem VTR",
      membros,
    });
  }

  async function carregarResumoDia(
    usuarioLocal: UsuarioLogado
  ) {
    if (!usuarioLocal.municipio_id) return;

    const municipioId = usuarioLocal.municipio_id;
    const hoje = new Date().toISOString().split("T")[0];

    const [
      ocorrenciasResposta,
      chamadosResposta,
      patrulhamentosResposta,
      visitasResposta,
      notificacoesResposta,
      sosResposta,
    ] = await Promise.all([
      supabase
        .from("ocorrencias")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId)
        .gte("data", hoje),

      supabase
        .from("chamados")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId)
        .gte("criado_em", hoje),

      supabase
        .from("patrulhamentos")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId)
        .gte("data", hoje),

      supabase
        .from("visitas")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId)
        .gte("data", hoje),

      supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId)
        .eq("lida", false),

      supabase
        .from("alertas_sos")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", municipioId)
        .eq("status", "ABERTO"),
    ]);

    const respostas = [
      ocorrenciasResposta,
      chamadosResposta,
      patrulhamentosResposta,
      visitasResposta,
      notificacoesResposta,
      sosResposta,
    ];

    for (const resposta of respostas) {
      if (resposta.error) {
        console.warn(
          "Falha parcial no resumo mobile:",
          resposta.error.message
        );
      }
    }

    setResumo({
      ocorrencias: ocorrenciasResposta.count || 0,
      chamados: chamadosResposta.count || 0,
      patrulhamentos: patrulhamentosResposta.count || 0,
      visitas: visitasResposta.count || 0,
      notificacoesNaoLidas: notificacoesResposta.count || 0,
      sosAbertos: sosResposta.count || 0,
    });
  }

  async function carregarPatrulhamentoAtivo(
    usuarioLocal: UsuarioLogado
  ) {
    if (!usuarioLocal.municipio_id) return;

    const resposta = await supabase
      .from("patrulhamentos")
      .select("*")
      .eq("municipio_id", usuarioLocal.municipio_id)
      .in("status", ["EM_ANDAMENTO", "PAUSADO"])
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (resposta.error) {
      console.warn(
        "Falha parcial no patrulhamento ativo:",
        resposta.error.message
      );
      setPatrulhamentoAtivo(null);
      return;
    }

    setPatrulhamentoAtivo(
      (resposta.data as PatrulhamentoAtivo | null) || null
    );
  }

  async function carregarChamadosRecentes(
    usuarioLocal: UsuarioLogado
  ) {
    if (!usuarioLocal.municipio_id) return;

    const resposta = await supabase
      .from("chamados")
      .select("id,tipo,local,status")
      .eq("municipio_id", usuarioLocal.municipio_id)
      .order("id", { ascending: false })
      .limit(3);

    if (resposta.error) {
      console.warn(
        "Falha parcial nos chamados recentes:",
        resposta.error.message
      );
      setChamadosRecentes([]);
      return;
    }

    setChamadosRecentes(
      (resposta.data as ChamadoRecente[] | null) || []
    );
  }

  async function acionarSOS() {
    if (enviandoSOS) return;

    if (!usuario?.id || !usuario.municipio_id) {
      alert("Usuário inválido.");
      return;
    }

    if (!confirm("Deseja realmente acionar o ALERTA SOS?")) {
      return;
    }

    setEnviandoSOS(true);

    try {
      await registrarAuditoria({
        modulo: "SOS",
        acao: "CLICAR_SOS",
        descricao: "Clicou no botão SOS.",
        registro_id: String(usuario.id),
      });

      const permissao = await Geolocation.checkPermissions();

      if (permissao.location !== "granted") {
        await Geolocation.requestPermissions();
      }

      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      });

      const modoTesteLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (position.coords.accuracy > 100 && !modoTesteLocal) {
        alert(
          `GPS com baixa precisão (${Math.round(
            position.coords.accuracy
          )} metros). Vá para uma área aberta e tente novamente.`
        );
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        localStorage.removeItem("usuarioLogado");
        window.location.replace("/login");
        return;
      }

      const resposta = await fetch("/api/sos/acionar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precisao: position.coords.accuracy,
          modo_teste: modoTesteLocal,
        }),
      });

      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        if (corpo?.enviado === true) {
          navigator.vibrate?.([500, 200, 500]);
          alert(
            corpo?.erro ||
              "O SOS foi enviado, mas houve falha no registro da auditoria."
          );
          return;
        }

        if (resposta.status === 401) {
          localStorage.removeItem("usuarioLogado");
          window.location.replace("/login");
          return;
        }

        throw new Error(
          corpo?.erro || "Não foi possível enviar o SOS."
        );
      }

      navigator.vibrate?.([500, 200, 500]);

      alert(
        corpo?.mensagem ||
          "SOS enviado com sucesso. Sua localização foi compartilhada."
      );
    } catch (error) {
      console.error("Erro ao acionar SOS:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Erro inesperado ao acionar SOS."
      );
    } finally {
      setEnviandoSOS(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02060f] px-3 pb-32 pt-3 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#123e73_0%,transparent_34%),linear-gradient(180deg,#061426_0%,#02060f_55%)] opacity-80" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col gap-3">
        <MobileHeader
          usuario={usuario}
          online={online}
          saudacao={saudacao}
          dataHoje={dataHoje}
          guarnicaoDia={guarnicaoDia}
        />

        {!online ? (
          <section className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="mt-0.5 h-6 w-6 shrink-0 text-amber-300" />

              <div className="min-w-0 flex-1">
                <h2 className="font-black text-white">
                  Modo offline
                </h2>

                <p className="mt-1 text-sm leading-6 text-amber-100/80">
                  O aplicativo continuará disponível. Os dados pendentes
                  serão sincronizados quando a internet retornar.
                </p>

                <p className="mt-2 text-xs font-black uppercase text-amber-300">
                  {pendenciasOffline} pendência(s) aguardando sincronização
                </p>
              </div>
            </div>
          </section>
        ) : pendenciasOffline > 0 ? (
          <Link
            href="/sistema/offline"
            className="rounded-3xl border border-cyan-400/25 bg-cyan-400/[0.07] p-4"
          >
            <div className="flex items-center gap-3">
              <Wifi className="h-6 w-6 text-cyan-300" />

              <div className="min-w-0 flex-1">
                <p className="font-black text-white">
                  Sincronização pendente
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {pendenciasOffline} registro(s) aguardando envio.
                </p>
              </div>

              <ChevronRight className="h-5 w-5 text-cyan-300" />
            </div>
          </Link>
        ) : null}

        {erro ? (
          <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            {erro}
          </section>
        ) : null}

        {resumo.sosAbertos > 0 ? (
          <Link
            href="/sistema/central-sos"
            className="animate-pulse rounded-3xl border border-red-500/40 bg-red-600/15 p-4"
          >
            <div className="flex items-center gap-3">
              <ShieldAlert className="h-7 w-7 text-red-300" />

              <div className="min-w-0 flex-1">
                <p className="font-black text-white">
                  SOS ativo
                </p>

                <p className="mt-1 text-sm text-red-100/80">
                  {resumo.sosAbertos} alerta(s) aguardando atendimento.
                </p>
              </div>

              <ChevronRight className="h-5 w-5 text-red-300" />
            </div>
          </Link>
        ) : null}

        <section className="grid grid-cols-2 gap-3">
          <MobileActionCard
            href="/sistema/ocorrencias/expressa"
            icon={AlertTriangle}
            title="Ocorrência"
            subtitle="Registro rápido"
            color="red"
          />

          <MobileActionCard
            href={
              patrulhamentoAtivo
                ? "/sistema/patrulhamento"
                : "/sistema/patrulhamento/novo"
            }
            icon={Car}
            title={
              patrulhamentoAtivo
                ? "Continuar"
                : "Patrulhar"
            }
            subtitle={
              patrulhamentoAtivo
                ? "Patrulhamento ativo"
                : "Iniciar GPS"
            }
            color="blue"
          />
        </section>

        {patrulhamentoAtivo ? (
          <Link
            href="/sistema/patrulhamento"
            className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-400/[0.09] to-blue-600/[0.08] p-4 shadow-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
                  <Route className="h-6 w-6 text-cyan-300" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                    Patrulhamento em andamento
                  </p>

                  <h2 className="mt-1 font-black text-white">
                    {guarnicaoDia?.nome || "Equipe em serviço"}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <Clock3 className="h-3.5 w-3.5" />
                      {formatarTempo(
                        Number(
                          patrulhamentoAtivo.duracao_segundos || 0
                        )
                      )}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {Number(
                        patrulhamentoAtivo.distancia_km || 0
                      ).toFixed(1)}{" "}
                      km
                    </span>
                  </div>
                </div>
              </div>

              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-black text-emerald-300">
                {normalizar(
                  patrulhamentoAtivo.status
                ).replaceAll("_", " ")}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-black text-white">
              Continuar patrulhamento
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        ) : null}

        <MobileGuarnicaoCard guarnicaoDia={guarnicaoDia} />

        <section className="grid grid-cols-3 gap-2">
          <AtalhoCompacto
            href="/sistema/chamados"
            icone={Bell}
            titulo="Chamados"
            valor={resumo.chamados}
          />

          <AtalhoCompacto
            href="/sistema/visitas/ler-qrcode"
            icone={QrCode}
            titulo="Visitas"
            valor={resumo.visitas}
          />

          <AtalhoCompacto
            href="/sistema/mapa-operacional"
            icone={Map}
            titulo="Mapa"
            valor="AO VIVO"
          />
        </section>

        <MobileQuickMenu
          carregando={carregando}
          atualizadoEm={atualizadoEm}
        />

        <MobileStats
          totalOcorrencias={resumo.ocorrencias}
          totalChamados={resumo.chamados}
          totalPatrulhamentos={resumo.patrulhamentos}
        />

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-cyan-300">
                Situação operacional
              </p>

              <h2 className="mt-1 font-black text-white">
                Resumo do serviço
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                usuario && void carregarTudo(usuario)
              }
              disabled={carregando}
              className="rounded-xl border border-slate-700 bg-slate-950/60 p-2 text-slate-300 disabled:opacity-50"
              aria-label="Atualizar aplicativo"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  carregando ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <ResumoItem
              icone={AlertTriangle}
              titulo="Ocorrências"
              valor={resumo.ocorrencias}
            />

            <ResumoItem
              icone={Bell}
              titulo="Chamados"
              valor={resumo.chamados}
            />

            <ResumoItem
              icone={QrCode}
              titulo="Visitas"
              valor={resumo.visitas}
            />

            <ResumoItem
              icone={Shield}
              titulo="Notificações"
              valor={resumo.notificacoesNaoLidas}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-blue-300">
                Chamados recentes
              </p>

              <h2 className="mt-1 font-black text-white">
                Últimas demandas
              </h2>
            </div>

            <Link
              href="/sistema/chamados"
              className="text-xs font-black text-cyan-300"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {chamadosRecentes.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">
                Nenhum chamado recente.
              </p>
            ) : (
              chamadosRecentes.map((chamado) => (
                <Link
                  key={chamado.id}
                  href="/sistema/chamados"
                  className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                    <Bell className="h-5 w-5 text-blue-300" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">
                      {chamado.tipo || "Chamado"}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {chamado.local || "Local não informado"}
                    </p>
                  </div>

                  <span className="text-[9px] font-black uppercase text-slate-500">
                    {normalizar(chamado.status).replaceAll(
                      "_",
                      " "
                    )}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/sistema/visitas/ler-qrcode"
            className="rounded-3xl border border-emerald-400/20 bg-emerald-400/[0.07] p-4"
          >
            <QrCode className="h-7 w-7 text-emerald-300" />

            <p className="mt-3 font-black text-white">
              Ler QR Code
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Confirmar visita preventiva com GPS.
            </p>
          </Link>

          <Link
            href="/sistema/offline"
            className="rounded-3xl border border-blue-400/20 bg-blue-400/[0.07] p-4"
          >
            <Smartphone className="h-7 w-7 text-blue-300" />

            <p className="mt-3 font-black text-white">
              Modo offline
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Consultar fila e sincronização pendente.
            </p>
          </Link>
        </section>

        <section className="rounded-3xl border border-yellow-500/20 bg-slate-900/80 px-4 py-3">
          <p className="text-xs font-bold text-yellow-400">
            Frase do dia
          </p>

          <p className="mt-1 text-xs italic text-slate-200">
            “Disciplina hoje, liberdade amanhã.”
          </p>
        </section>

        <button
          type="button"
          onClick={acionarSOS}
          disabled={enviandoSOS}
          className="fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-200/30 bg-red-600 shadow-[0_0_35px_rgba(220,38,38,0.55)] transition active:scale-95 disabled:opacity-60"
          aria-label="Acionar alerta SOS"
        >
          <AlertTriangle className="h-8 w-8 text-white" />
        </button>

        <MobileBottomNav />
      </div>
    </main>
  );
}

function AtalhoCompacto({
  href,
  icone: Icone,
  titulo,
  valor,
}: {
  href: string;
  icone: typeof Bell;
  titulo: string;
  valor: number | string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3 text-center"
    >
      <Icone className="mx-auto h-5 w-5 text-cyan-300" />

      <p className="mt-2 text-[10px] font-bold uppercase text-slate-500">
        {titulo}
      </p>

      <p className="mt-1 text-sm font-black text-white">
        {valor}
      </p>
    </Link>
  );
}

function ResumoItem({
  icone: Icone,
  titulo,
  valor,
}: {
  icone: typeof AlertTriangle;
  titulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
      <div className="flex items-center justify-between gap-2">
        <Icone className="h-4 w-4 text-cyan-300" />

        <span className="text-xl font-black text-white">
          {valor}
        </span>
      </div>

      <p className="mt-2 text-[10px] font-black uppercase text-slate-500">
        {titulo}
      </p>
    </div>
  );
}
