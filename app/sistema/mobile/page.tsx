"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Car,
  ChevronRight,
  Clock3,
  Map,
  MapPin,
  QrCode,
  RefreshCw,
  Route,
  ShieldAlert,
  Users,
  WifiOff,
} from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";

import MobileBottomNav from "@/components/MobileBottomNav";
import MobileGuarnicaoCard from "@/components/mobile/MobileGuarnicaoCard";
import MobileHeader from "@/components/mobile/MobileHeader";
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
  const [resumo, setResumo] = useState({
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
    <main className="min-h-screen bg-[#02060f] px-3 pb-28 pt-3 text-white">
      <div className="mx-auto flex max-w-md flex-col gap-3">
        <MobileHeader
          usuario={usuario}
          online={online}
          saudacao={saudacao}
          notificacoes={resumo.notificacoes}
        />

        {!online ? (
          <div className="flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3">
            <WifiOff className="h-5 w-5 text-amber-300" />
            <p className="text-sm font-bold text-amber-100">
              Modo offline ativo
            </p>
          </div>
        ) : null}

        {resumo.sos > 0 ? (
          <Link
            href="/sistema/central-sos"
            className="flex items-center gap-3 rounded-3xl border border-red-500/40 bg-red-600/15 p-4"
          >
            <ShieldAlert className="h-8 w-8 text-red-300" />
            <div className="flex-1">
              <p className="font-black">SOS ATIVO</p>
              <p className="text-sm text-red-100/80">
                {resumo.sos} alerta(s) aguardando atendimento
              </p>
            </div>
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : null}

        <MobileGuarnicaoCard guarnicaoDia={guarnicaoDia} />

        {patrulhamento ? (
          <Link
            href="/sistema/patrulhamento"
            className="rounded-3xl border border-cyan-400/30 bg-cyan-400/[0.08] p-4"
          >
            <div className="flex items-center gap-3">
              <Route className="h-8 w-8 text-cyan-300" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase text-cyan-300">
                  Patrulhamento ativo
                </p>
                <p className="mt-1 text-xl font-black">
                  {tempoDesde(patrulhamento.iniciado_em)}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {Number(patrulhamento.distancia_km || 0).toFixed(1)} km
                </p>
              </div>
              <ChevronRight className="h-6 w-6 text-cyan-300" />
            </div>
          </Link>
        ) : null}

        <Link
          href="/sistema/ocorrencias/expressa"
          className="flex min-h-28 items-center gap-4 rounded-3xl border border-red-400/30 bg-red-600 p-5 shadow-xl active:scale-[0.99]"
        >
          <AlertTriangle className="h-12 w-12 shrink-0" />
          <div>
            <p className="text-2xl font-black">NOVA OCORRÊNCIA</p>
            <p className="mt-1 text-sm text-red-100">
              Registro rápido em campo
            </p>
          </div>
        </Link>

        <section className="grid grid-cols-2 gap-3">
          <Acao
            href="/sistema/chamados"
            icone={Bell}
            titulo="Chamados"
            detalhe={`${resumo.chamados} registros`}
          />
          <Acao
            href={
              patrulhamento
                ? "/sistema/patrulhamento"
                : "/sistema/patrulhamento/novo"
            }
            icone={Car}
            titulo={patrulhamento ? "Continuar" : "Patrulhar"}
            detalhe={patrulhamento ? "GPS ativo" : "Iniciar GPS"}
          />
          <Acao
            href="/sistema/visitas/ler-qrcode"
            icone={QrCode}
            titulo="Visitas"
            detalhe={`${resumo.visitas} hoje`}
          />
          <Acao
            href="/sistema/mapa-operacional"
            icone={Map}
            titulo="Mapa"
            detalhe="Operação ao vivo"
          />
        </section>

        <MobileStats
          ocorrencias={resumo.ocorrencias}
          chamados={resumo.chamados}
          visitas={resumo.visitas}
          notificacoes={resumo.notificacoes}
        />

        <button
          type="button"
          onClick={() =>
            usuario && void carregar(usuario)
          }
          disabled={carregando}
          className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 font-bold text-slate-300"
        >
          <RefreshCw
            className={`h-5 w-5 ${
              carregando ? "animate-spin" : ""
            }`}
          />
          Atualizar dados
        </button>

        <button
          type="button"
          onClick={() => void acionarSOS()}
          disabled={enviandoSOS}
          className="fixed bottom-24 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full border-2 border-red-200/30 bg-red-600 shadow-[0_0_35px_rgba(220,38,38,.55)] disabled:opacity-60"
          aria-label="Acionar SOS"
        >
          <AlertTriangle className="h-8 w-8" />
        </button>

        <MobileBottomNav />
      </div>
    </main>
  );
}

function Acao({
  href,
  icone: Icone,
  titulo,
  detalhe,
}: {
  href: string;
  icone: typeof Bell;
  titulo: string;
  detalhe: string;
}) {
  return (
    <Link
      href={href}
      className="min-h-28 rounded-3xl border border-slate-800 bg-slate-900/90 p-4 active:scale-[0.99]"
    >
      <Icone className="h-8 w-8 text-cyan-300" />
      <p className="mt-3 text-lg font-black">{titulo}</p>
      <p className="mt-1 text-sm text-slate-500">{detalhe}</p>
    </Link>
  );
}
