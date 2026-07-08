"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Car,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock,
  FileText,
  MapPin,
  Radio,
  Shield,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Geolocation } from "@capacitor/geolocation";
import { registrarAuditoria } from "@/lib/auditoria";
import { calcularGuarnicaoDia } from "@/lib/guarnicaoDia";
import MobileBottomNav from "@/components/MobileBottomNav";

type UsuarioLogado = {
  id?: string | number;
  nome?: string;
  perfil?: string;
  municipio_id?: number;
  municipio_nome?: string;
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

function podeAcessarMobile(perfil?: string) {
  return perfil ? perfisPermitidosMobile.includes(perfil) : false;
}

export default function AppPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [guarnicaoDia, setGuarnicaoDia] = useState<any>(null);
  const [online, setOnline] = useState(true);
  const [carregando, setCarregando] = useState(true);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const [totalOcorrencias, setTotalOcorrencias] = useState(0);
  const [totalChamados, setTotalChamados] = useState(0);
  const [totalPatrulhamentos, setTotalPatrulhamentos] = useState(0);
  const [enviandoSOS, setEnviandoSOS] = useState(false);

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia!";
    if (hora < 18) return "Boa tarde!";
    return "Boa noite!";
  }, []);

  const dataHoje = useMemo(() => {
    return new Date()
      .toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
      })
      .replace(".", "")
      .replace(/^./, (c) => c.toUpperCase());
  }, []);

  useEffect(() => {
    const usuarioLocal = pegarUsuario();

    if (!usuarioLocal?.id || !usuarioLocal?.municipio_id) {
      window.location.href = "/login";
      return;
    }

    if (!podeAcessarMobile(usuarioLocal.perfil)) {
      alert("Seu perfil não tem permissão para acessar o mobile.");
      window.location.href = "/sistema";
      return;
    }

    setUsuario(usuarioLocal);

    void registrarAuditoria({
      modulo: "MOBILE",
      acao: "ACESSAR_HOME",
      descricao: "Acessou a Home Mobile do SIG-GCM Brasil.",
      registro_id: String(usuarioLocal.id),
    });

    carregarTudo(usuarioLocal);

    const intervalo = setInterval(() => {
      carregarTudo(usuarioLocal);
    }, 60000);

    return () => clearInterval(intervalo);
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

  function pegarUsuario(): UsuarioLogado {
    try {
      return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
    } catch {
      return {};
    }
  }

  async function carregarTudo(usuarioLocal: UsuarioLogado) {
    setCarregando(true);

    await Promise.all([
      carregarGuarnicaoDia(usuarioLocal),
      carregarResumoDia(usuarioLocal),
    ]);

    setAtualizadoEm(new Date());
    setCarregando(false);
  }

  async function carregarGuarnicaoDia(usuarioLocal: UsuarioLogado) {
    if (!usuarioLocal?.municipio_id) return;

    const municipioId = usuarioLocal.municipio_id;

    const { data: configEscala } = await supabase
      .from("escala_operacional_config")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: guarnicoes } = await supabase
      .from("guarnicoes")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativa", true)
      .order("id");

    const { data: guardas } = await supabase
      .from("guardas")
      .select("id, nome")
      .eq("municipio_id", municipioId);

    const { data: viaturas } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", municipioId);

    const idsGuarnicoes = (guarnicoes || []).map((g) => g.id);

    const { data: membros } =
      idsGuarnicoes.length > 0
        ? await supabase
            .from("guarnicao_membros")
            .select("id, guarnicao_id, guarda_id")
            .in("guarnicao_id", idsGuarnicoes)
        : { data: [] };

    if (!configEscala || !configEscala.ordem_guarnicoes?.length) {
      setGuarnicaoDia(null);
      return;
    }

    const guarnicaoAtual = calcularGuarnicaoDia(
      configEscala,
      guarnicoes || []
    );

    if (!guarnicaoAtual) {
      setGuarnicaoDia(null);
      return;
    }

    const comandante = guardas?.find(
      (g) => Number(g.id) === Number(guarnicaoAtual.comandante_id)
    );

    const viatura = viaturas?.find(
      (v) => Number(v.id) === Number(guarnicaoAtual.viatura_id)
    );

    const membrosDaGuarnicao =
      membros
        ?.filter((m) => Number(m.guarnicao_id) === Number(guarnicaoAtual.id))
        .map((m) => {
          const guarda = guardas?.find(
            (g) => Number(g.id) === Number(m.guarda_id)
          );

          return guarda?.nome || "Guarda não encontrado";
        }) || [];

    setGuarnicaoDia({
      nome: guarnicaoAtual.nome || "Guarnição",
      comandante: comandante?.nome || "Não informado",
      viatura: viatura?.prefixo || "Sem VTR",
      membros: membrosDaGuarnicao,
    });
  }

  async function carregarResumoDia(usuarioLocal: UsuarioLogado) {
    if (!usuarioLocal?.municipio_id) return;

    const municipioId = usuarioLocal.municipio_id;
    const hoje = new Date().toISOString().split("T")[0];

    const [ocorrenciasResp, chamadosResp, patrulhamentosResp] =
      await Promise.all([
        supabase
          .from("ocorrencias")
          .select("*", { count: "exact", head: true })
          .eq("municipio_id", municipioId)
          .gte("data", hoje),

        supabase
          .from("chamados")
          .select("*", { count: "exact", head: true })
          .eq("municipio_id", municipioId)
          .gte("criado_em", hoje),

        supabase
          .from("patrulhamentos")
          .select("*", { count: "exact", head: true })
          .eq("municipio_id", municipioId)
          .gte("data", hoje),
      ]);

    if (
      ocorrenciasResp.error ||
      chamadosResp.error ||
      patrulhamentosResp.error
    ) {
      console.error("Erro ao carregar resumo mobile:", {
        ocorrencias: ocorrenciasResp.error,
        chamados: chamadosResp.error,
        patrulhamentos: patrulhamentosResp.error,
      });

      return;
    }

    setTotalOcorrencias(ocorrenciasResp.count || 0);
    setTotalChamados(chamadosResp.count || 0);
    setTotalPatrulhamentos(patrulhamentosResp.count || 0);
  }

  async function acionarSOS() {
    if (enviandoSOS) return;

    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Usuário inválido.");
      return;
    }

    const confirmar = confirm("Deseja realmente acionar o ALERTA SOS?");
    if (!confirmar) return;

    setEnviandoSOS(true);

    try {
      await registrarAuditoria({
        modulo: "SOS",
        acao: "CLICAR_SOS",
        descricao: `Clicou no botão SOS.`,
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

      if (position.coords.accuracy > 100) {
        alert(
          `GPS com baixa precisão (${Math.round(
            position.coords.accuracy
          )} metros). Vá para área aberta e tente novamente.`
        );
        setEnviandoSOS(false);
        return;
      }

      const { error } = await supabase.from("alertas_sos").insert([
        {
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
          nome_usuario: usuario.nome || "Usuário não identificado",
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          precisao: position.coords.accuracy,
          status: "ABERTO",
        },
      ]);

      if (error) {
        await registrarAuditoria({
          modulo: "SOS",
          acao: "ERRO",
          descricao: `Erro ao acionar SOS: ${error.message}`,
          registro_id: String(usuario.id),
        });

        alert("Erro ao enviar SOS.");
        return;
      }

      await supabase.from("notificacoes").insert([
        {
          municipio_id: usuario.municipio_id,
          titulo: "🚨 ALERTA SOS",
          mensagem: `${usuario.nome || "Um guarda"} acionou o botão SOS.`,
          tipo: "SOS",
          link: "/sistema/central-sos",
          lida: false,
        },
      ]);

      await registrarAuditoria({
        modulo: "SOS",
        acao: "ACIONAR",
        descricao: `Alerta SOS acionado por ${usuario.nome || "usuário"}.`,
        registro_id: String(usuario.id),
      });

      navigator.vibrate?.([500, 200, 500]);

      alert("SOS enviado com sucesso. Sua localização foi compartilhada.");
    } catch (erro) {
      console.error(erro);
      alert("Erro inesperado ao acionar SOS.");
    } finally {
      setEnviandoSOS(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#02060f] px-3 pt-3 pb-32 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,#123e73_0%,transparent_34%),linear-gradient(180deg,#061426_0%,#02060f_55%)] opacity-80" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-6rem)] max-w-md flex-col gap-3">
        <header className="rounded-3xl border border-slate-800/80 bg-slate-950/65 p-3 shadow-xl backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-300">
                SIG-GCM Mobile
              </p>

              <h1 className="mt-1 truncate text-xl font-black">
                👮 {usuario?.nome?.split(" ")[0] || "Guarda"}
              </h1>

              <p className="mt-0.5 text-xs text-slate-400">
                {saudacao} • {dataHoje}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`inline-flex h-9 items-center gap-1 rounded-2xl border px-2 text-[10px] font-black ${
                  online
                    ? "border-green-500/30 bg-green-500/15 text-green-400"
                    : "border-red-500/30 bg-red-500/15 text-red-400"
                }`}
              >
                {online ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                {online ? "ON" : "OFF"}
              </span>

              <Link
                href="/sistema/notificacoes"
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900"
              >
                <Bell className="h-4 w-4 text-blue-300" />
              </Link>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-300">
                {guarnicaoDia
                  ? `${guarnicaoDia.viatura} • ${guarnicaoDia.nome}`
                  : "Guarnição não localizada"}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {guarnicaoDia
                  ? `CMT: ${guarnicaoDia.comandante}`
                  : "Configure a escala operacional"}
              </p>
            </div>

            <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-green-400">
              <Circle className="h-2.5 w-2.5 fill-current" />
              Serviço
            </span>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/sistema/ocorrencias/expressa"
            className="rounded-3xl border border-red-400/30 bg-red-600 p-4 text-center shadow-xl active:scale-95"
          >
            <AlertTriangle className="mx-auto mb-1.5 h-8 w-8" />
            <p className="text-base font-black">Ocorrência</p>
            <p className="text-[11px] text-red-100">Registro rápido</p>
          </Link>

          <Link
            href="/sistema/patrulhamento/novo"
            className="rounded-3xl border border-blue-400/30 bg-blue-600 p-4 text-center shadow-xl active:scale-95"
          >
            <Car className="mx-auto mb-1.5 h-8 w-8" />
            <p className="text-base font-black">Patrulhar</p>
            <p className="text-[11px] text-blue-100">Iniciar GPS</p>
          </Link>
        </section>

        <Link
          href="/sistema/mobile/guarnicao"
          className="block rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <p className="text-sm font-bold text-slate-300">
                Guarnição do Dia
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-slate-500" />
          </div>

          {guarnicaoDia ? (
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-2xl font-black text-blue-300">
                  {guarnicaoDia.viatura}
                </h2>

                <p className="truncate text-sm font-bold text-white">
                  {guarnicaoDia.nome}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {guarnicaoDia.membros.length} integrante(s)
                </p>
              </div>

              <div className="text-right text-[11px] text-slate-400">
                <p className="flex items-center justify-end gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  07h às 07h
                </p>
                <p className="mt-1 text-green-400">Em andamento</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">
              Nenhuma guarnição encontrada para hoje.
            </p>
          )}
        </Link>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-black">Operação rápida</h2>
            <span className="text-[10px] text-slate-500">
              {carregando
                ? "Atualizando..."
                : atualizadoEm
                ? atualizadoEm.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Agora"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Atalho
              href="/sistema/ocorrencias/offline"
              icone={FileText}
              texto="Offline"
              destaque="emerald"
            />
            <Atalho href="/sistema/chamados" icone={Radio} texto="Chamados" />
            <Atalho href="/sistema/mobile/gps" icone={MapPin} texto="GPS" />
            <Atalho href="/sistema/viaturas" icone={Car} texto="Viaturas" />
            <Atalho href="/sistema/mobile/guarnicao" icone={UserRound} texto="Equipe" />
            <Atalho href="/sistema/relatorios/plantao" icone={ClipboardList} texto="Plantão" />
          </div>
        </section>

        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-black">Resumo do dia</h2>
            <Link href="/sistema/relatorios" className="text-xs text-blue-400">
              Relatório
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Resumo titulo="Ocorr." valor={String(totalOcorrencias)} />
            <Resumo titulo="Cham." valor={String(totalChamados)} />
            <Resumo titulo="Patr." valor={String(totalPatrulhamentos)} />
          </div>
        </section>

        <section className="rounded-3xl border border-yellow-500/20 bg-slate-900/80 px-4 py-3">
          <p className="text-xs font-bold text-yellow-400">Frase do Dia</p>
          <p className="mt-1 text-xs italic text-slate-200">
            "Disciplina hoje, liberdade amanhã."
          </p>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />

            <div className="min-w-0">
              <p className="text-sm font-bold">Avisos importantes</p>
              <p className="truncate text-xs text-slate-400">
                Alertas operacionais aparecerão aqui.
              </p>
            </div>

            <Link
              href="/sistema/notificacoes"
              className="ml-auto shrink-0 text-xs text-blue-400"
            >
              Ver
            </Link>
          </div>
        </section>

        <button
          type="button"
          onClick={acionarSOS}
          disabled={enviandoSOS}
          className="fixed bottom-[5.25rem] right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-red-300/30 bg-red-600 shadow-2xl active:scale-95 disabled:opacity-60"
        >
          <AlertTriangle className="h-7 w-7 text-white" />
        </button>

        <MobileBottomNav />
      </div>
    </main>
  );
}

function Atalho({
  href,
  icone: Icone,
  texto,
  destaque,
}: {
  href: string;
  icone: any;
  texto: string;
  destaque?: "emerald";
}) {
  const classeIcone =
    destaque === "emerald"
      ? "bg-emerald-600/20 text-emerald-400"
      : "bg-blue-600/20 text-blue-400";

  return (
    <Link
      href={href}
      className="flex min-h-[82px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/95 p-2 text-center transition active:scale-95"
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-2xl ${classeIcone}`}
      >
        <Icone className="h-5 w-5" />
      </div>

      <span className="text-[11px] font-semibold leading-tight">{texto}</span>
    </Link>
  );
}

function Resumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <h3 className="mt-1 text-2xl font-black">{valor}</h3>
      <p className="text-[10px] text-blue-400">Hoje</p>
    </div>
  );
}
