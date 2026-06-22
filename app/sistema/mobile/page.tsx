"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { calcularGuarnicaoDia } from "@/lib/guarnicaoDia";

export default function AppPage() {
  const [guarnicaoDia, setGuarnicaoDia] = useState<any>(null);
  const [usuario, setUsuario] = useState<any>(null);
  const [online, setOnline] = useState(true);

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

  return (
    <main className="min-h-screen bg-[#02050c] text-white pb-24">
      <header className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl">
              ☰
            </button>

            <div>
              <h1 className="text-xl font-black">
                Olá, {usuario?.nome || "Guarda"}
              </h1>
              <p className="text-slate-400 text-sm">
                Bom dia! Seja bem-vindo.
              </p>
            </div>
          </div>

          <span
  className={`px-3 py-2 rounded-2xl text-xs font-black border ${
    online
      ? "bg-green-500/20 text-green-400 border-green-500/40"
      : "bg-red-500/20 text-red-400 border-red-500/40"
  }`}
>
  {online ? "🟢 ONLINE" : "🔴 OFFLINE"}
</span>
        </div>
      </header>

      <section className="mx-5 rounded-3xl bg-slate-900/90 border border-slate-800 p-5 shadow-xl">
        <p className="text-slate-400 text-sm mb-2">👮 Guarnição do dia</p>

        {guarnicaoDia ? (
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">
                {guarnicaoDia.viatura} / {guarnicaoDia.nome}
              </h2>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-400">
                <span>🕒 Início: 07:00</span>
                <span className="text-green-400">● Em andamento</span>
              </div>
            </div>

            <span className="text-slate-500 text-2xl">›</span>
          </div>
        ) : (
          <p className="text-slate-400">Nenhuma guarnição encontrada.</p>
        )}
      </section>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">Atalhos rápidos</h2>
          <span className="text-blue-400 text-sm">Ver todos</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Atalho href="/sistema/ocorrencias/nova" icone="📄" texto="Ocorrências" />
          <Atalho href="/sistema/escalas-menu" icone="📅" texto="Escalas" />
          <Atalho href="/sistema/relatorios" icone="📊" texto="Relatórios" />
          <Atalho href="/sistema/patrulhamento" icone="📍" texto="Patrulhamento" />
          <Atalho href="/sistema/viaturas" icone="🚓" texto="Viaturas" />
          <Atalho href="/sistema/mobile/operacao" icone="🚔" texto="Operação" />
        </div>
      </section>

      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">Resumo do dia</h2>
          <span className="text-slate-500 text-xs">Atualizado agora</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Resumo titulo="Ocorrências" valor="0" detalhe="+0 hoje" />
          <Resumo titulo="Chamados" valor="0" detalhe="+0 hoje" />
          <Resumo titulo="Relatórios" valor="0" detalhe="+0 hoje" />
        </div>
      </section>

      <section className="px-5 mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">Avisos importantes</h2>
          <span className="text-blue-400 text-sm">Ver todos</span>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex items-center gap-3">
          <span className="text-yellow-400 text-2xl">⚠️</span>
          <p className="text-sm text-slate-300">
            Reunião de alinhamento hoje às 14:00.
          </p>
        </div>
      </section>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 px-3 py-2">
        <div className="grid grid-cols-5 text-center text-xs">
          <Menu href="/sistema/mobile" icone="🏠" texto="Início" ativo />
          <Menu href="/sistema/ocorrencias/nova" icone="📄" texto="Ocorrências" />
          <Menu href="/sistema/patrulhamento" icone="➕" texto="" destaque />
          <Menu href="/sistema/patrulhamento" icone="📍" texto="Patrulhamento" />
          <Menu href="/sistema/perfil" icone="☷" texto="Mais" />
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
      className="rounded-2xl bg-slate-900 border border-slate-800 p-3 min-h-24 flex flex-col items-center justify-center gap-2 text-center active:scale-95 transition"
    >
      <div className="w-11 h-11 rounded-2xl bg-blue-600/20 text-2xl flex items-center justify-center">
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
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4">
      <p className="text-slate-400 text-xs">{titulo}</p>
      <h3 className="text-2xl font-black mt-1">{valor}</h3>
      <p className="text-blue-400 text-xs mt-1">{detalhe}</p>
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
            ? "w-14 h-14 -mt-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xl shadow-xl"
            : "text-2xl"
        }
      >
        {icone}
      </span>
      {texto && <span>{texto}</span>}
    </Link>
  );
}