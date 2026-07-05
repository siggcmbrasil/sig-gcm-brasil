"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
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
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
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

  if (!navigator.geolocation) {
    alert("GPS não suportado neste dispositivo.");
    return;
  }

  const confirmar = confirm(
    "Deseja realmente acionar o ALERTA SOS?"
  );

  if (!confirmar) return;

  setEnviandoSOS(true);

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const latitude = position.coords.latitude.toString();
        const longitude = position.coords.longitude.toString();
        const precisao = position.coords.accuracy.toString();

        const { error } = await supabase.from("alertas_sos").insert([
          {
            municipio_id: usuario.municipio_id,
            usuario_id: usuario.id,
            nome_usuario: usuario.nome || "Usuário não identificado",
            latitude,
            longitude,
            precisao,
            status: "ABERTO",
          },
        ]);

        if (error) {
          console.error(error);

          await registrarAuditoria({
            modulo: "SOS",
            acao: "ERRO",
            descricao: `Erro ao acionar SOS: ${error.message}`,
            registro_id: String(usuario.id),
          });

          alert("Erro ao enviar SOS.");
          setEnviandoSOS(false);
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

        alert("SOS enviado com sucesso. Sua localização foi compartilhada.");
      } catch (erro) {
        console.error(erro);
        alert("Erro inesperado ao acionar SOS.");
      } finally {
        setEnviandoSOS(false);
      }
    },
    () => {
      alert("Não foi possível obter a localização.");
      setEnviandoSOS(false);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#02060f] px-4 pt-5 pb-32 text-white">
      <img
        src="/brasoes/sig-gcm-logo.png"
        alt="SIG-GCM Brasil"
        className="pointer-events-none absolute left-1/2 top-1/2 w-[520px] -translate-x-1/2 -translate-y-1/2 select-none opacity-[0.10]"
      />

      <div className="relative z-10 space-y-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-blue-300">
              SIG-GCM Brasil Mobile
            </p>

            <h1 className="mt-1 text-xl font-black">
              Olá, {usuario?.nome?.split(" ")[0] || "Guarda"}
            </h1>

            <p className="text-sm text-slate-400">{saudacao}</p>

            <p className="mt-1 text-[11px] text-slate-500">{dataHoje}</p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-2xl border px-3 py-2 text-[10px] font-black ${
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
              {online ? "ONLINE" : "OFFLINE"}
            </span>

            <Link
              href="/sistema/notificacoes"
              className="rounded-2xl border border-slate-800 bg-slate-900 p-3"
            >
              <Bell className="h-5 w-5 text-blue-300" />
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3">
          <Link
            href="/sistema/ocorrencias/expressa"
            className="rounded-3xl border border-red-400/30 bg-red-600 p-5 text-center shadow-xl active:scale-95"
          >
            <AlertTriangle className="mx-auto mb-2 h-9 w-9" />
            <p className="text-lg font-black">Ocorrência</p>
            <p className="mt-1 text-xs text-red-100">Registro rápido</p>
          </Link>

          <Link
            href="/sistema/patrulhamento"
            className="rounded-3xl border border-blue-400/30 bg-blue-600 p-5 text-center shadow-xl active:scale-95"
          >
            <Car className="mx-auto mb-2 h-9 w-9" />
            <p className="text-lg font-black">Patrulhar</p>
            <p className="mt-1 text-xs text-blue-100">Iniciar rota</p>
          </Link>
        </section>

        <Link
          href="/sistema/mobile/guarnicao"
          className="block rounded-3xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <p className="text-sm font-bold text-slate-300">
                Guarnição do Dia
              </p>
            </div>

            <ChevronRight className="h-5 w-5 text-slate-500" />
          </div>

          {guarnicaoDia ? (
            <>
              <h2 className="text-2xl font-black text-blue-300">
                {guarnicaoDia.viatura} / {guarnicaoDia.nome}
              </h2>

              <p className="mt-2 text-xs text-slate-400">
                Comandante: {guarnicaoDia.comandante}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {guarnicaoDia.membros.length} integrante(s)
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  07:00 às 07:00
                </span>

                <span className="flex items-center gap-1 text-green-400">
                  <Circle className="h-3 w-3 fill-current" />
                  Em andamento
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Nenhuma guarnição encontrada para hoje.
            </p>
          )}
        </Link>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Operação rápida</h2>
            <span className="text-[11px] text-slate-500">
              {carregando
                ? "Atualizando..."
                : atualizadoEm
                ? `Atualizado ${atualizadoEm.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Atualizado agora"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Atalho
              href="/sistema/ocorrencias/offline"
              icone={FileText}
              texto="Offline"
              destaque="emerald"
            />
            <Atalho
              href="/sistema/chamados"
              icone={Radio}
              texto="Chamados"
            />
            <Atalho
              href="/sistema/mobile/gps"
              icone={MapPin}
              texto="GPS"
            />
            <Atalho
              href="/sistema/viaturas"
              icone={Car}
              texto="Viaturas"
            />
            <Atalho
              href="/sistema/mobile/guarnicao"
              icone={UserRound}
              texto="Equipe"
            />
            <Atalho
              href="/sistema/relatorios/plantao"
              icone={ClipboardList}
              texto="Plantão"
            />
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Resumo do dia</h2>
            <Link href="/sistema/relatorios" className="text-xs text-blue-400">
              Ver relatório
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Resumo
              titulo="Ocorrências"
              valor={String(totalOcorrencias)}
              detalhe="Hoje"
            />
            <Resumo titulo="Chamados" valor={String(totalChamados)} detalhe="Hoje" />
            <Resumo
              titulo="Patrulhas"
              valor={String(totalPatrulhamentos)}
              detalhe="Hoje"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-r from-slate-900 to-slate-800 p-5">
          <p className="mb-2 text-sm font-bold text-yellow-400">
            Frase do Dia
          </p>

          <p className="text-sm italic text-slate-200">
            "Disciplina hoje, liberdade amanhã."
          </p>

          <p className="mt-2 text-xs text-slate-500">SIG-GCM Brasil</p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-black">Avisos importantes</h2>

            <Link href="/sistema/notificacoes" className="text-xs text-blue-400">
              Ver todos
            </Link>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <AlertTriangle className="h-6 w-6 text-yellow-400" />

            <div>
              <p className="text-sm font-bold">Acompanhe as notificações</p>
              <p className="text-xs text-slate-400">
                Alertas operacionais aparecerão aqui.
              </p>
            </div>
          </div>
        </section>

<button
  type="button"
  onClick={acionarSOS}
  disabled={enviandoSOS}
  className="fixed bottom-24 right-5 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-2xl active:scale-95 disabled:opacity-60"
>
  <AlertTriangle className="h-8 w-8 text-white" />
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
      className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-3 text-center transition active:scale-95"
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${classeIcone}`}
      >
        <Icone className="h-6 w-6" />
      </div>

      <span className="text-xs font-semibold">{texto}</span>
    </Link>
  );
}

function Resumo({
  titulo,
  valor,
  detalhe,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
      <p className="text-[11px] text-slate-400">{titulo}</p>
      <h3 className="mt-1 text-2xl font-black">{valor}</h3>
      <p className="mt-1 text-[11px] text-blue-400">{detalhe}</p>
    </div>
  );
}