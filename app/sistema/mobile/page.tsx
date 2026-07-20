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
    <main className="relative min-h-screen overflow-x-hidden bg-[#020817] pb-28 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_85%_0%,rgba(34,211,238,.13),transparent_24rem),radial-gradient(circle_at_0%_40%,rgba(14,165,233,.08),transparent_22rem),linear-gradient(180deg,#061225_0%,#020817_55%,#01050d_100%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-3 px-3 pb-5 pt-[max(.75rem,env(safe-area-inset-top))]">
        <MobileHeader
          usuario={usuario}
          online={online}
          saudacao={saudacao}
          notificacoes={resumo.notificacoes}
        />

        {!online ? (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-3 py-2.5">
            <WifiOff className="h-5 w-5 shrink-0 text-amber-200" />
            <div className="min-w-0">
              <p className="text-xs font-black text-white">Modo offline ativo</p>
              <p className="truncate text-[11px] text-amber-100/70">
                Os dados serão sincronizados quando a conexão voltar.
              </p>
            </div>
          </div>
        ) : null}

        {resumo.sos > 0 ? (
          <Link
            href="/sistema/central-sos"
            className="flex items-center gap-3 rounded-2xl border border-red-400/40 bg-red-600/15 p-3 shadow-[0_0_28px_rgba(220,38,38,.16)] active:scale-[.99]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600">
              <ShieldAlert className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-red-200">SOS ativo</p>
              <p className="mt-0.5 truncate text-sm font-black text-white">
                {resumo.sos} alerta(s) aguardando atendimento
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-red-200" />
          </Link>
        ) : null}

        <section className="grid grid-cols-[1fr_auto] gap-3">
          <div className="min-w-0">
            <MobileGuarnicaoCard guarnicaoDia={guarnicaoDia} />
          </div>

          <Link
            href="/sistema/notificacoes"
            className="flex w-[82px] flex-col items-center justify-center rounded-[22px] border border-cyan-400/15 bg-[#07172c]/90 px-2 py-3 shadow-xl active:scale-95"
          >
            <Bell className="h-5 w-5 text-cyan-200" />
            <span className="mt-2 text-2xl font-black leading-none">{resumo.notificacoes}</span>
            <span className="mt-1 text-[8px] font-black uppercase tracking-wide text-slate-500">
              Avisos
            </span>
          </Link>
        </section>

        <MobileStats
          ocorrencias={resumo.ocorrencias}
          chamados={resumo.chamados}
          visitas={resumo.visitas}
          notificacoes={resumo.notificacoes}
        />

        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/sistema/ocorrencias/nova"
            className="group relative min-h-[148px] overflow-hidden rounded-[26px] border border-red-300/35 bg-gradient-to-br from-red-500 to-red-700 p-4 shadow-[0_18px_45px_rgba(220,38,38,.24)] active:scale-[.985]"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <p className="relative mt-5 text-[10px] font-black uppercase tracking-[.16em] text-red-100">
              Ação prioritária
            </p>
            <p className="relative mt-1 text-xl font-black leading-tight text-white">
              Nova ocorrência
            </p>
            <ChevronRight className="absolute bottom-4 right-4 h-5 w-5 text-white/70" />
          </Link>

          <Link
            href={patrulhamento ? "/sistema/patrulhamento" : "/sistema/patrulhamento/novo"}
            className="relative min-h-[148px] overflow-hidden rounded-[26px] border border-cyan-300/25 bg-gradient-to-br from-cyan-500/18 via-blue-500/10 to-[#071225] p-4 shadow-xl active:scale-[.985]"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-300/[.07]" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/12 ring-1 ring-cyan-300/20">
              <Route className="h-7 w-7 text-cyan-200" />
            </div>
            <p className="relative mt-5 text-[10px] font-black uppercase tracking-[.16em] text-cyan-300">
              {patrulhamento ? "Em andamento" : "Serviço"}
            </p>
            <p className="relative mt-1 text-xl font-black leading-tight text-white">
              {patrulhamento ? tempoDesde(patrulhamento.iniciado_em) : "Iniciar patrulha"}
            </p>
            <p className="relative mt-1 text-[11px] text-slate-400">
              {patrulhamento
                ? `${Number(patrulhamento.distancia_km || 0).toFixed(1)} km`
                : "Ativar GPS"}
            </p>
          </Link>
        </section>

        <section className="rounded-[26px] border border-white/10 bg-[#071225]/90 p-3 shadow-xl">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.18em] text-cyan-300">
                Acesso rápido
              </p>
              <h2 className="mt-0.5 text-base font-black">Ferramentas de campo</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[.04] px-2.5 py-1 text-[9px] font-black text-slate-500">
              OPERACIONAL
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <AtalhoQuadrado
              href="/sistema/chamados"
              icone={Bell}
              titulo="Chamados"
              badge={resumo.chamados}
            />
            <AtalhoQuadrado
              href="/sistema/visitas/ler-qrcode"
              icone={QrCode}
              titulo="QR Code"
            />
            <AtalhoQuadrado
              href="/sistema/mapa-operacional"
              icone={Map}
              titulo="Mapa"
            />
            <AtalhoQuadrado
              href="/sistema/patrulhamento"
              icone={Car}
              titulo="Operação"
            />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => usuario && void carregar(usuario)}
            disabled={carregando}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-700/70 bg-[#071225]/90 text-xs font-black text-slate-200 active:scale-[.99] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`} />
            Atualizar
          </button>

          <Link
            href="/sistema/mobile/mais"
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.06] text-xs font-black text-cyan-200 active:scale-[.99]"
          >
            Mais recursos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>

        <button
          type="button"
          onClick={() => void acionarSOS()}
          disabled={enviandoSOS}
          className="fixed bottom-[92px] right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-[#020817] bg-red-600 shadow-[0_0_34px_rgba(220,38,38,.58)] active:scale-95 disabled:opacity-60"
          aria-label="Acionar SOS"
        >
          <AlertTriangle className="h-7 w-7 text-white" />
        </button>

        <MobileBottomNav />
      </div>
    </main>
  );
}


function AtalhoQuadrado({
  href,
  icone: Icone,
  titulo,
  badge,
}: {
  href: string;
  icone: typeof Bell;
  titulo: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      className="relative flex min-h-[82px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#020817]/75 px-2 text-center active:scale-95"
    >
      <Icone className="h-5 w-5 text-cyan-200" />
      <span className="mt-2 text-[10px] font-black text-slate-200">{titulo}</span>
      {typeof badge === "number" && badge > 0 ? (
        <span className="absolute right-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[9px] font-black text-slate-950">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
