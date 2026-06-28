"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calcularGuarnicaoDia } from "@/lib/guarnicaoDia";
import MobileBottomNav from "@/components/MobileBottomNav";
import {
  FileText,
  CalendarDays,
  Car,
  Users,
  Radio,
  Shield,
  ChevronRight,
  AlertTriangle,
  Clock,
  Circle,
  ClipboardList,
  Handshake,
} from "lucide-react";

export default function AppPage() {
  const [guarnicaoDia, setGuarnicaoDia] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [online, setOnline] = useState(true);
  const [totalOcorrencias, setTotalOcorrencias] = useState(0);
  const [totalChamados, setTotalChamados] = useState(0);
  const [totalPatrulhamentos, setTotalPatrulhamentos] = useState(0);

  useEffect(() => {
    carregarGuarnicaoDia();
    carregarResumoDia();
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

  function pegarUsuario() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  async function carregarGuarnicaoDia() {
    const usuarioLocal = pegarUsuario();
    setUsuario(usuarioLocal);

    const municipioId = usuarioLocal?.municipio_id || 1;

    const { data: configEscala } = await supabase
      .from("escala_operacional_config")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativo", true)
      .order("id", { ascending: false })
      .limit(1)
      .single();

    const { data: guarnicoes } = await supabase
      .from("guarnicoes")
      .select("*")
      .eq("municipio_id", municipioId)
      .eq("ativa", true)
      .order("id");

    const { data: membros } = await supabase
      .from("guarnicao_membros")
      .select("id, guarnicao_id, guarda_id");

    const { data: guardas } = await supabase
      .from("guardas")
      .select("id, nome")
      .eq("municipio_id", municipioId);

    const { data: viaturas } = await supabase
      .from("viaturas")
      .select("*")
      .eq("municipio_id", municipioId);

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
      nome: guarnicaoAtual.nome,
      comandante: comandante?.nome || "Não informado",
      viatura: viatura?.prefixo || "VTR-01",
      membros: membrosDaGuarnicao,
    });
  }

  async function carregarResumoDia() {
    const usuario = pegarUsuario();
    const municipioId = usuario?.municipio_id || 1;
    const hoje = new Date().toISOString().split("T")[0];

    const { count: ocorrencias } = await supabase
      .from("ocorrencias")
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", municipioId)
      .gte("data", hoje);

    const { count: chamados } = await supabase
      .from("chamados")
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", municipioId)
      .gte("criado_em", hoje);

    const { count: patrulhamentos } = await supabase
      .from("patrulhamentos")
      .select("*", { count: "exact", head: true })
      .eq("municipio_id", municipioId)
      .gte("data", hoje);

    setTotalOcorrencias(ocorrencias || 0);
    setTotalChamados(chamados || 0);
    setTotalPatrulhamentos(patrulhamentos || 0);
  }

  return (
  <main className="relative min-h-screen bg-[#02060f] text-white px-4 pt-5 pb-28 overflow-hidden">
      <img
  src="/brasao-gcm-v2.png"
  alt="SIG Brasil"
  className="
absolute
top-1/2
left-1/2
-translate-x-1/2
-translate-y-1/2
w-[500px]
opacity-[0.18]
pointer-events-none
select-none
"
/>
      <div className="relative z-10">
      <header className="flex items-center justify-between mb-6">
        <div className="mt-2">
          <h1 className="text-lg font-black">
            Olá, {usuario?.nome || "Guarda"}
          </h1>

          <p className="text-slate-400 text-xs">
            {new Date().getHours() < 12
              ? "Bom dia!"
              : new Date().getHours() < 18
              ? "Boa tarde!"
              : "Boa noite!"}
          </p>

          <p className="text-slate-500 text-[11px] mt-1">
            {new Date()
  .toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  })
  .replace(/^./, (c) => c.toUpperCase())}
          </p>
        </div>

        <span
          className={`px-3 py-2 rounded-2xl text-[10px] font-black border ${
            online
              ? "bg-green-500/15 text-green-400 border-green-500/30"
              : "bg-red-500/15 text-red-400 border-red-500/30"
          }`}
        >
          {online ? "ONLINE" : "OFFLINE"}
        </span>
      </header>

      <Link
        href="/sistema/mobile/guarnicao"
        className="block rounded-3xl bg-slate-900 border border-slate-800 p-4 mb-6 shadow-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <p className="text-slate-300 text-sm font-semibold">
              Guarnição do Dia
            </p>
          </div>

          <ChevronRight className="w-5 h-5 text-slate-500" />
        </div>

        {guarnicaoDia ? (
          <>
            <p className="text-slate-500 mt-2 text-xs">
              Comandante: {guarnicaoDia.comandante}
            </p>

            <p className="text-slate-600 text-xs mt-1">
              {guarnicaoDia.membros.length} integrantes
            </p>

            <h2 className="text-2xl font-black mt-2 text-blue-300">
              {guarnicaoDia.viatura} / {guarnicaoDia.nome}
            </h2>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Início: 07:00
              </span>

              <span className="flex items-center gap-1 text-green-400">
                <Circle className="w-3 h-3 fill-current" />
                Em andamento
              </span>
            </div>
          </>
        ) : (
          <p className="text-slate-400">Nenhuma guarnição encontrada.</p>
        )}
      </Link>

      <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 border border-yellow-500/20 p-5 mb-6">
  <p className="text-yellow-400 font-bold mb-2">
    Frase do Dia
  </p>

  <p className="text-slate-200 italic">
    "Disciplina hoje, liberdade amanhã."
  </p>

  <p className="text-slate-500 text-xs mt-2">
    SIG-GCM Brasil
  </p>
</div>

      <section className="mb-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">Atalhos rápidos</h2>
          <Link href="/sistema" className="text-blue-400 text-xs">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Atalho href="/sistema/ocorrencias" icone={FileText} texto="Ocorrências" />
          <Atalho href="/sistema/escalas" icone={CalendarDays} texto="Escalas" />
          <Atalho href="/sistema/relatorios" icone={ClipboardList} texto="Relatórios" />
          <Atalho href="/sistema/visitas" icone={Handshake} texto="Visitas"/>
          <Atalho href="/sistema/viaturas" icone={Car} texto="Viaturas" />
          <Atalho href="/sistema/mobile/operacao" icone={Radio} texto="Comunicações" />
        </div>
      </section>

      <section className="mb-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">Resumo do dia</h2>
          <span className="text-slate-500 text-xs">Atualizado agora</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Resumo titulo="Ocorrências" valor={String(totalOcorrencias)} detalhe="Hoje" />
          <Resumo titulo="Chamados" valor={String(totalChamados)} detalhe="Hoje" />
          <Resumo titulo="Patrulhas" valor={String(totalPatrulhamentos)} detalhe="Hoje" />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">Avisos importantes</h2>

          <Link href="/sistema/avisos" className="text-blue-400 text-xs">
            Ver todos
          </Link>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400" />

          <div>
            <p className="text-sm font-bold">Reunião de alinhamento</p>
            <p className="text-xs text-slate-400">Hoje às 14:00</p>
          </div>
        </div>
      </section>

      <MobileBottomNav />
      </div>
    </main>
  );
}

function Atalho({
  href,
  icone: Icone,
  texto,
}: {
  href: string;
  icone: any;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-slate-900 border border-slate-800 min-h-28 p-3 flex flex-col items-center justify-center gap-2 text-center active:scale-95 transition"
    >
      <div className="w-11 h-11 rounded-2xl bg-blue-600/20 flex items-center justify-center">
        <Icone className="w-6 h-6 text-blue-400" />
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
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3">
      <p className="text-slate-400 text-[11px]">{titulo}</p>
      <h3 className="text-xl font-black mt-1">{valor}</h3>
      <p className="text-blue-400 text-[11px] mt-1">{detalhe}</p>
    </div>
  );
}