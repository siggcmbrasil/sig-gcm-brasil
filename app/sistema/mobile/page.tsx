"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Car,
  ChevronRight,
  Map,
  QrCode,
  RefreshCw,
  Route,
  ShieldAlert,
  WifiOff,
} from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";

import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGuarnicaoCard from "@/components/mobile/MobileGuarnicaoCard";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileStats from "@/components/mobile/MobileStats";
import MobileStatusBar from "@/components/mobile/MobileStatusBar";
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
};

type ResumoMobile = {
  ocorrencias: number;
  chamados: number;
  visitas: number;
  notificacoes: number;
  sos: number;
};

const perfisPermitidos = [
  "DESENVOLVEDOR",
  "ADMIN",
  "COMANDANTE",
  "DIRETOR",
  "CMT_GUARNICAO",
  "PLANTONISTA",
  "GUARDA",
  "CONSULTA",
];

function lerUsuario(): UsuarioLogado {
  try {
    return JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    ) as UsuarioLogado;
  } catch {
    return {};
  }
}

function tempoDesde(valor: string | null) {
  if (!valor) return "00:00";

  const segundos = Math.max(
    0,
    Math.floor((Date.now() - new Date(valor).getTime()) / 1000)
  );

  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);

  return `${String(horas).padStart(2, "0")}:${String(
    minutos
  ).padStart(2, "0")}`;
}

export default function MobilePage() {
  const [usuario, setUsuario] =
    useState<UsuarioLogado | null>(null);
  const [guarnicaoDia, setGuarnicaoDia] = useState<any>(null);
  const [patrulhamento, setPatrulhamento] =
    useState<PatrulhamentoAtivo | null>(null);
  const [online, setOnline] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [enviandoSOS, setEnviandoSOS] = useState(false);
  const [resumo, setResumo] = useState<ResumoMobile>({
    ocorrencias: 0,
    chamados: 0,
    visitas: 0,
    notificacoes: 0,
    sos: 0,
  });

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  useEffect(() => {
    const atual = lerUsuario();

    if (!atual.id || !atual.municipio_id) {
      window.location.replace("/login");
      return;
    }

    if (
      !atual.perfil ||
      !perfisPermitidos.includes(atual.perfil.toUpperCase())
    ) {
      window.location.replace("/sistema");
      return;
    }

    setUsuario(atual);
    setOnline(navigator.onLine);
    void carregar(atual);

    const atualizarOnline = () => setOnline(navigator.onLine);

    window.addEventListener("online", atualizarOnline);
    window.addEventListener("offline", atualizarOnline);

    const intervalo = window.setInterval(
      () => void carregar(atual, true),
      60000
    );

    return () => {
      window.clearInterval(intervalo);
      window.removeEventListener("online", atualizarOnline);
      window.removeEventListener("offline", atualizarOnline);
    };
  }, []);

  async function carregar(
    atual: UsuarioLogado,
    silencioso = false
  ) {
    if (!silencioso) setCarregando(true);

    await Promise.all([
      carregarGuarnicao(atual),
      carregarPatrulhamento(atual),
      carregarResumo(atual),
    ]);

    setCarregando(false);
  }

  async function carregarGuarnicao(atual: UsuarioLogado) {
    if (!atual.municipio_id) return;

    const [config, guarnicoes, guardas, viaturas] =
      await Promise.all([
        supabase
          .from("escala_operacional_config")
          .select("*")
          .eq("municipio_id", atual.municipio_id)
          .eq("ativo", true)
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle(),

        supabase
          .from("guarnicoes")
          .select("*")
          .eq("municipio_id", atual.municipio_id)
          .eq("ativa", true),

        supabase
          .from("guardas")
          .select("id,nome")
          .eq("municipio_id", atual.municipio_id),

        supabase
          .from("viaturas")
          .select("*")
          .eq("municipio_id", atual.municipio_id),
      ]);

    if (!config.data?.ordem_guarnicoes?.length) {
      setGuarnicaoDia(null);
      return;
    }

    const atualGuarnicao = calcularGuarnicaoDia(
      config.data,
      guarnicoes.data || []
    );

    if (!atualGuarnicao) {
      setGuarnicaoDia(null);
      return;
    }

    const comandante = (guardas.data || []).find(
      (item: any) =>
        Number(item.id) ===
        Number(atualGuarnicao.comandante_id)
    );

    const viatura = (viaturas.data || []).find(
      (item: any) =>
        Number(item.id) === Number(atualGuarnicao.viatura_id)
    );

    setGuarnicaoDia({
      nome: atualGuarnicao.nome || "Guarnição",
      comandante: comandante?.nome || "Não informado",
      viatura: viatura?.prefixo || "Sem VTR",
      membros: [],
    });
  }

  async function carregarPatrulhamento(atual: UsuarioLogado) {
    if (!atual.municipio_id) return;

    const resposta = await supabase
      .from("patrulhamentos")
      .select("id,status,iniciado_em,distancia_km")
      .eq("municipio_id", atual.municipio_id)
      .in("status", ["EM_ANDAMENTO", "PAUSADO"])
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    setPatrulhamento(
      resposta.error
        ? null
        : (resposta.data as PatrulhamentoAtivo | null)
    );
  }

  async function carregarResumo(atual: UsuarioLogado) {
    if (!atual.municipio_id) return;

    const hoje = new Date().toISOString().split("T")[0];

    const respostas = await Promise.all([
      supabase
        .from("ocorrencias")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", atual.municipio_id)
        .gte("data", hoje),

      supabase
        .from("chamados")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", atual.municipio_id),

      supabase
        .from("visitas")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", atual.municipio_id)
        .gte("data", hoje),

      supabase
        .from("notificacoes")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", atual.municipio_id)
        .eq("lida", false),

      supabase
        .from("alertas_sos")
        .select("id", { count: "exact", head: true })
        .eq("municipio_id", atual.municipio_id)
        .eq("status", "ABERTO"),
    ]);

    setResumo({
      ocorrencias: respostas[0].count || 0,
      chamados: respostas[1].count || 0,
      visitas: respostas[2].count || 0,
      notificacoes: respostas[3].count || 0,
      sos: respostas[4].count || 0,
    });
  }

  async function acionarSOS() {
    if (enviandoSOS || !usuario?.id) return;

    if (!confirm("Deseja realmente acionar o ALERTA SOS?")) {
      return;
    }

    setEnviandoSOS(true);

    try {
      const permissao = await Geolocation.checkPermissions();

      if (permissao.location !== "granted") {
        await Geolocation.requestPermissions();
      }

      const posicao = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0,
      });

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
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
          latitude: posicao.coords.latitude,
          longitude: posicao.coords.longitude,
          precisao: posicao.coords.accuracy,
        }),
      });

      const corpo = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        throw new Error(
          corpo?.erro || "Não foi possível enviar o SOS."
        );
      }

      await registrarAuditoria({
        modulo: "SOS",
        acao: "ACIONAR",
        descricao: "Acionou o SOS pelo aplicativo mobile.",
        registro_id: String(usuario.id),
      });

      navigator.vibrate?.([500, 200, 500]);
      alert("SOS enviado com sucesso.");
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao enviar SOS."
      );
    } finally {
      setEnviandoSOS(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02060f] pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,#0d3b66_0%,transparent_36%),linear-gradient(180deg,#06111f_0%,#02060f_55%)] opacity-90" />

      <div className="relative z-10 mx-auto flex max-w-md flex-col gap-3 px-3 pb-4 pt-3">
        <MobileHeader
          usuario={usuario}
          online={online}
          saudacao={saudacao}
          notificacoes={resumo.notificacoes}
        />

        <MobileStatusBar
          online={online}
          gpsAtivo={Boolean(patrulhamento)}
          sincronizando={carregando}
        />

        {!online ? (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300/40 bg-amber-400/15 p-3 shadow-lg">
            <WifiOff className="h-5 w-5 shrink-0 text-amber-200" />
            <div>
              <p className="text-sm font-black text-white">
                Modo offline
              </p>
              <p className="text-xs text-amber-100/80">
                Os registros serão sincronizados quando a conexão voltar.
              </p>
            </div>
          </div>
        ) : null}

        {resumo.sos > 0 ? (
          <Link
            href="/sistema/central-sos"
            className="flex items-center gap-3 rounded-3xl border border-red-400/50 bg-red-600/20 p-4 shadow-[0_0_30px_rgba(220,38,38,.2)]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-black uppercase tracking-wider text-red-200">
                SOS ativo
              </p>
              <p className="mt-1 text-base font-black text-white">
                {resumo.sos} alerta(s) aguardando atendimento
              </p>
            </div>

            <ChevronRight className="h-6 w-6 text-red-200" />
          </Link>
        ) : null}

        <MobileGuarnicaoCard guarnicaoDia={guarnicaoDia} />

        <MobileStats
          ocorrencias={resumo.ocorrencias}
          chamados={resumo.chamados}
          visitas={resumo.visitas}
          notificacoes={resumo.notificacoes}
        />

        <Link
          href="/sistema/ocorrencias/nova"
          className="group flex min-h-32 items-center gap-4 rounded-[28px] border border-red-300/40 bg-gradient-to-br from-red-500 to-red-700 p-5 shadow-[0_18px_55px_rgba(220,38,38,.28)] transition active:scale-[0.985]"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-white/15 ring-1 ring-white/20">
            <AlertTriangle className="h-9 w-9 text-white" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-100">
              Ação prioritária
            </p>
            <p className="mt-1 text-2xl font-black leading-tight text-white">
              Nova ocorrência
            </p>
            <p className="mt-1 text-sm font-medium text-red-100">
              Registro rápido em campo
            </p>
          </div>

          <ChevronRight className="h-7 w-7 text-white/80 transition group-active:translate-x-1" />
        </Link>

        <Link
          href={
            patrulhamento
              ? "/sistema/patrulhamento"
              : "/sistema/patrulhamento/novo"
          }
          className="rounded-[28px] border border-cyan-300/30 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-slate-950 p-5 shadow-xl transition active:scale-[0.985]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/15 ring-1 ring-cyan-300/20">
              <Route className="h-8 w-8 text-cyan-200" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
                {patrulhamento
                  ? "Patrulhamento em andamento"
                  : "Patrulhamento"}
              </p>

              <p className="mt-1 text-xl font-black text-white">
                {patrulhamento
                  ? tempoDesde(patrulhamento.iniciado_em)
                  : "Iniciar patrulhamento"}
              </p>

              <p className="mt-1 text-sm text-slate-300">
                {patrulhamento
                  ? `${Number(
                      patrulhamento.distancia_km || 0
                    ).toFixed(1)} km percorridos`
                  : "Ativar GPS e iniciar serviço"}
              </p>
            </div>

            <ChevronRight className="h-6 w-6 text-cyan-200" />
          </div>
        </Link>

        <section className="space-y-2">
          <AcaoLista
            href="/sistema/chamados"
            icone={Bell}
            titulo="Chamados"
            detalhe="Visualizar demandas operacionais"
            badge={resumo.chamados}
            destaque={resumo.chamados > 0}
          />

          <AcaoLista
            href="/sistema/visitas/ler-qrcode"
            icone={QrCode}
            titulo="Visitas e QR Code"
            detalhe="Confirmar presença em pontos"
            badge={resumo.visitas}
          />

          <AcaoLista
            href="/sistema/mapa-operacional"
            icone={Map}
            titulo="Mapa operacional"
            detalhe="Acompanhar equipes e ocorrências"
          />

          <AcaoLista
            href="/sistema/patrulhamento"
            icone={Car}
            titulo="Operação"
            detalhe="Patrulhamento, rota e equipe"
          />
        </section>

        <button
          type="button"
          onClick={() => usuario && void carregar(usuario)}
          disabled={carregando}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/85 text-sm font-black text-slate-200 shadow-lg transition active:scale-[0.99] disabled:opacity-50"
        >
          <RefreshCw
            className={`h-5 w-5 ${
              carregando ? "animate-spin" : ""
            }`}
          />
          Atualizar painel
        </button>

        <button
          type="button"
          onClick={() => void acionarSOS()}
          disabled={enviandoSOS}
          className="fixed bottom-24 right-4 z-50 flex h-17 w-17 items-center justify-center rounded-full border-2 border-red-100/40 bg-red-600 shadow-[0_0_38px_rgba(220,38,38,.62)] transition active:scale-95 disabled:opacity-60"
          aria-label="Acionar SOS"
        >
          <AlertTriangle className="h-8 w-8 text-white" />
        </button>

        <MobileBottomNav />
      </div>
    </main>
  );
}

function AcaoLista({
  href,
  icone: Icone,
  titulo,
  detalhe,
  badge,
  destaque = false,
}: {
  href: string;
  icone: typeof Bell;
  titulo: string;
  detalhe: string;
  badge?: number;
  destaque?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-20 items-center gap-4 rounded-3xl border p-4 shadow-lg transition active:scale-[0.99] ${
        destaque
          ? "border-amber-300/35 bg-amber-400/10"
          : "border-slate-800 bg-slate-900/85"
      }`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          destaque
            ? "bg-amber-400/15 text-amber-200"
            : "bg-cyan-400/10 text-cyan-200"
        }`}
      >
        <Icone className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-base font-black text-white">
          {titulo}
        </p>
        <p className="mt-1 truncate text-sm text-slate-400">
          {detalhe}
        </p>
      </div>

      {typeof badge === "number" ? (
        <span
          className={`flex min-w-9 items-center justify-center rounded-full px-2.5 py-1 text-xs font-black ${
            destaque
              ? "bg-amber-400 text-slate-950"
              : "bg-slate-800 text-slate-200"
          }`}
        >
          {badge}
        </span>
      ) : (
        <ChevronRight className="h-5 w-5 text-slate-500" />
      )}
    </Link>
  );
}
