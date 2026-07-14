"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CarFront,
  Clock,
  FileText,
  PhoneCall,
  Plus,
  Shield,
  Siren,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";

const grupos = [
  {
    id: "blitzes",
    titulo: "Blitze e Barreiras",
    descricao: "Fiscalizações, barreiras, abordagens e pontos de bloqueio.",
    icone: Shield,
    cor: "border-blue-500/40 bg-blue-950/30",
    novo: "/sistema/blitzes-barreiras/nova",
    historico: "/sistema/central-blitzes",
    itens: ["Blitz urbana", "Barreira preventiva", "Fiscalização de trânsito"],
  },
  {
    id: "operacoes",
    titulo: "Operações Especiais",
    descricao: "Operações planejadas, missões especiais e ações integradas.",
    icone: Siren,
    cor: "border-red-500/40 bg-red-950/30",
    novo: "/sistema/operacoes-especiais",
    historico: "/sistema/central-operacoes",
    itens: ["Operação integrada", "Ação preventiva", "Missão especial"],
  },
  {
    id: "escoltas",
    titulo: "Escoltas",
    descricao: "Escoltas, deslocamentos oficiais e acompanhamentos.",
    icone: CarFront,
    cor: "border-emerald-500/40 bg-emerald-950/30",
    novo: "/sistema/escoltas/nova",
    historico: "/sistema/central-escoltas",
    itens: ["Escolta oficial", "Apoio em deslocamento", "Acompanhamento"],
  },
  {
    id: "apoios",
    titulo: "Apoios",
    descricao: "Apoios a órgãos, secretarias, instituições e eventos.",
    icone: PhoneCall,
    cor: "border-yellow-500/40 bg-yellow-950/30",
    novo: "/sistema/apoios/novo",
    historico: "/sistema/central-apoios",
    itens: ["Apoio institucional", "Apoio a evento", "Apoio a secretaria"],
  },
];

export default function OperacoesIntegradasPage() {
  const [grupoId, setGrupoId] = useState("blitzes");

  const grupoAtivo = useMemo(
    () => grupos.find((grupo) => grupo.id === grupoId) || grupos[0],
    [grupoId]
  );

  const IconeAtivo = grupoAtivo.icone;

  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Operações Integradas"
        descricao="Blitze, barreiras, operações especiais, escoltas e apoios em uma única tela operacional."
        icone={Shield}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {grupos.map((grupo) => {
          const Icone = grupo.icone;
          const ativo = grupo.id === grupoId;

          return (
            <button
              key={grupo.id}
              type="button"
              onClick={() => setGrupoId(grupo.id)}
              className={`rounded-2xl border p-4 text-left transition ${
                ativo
                  ? "border-[#C9A227] bg-[#C9A227]/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-[#C9A227]/60"
              }`}
            >
              <Icone
                size={26}
                className={ativo ? "text-[#C9A227]" : "text-slate-400"}
              />

              <h2 className="mt-3 text-sm md:text-base font-black">
                {grupo.titulo}
              </h2>
            </button>
          );
        })}
      </div>

      <section className={`rounded-3xl border p-6 ${grupoAtivo.cor}`}>
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-black/30 p-4 text-[#C9A227]">
              <IconeAtivo size={34} />
            </div>

            <div>
              <h2 className="text-3xl font-black text-white">
                {grupoAtivo.titulo}
              </h2>

              <p className="mt-2 max-w-2xl text-slate-300">
                {grupoAtivo.descricao}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href={grupoAtivo.novo}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-5 py-3 font-black text-black hover:bg-yellow-400"
            >
              <Plus size={18} />
              Novo registro
            </Link>

            <Link
              href={grupoAtivo.historico}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3 font-bold text-white hover:bg-white/10"
            >
              <FileText size={18} />
              Histórico
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <Clock className="text-[#C9A227]" />
            <h3 className="font-black text-white">Fluxo rápido</h3>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            Escolha o tipo, clique em novo registro e preencha somente os dados
            operacionais necessários.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-[#C9A227]" />
            <h3 className="font-black text-white">Controle operacional</h3>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            Cada registro deve respeitar município, usuário logado, data/hora e
            auditoria.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <FileText className="text-[#C9A227]" />
            <h3 className="font-black text-white">Relatórios</h3>
          </div>

          <p className="mt-3 text-sm text-slate-300">
            Os registros poderão alimentar relatório de plantão, estatísticas e
            histórico operacional.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0D1B34] p-5">
        <h3 className="text-xl font-black text-white">
          Tipos comuns em {grupoAtivo.titulo}
        </h3>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {grupoAtivo.itens.map((item) => (
            <div
              key={item}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm font-bold text-slate-200"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}