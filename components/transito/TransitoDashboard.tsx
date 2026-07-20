"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CarFront,
  FileCheck2,
  FileText,
  Gauge,
  Gavel,
  Loader2,
  MapPinned,
  RefreshCw,
  ShieldCheck,
  Siren,
  TrafficCone,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Resumo = {
  fiscalizacoes: number;
  autos: number;
  acidentes: number;
  operacoes: number;
  patio: number;
  recursos: number;
  sinalizacao: number;
  pontosCriticos: number;
};

type Item = Record<string, unknown>;

const numero = (valor: unknown) => Number(valor ?? 0) || 0;

export default function TransitoDashboard() {
  const [resumo, setResumo] = useState<Resumo>({
    fiscalizacoes: 0,
    autos: 0,
    acidentes: 0,
    operacoes: 0,
    patio: 0,
    recursos: 0,
    sinalizacao: 0,
    pontosCriticos: 0,
  });
  const [ultimosAutos, setUltimosAutos] = useState<Item[]>([]);
  const [ultimosAcidentes, setUltimosAcidentes] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    const respostas = await Promise.all([
      supabase.from("transito_fiscalizacoes").select("*", { count: "exact", head: true }),
      supabase.from("transito_autos_infracao").select("*", { count: "exact", head: true }),
      supabase.from("transito_acidentes").select("*", { count: "exact", head: true }),
      supabase.from("transito_operacoes").select("*", { count: "exact", head: true }),
      supabase.from("transito_patio_veiculos").select("*", { count: "exact", head: true }),
      supabase.from("transito_recursos_jari").select("*", { count: "exact", head: true }),
      supabase.from("transito_sinalizacao").select("*", { count: "exact", head: true }),
      supabase.from("transito_pontos_mapa").select("*", { count: "exact", head: true }),
      supabase.from("transito_autos_infracao").select("*").order("created_at", { ascending: false }).limit(6),
      supabase.from("transito_acidentes").select("*").order("created_at", { ascending: false }).limit(6),
    ]);

    const primeiraFalha = respostas.find((resposta) => resposta.error)?.error;
    if (primeiraFalha) setErro(primeiraFalha.message);

    setResumo({
      fiscalizacoes: respostas[0].count ?? 0,
      autos: respostas[1].count ?? 0,
      acidentes: respostas[2].count ?? 0,
      operacoes: respostas[3].count ?? 0,
      patio: respostas[4].count ?? 0,
      recursos: respostas[5].count ?? 0,
      sinalizacao: respostas[6].count ?? 0,
      pontosCriticos: respostas[7].count ?? 0,
    });

    setUltimosAutos((respostas[8].data ?? []) as Item[]);
    setUltimosAcidentes((respostas[9].data ?? []) as Item[]);
    setCarregando(false);
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const indicadores = useMemo(
    () => [
      { titulo: "Fiscalizações", valor: resumo.fiscalizacoes, icone: ShieldCheck, href: "/sistema/transito/fiscalizacao" },
      { titulo: "Autos", valor: resumo.autos, icone: FileCheck2, href: "/sistema/transito/autos-infracao" },
      { titulo: "Acidentes", valor: resumo.acidentes, icone: Siren, href: "/sistema/transito/acidentes" },
      { titulo: "Operações", valor: resumo.operacoes, icone: TrafficCone, href: "/sistema/transito/operacoes" },
      { titulo: "Pátio", valor: resumo.patio, icone: CarFront, href: "/sistema/transito/patio" },
      { titulo: "JARI", valor: resumo.recursos, icone: Gavel, href: "/sistema/transito/jari" },
      { titulo: "Sinalização", valor: resumo.sinalizacao, icone: Gauge, href: "/sistema/transito/sinalizacao" },
      { titulo: "Pontos críticos", valor: resumo.pontosCriticos, icone: MapPinned, href: "/sistema/transito/mapa" },
    ],
    [resumo],
  );

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-5 text-white lg:px-8">
      <div className="mx-auto max-w-[1750px] space-y-5">
        <header className="rounded-[30px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.18),transparent_35%),linear-gradient(135deg,#07152e,#020817)] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <Link href="/sistema/transito" className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-cyan-300">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao SIG Trânsito
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10">
                  <BarChart3 className="h-7 w-7 text-cyan-300" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">CENTRO EXECUTIVO</p>
                  <h1 className="text-3xl font-black">Dashboard do SIG Trânsito</h1>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                Indicadores consolidados para fiscalização, acidentes, operações, recursos, pátio e infraestrutura viária.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void carregar()}
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 font-black text-cyan-200"
            >
              <RefreshCw className={`h-5 w-5 ${carregando ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </header>

        {erro ? (
          <div className="flex gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {erro}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicadores.map((item) => {
            const Icone = item.icone;
            return (
              <Link key={item.titulo} href={item.href} className="rounded-3xl border border-white/10 bg-[#071225] p-5 hover:border-cyan-400/30">
                <Icone className="h-6 w-6 text-cyan-300" />
                <p className="mt-5 text-3xl font-black">{carregando ? "—" : item.valor}</p>
                <p className="mt-1 font-black">{item.titulo}</p>
              </Link>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <Lista titulo="Autos recentes" registros={ultimosAutos} campoTitulo="numero" campoDescricao="placa" />
          <Lista titulo="Acidentes recentes" registros={ultimosAcidentes} campoTitulo="protocolo" campoDescricao="local" />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Atalho href="/sistema/transito/relatorios" titulo="Relatórios gerenciais" icone={FileText} />
          <Atalho href="/sistema/transito/mapa" titulo="Mapa de trânsito" icone={MapPinned} />
          <Atalho href="/sistema/transito/configuracoes" titulo="Configurações" icone={ShieldCheck} />
          <Atalho href="/sistema/transito/engenharia" titulo="Engenharia de tráfego" icone={TrendingUp} />
        </section>
      </div>
    </main>
  );
}

function Lista({
  titulo,
  registros,
  campoTitulo,
  campoDescricao,
}: {
  titulo: string;
  registros: Item[];
  campoTitulo: string;
  campoDescricao: string;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-[#071225]">
      <div className="border-b border-white/10 p-5">
        <h2 className="font-black">{titulo}</h2>
      </div>
      <div className="divide-y divide-white/[0.07]">
        {registros.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Nenhum registro recente.</div>
        ) : registros.map((registro, indice) => (
          <div key={String(registro.id ?? indice)} className="p-4">
            <p className="font-black text-slate-100">{String(registro[campoTitulo] ?? "Registro")}</p>
            <p className="mt-1 text-xs text-slate-500">{String(registro[campoDescricao] ?? "Não informado")}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function Atalho({
  href,
  titulo,
  icone: Icone,
}: {
  href: string;
  titulo: string;
  icone: typeof FileText;
}) {
  return (
    <Link href={href} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-[#071225] p-5 hover:border-cyan-400/30">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10">
        <Icone className="h-6 w-6 text-cyan-300" />
      </div>
      <span className="font-black">{titulo}</span>
    </Link>
  );
}
