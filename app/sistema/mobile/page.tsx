"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calcularGuarnicaoDia } from "@/lib/guarnicaoDia";

export default function AppPage() {
  const [guarnicaoDia, setGuarnicaoDia] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [online, setOnline] = useState(true);
  const [totalOcorrencias, setTotalOcorrencias] = useState(0);
const [totalChamados, setTotalChamados] = useState(0);
const [totalPatrulhamentos, setTotalPatrulhamentos] = useState(0);

  useEffect(() => {
    async function carregarGuarnicaoDia() {
      const usuarioSalvo = localStorage.getItem("usuarioLogado");
      const usuarioLocal = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
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

  async function carregarResumoDia() {
  const hoje = new Date().toISOString().split("T")[0];

  const { count: ocorrencias } = await supabase
    .from("ocorrencias")
    .select("*", { count: "exact", head: true })
    .gte("data", hoje);

  const { count: chamados } = await supabase
    .from("chamados")
    .select("*", { count: "exact", head: true })
    .gte("criado_em", hoje);

  const { count: patrulhamentos } = await supabase
    .from("patrulhamentos")
    .select("*", { count: "exact", head: true })
    .gte("data", hoje);

  setTotalOcorrencias(ocorrencias || 0);
  setTotalChamados(chamados || 0);
  setTotalPatrulhamentos(patrulhamentos || 0);
}

  return (
    <main className="min-h-screen bg-[#02060f] text-white px-4 pt-4 pb-28">
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">

          <div>
            <h1 className="text-lg font-black">
              Olá, {usuario?.nome || "Guarda"}
            </h1>
            <p className="text-slate-400 text-xs">
              Bom dia! Seja bem-vindo.
            </p>
          </div>
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
          <p className="text-slate-300 text-sm">👮 Guarnição do dia</p>
          <span className="text-slate-500 text-xl">›</span>
        </div>
        

        {guarnicaoDia ? (
          <>
            <h2 className="text-2xl font-black">
              {guarnicaoDia.viatura} / {guarnicaoDia.nome}
            </h2>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>🕒 Início: 07:00</span>
              <span className="text-green-400">● Em andamento</span>
            </div>
          </>
        ) : (
          <p className="text-slate-400">Nenhuma guarnição encontrada.</p>
        )}
      </Link>

      <section className="mb-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">Atalhos rápidos</h2>
          <Link href="/sistema" className="text-blue-400 text-xs">
            Ver todos
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Atalho href="/sistema/ocorrencias/nova" icone="📄" texto="Ocorrências" />
          <Atalho href="/sistema/escalas-menu" icone="📅" texto="Escalas" />
          <Atalho href="/sistema/relatorios" icone="📊" texto="Relatórios" />
          <Atalho href="/sistema/patrulhamento" icone="📍" texto="Patrulhamento" />
          <Atalho href="/sistema/viatura" icone="🚓" texto="Viaturas" />
          <Atalho href="/sistema/mobile/operacao" icone="📢" texto="Comunicações" />
        </div>
      </section>

      <section className="mb-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">Resumo do dia</h2>
          <span className="text-slate-500 text-xs">Atualizado agora</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Resumo
  titulo="Ocorrências"
  valor={String(totalOcorrencias)}
  detalhe="Hoje"
/>

<Resumo
  titulo="Chamados"
  valor={String(totalChamados)}
  detalhe="Hoje"
/>

<Resumo
  titulo="Patrulhas"
  valor={String(totalPatrulhamentos)}
  detalhe="Hoje"
/>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">Avisos importantes</h2>
          <Link href="/sistema/avisos" className="text-blue-400 text-xs">
            Ver todos
          </Link>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center gap-3">
          <span className="text-yellow-400 text-xl">⚠️</span>
          <div>
            <p className="text-sm font-bold">Reunião de alinhamento</p>
            <p className="text-xs text-slate-400">Hoje às 14:00</p>
          </div>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#02060f]/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2">
        <div className="grid grid-cols-5 text-center text-[10px]">
          <Menu href="/sistema/mobile" icone="🏠" texto="Início" ativo />

<Menu
  href="/sistema/mobile/ocorrencias"
  icone="📄"
  texto="Ocorrências"
/>

<Menu
  href="/sistema/mobile/operacao"
  icone="🚔"
  texto=""
  destaque
/>

<Menu href="/sistema/patrulhamento" icone="📍" texto="GPS" />

<Menu
  href="/sistema/mobile/mais"
  icone="☰"
  texto="Mais"
/>
        </div>
      </nav>
    </main>
  );
}

function Atalho({
  href,
  icone,
  texto,
}: {
  href: string;
  icone: string;
  texto: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl bg-slate-900 border border-slate-800 min-h-24 p-3 flex flex-col items-center justify-center gap-2 text-center active:scale-95 transition"
    >
      <div className="w-11 h-11 rounded-2xl bg-blue-600/20 flex items-center justify-center text-2xl">
        {icone}
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
      <h3 className="text-2xl font-black mt-1">{valor}</h3>
      <p className="text-blue-400 text-[11px] mt-1">{detalhe}</p>
    </div>
  );
}

function Menu({
  href,
  icone,
  texto,
  ativo,
  destaque,
}: {
  href: string;
  icone: string;
  texto: string;
  ativo?: boolean;
  destaque?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 ${
        ativo ? "text-blue-400" : "text-slate-400"
      }`}
    >
      <span
        className={
          destaque
            ? "w-14 h-14 -mt-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl font-black shadow-xl"
            : "text-xl"
        }
      >
        {icone}
      </span>
      {texto && <span>{texto}</span>}
    </Link>
  );
}