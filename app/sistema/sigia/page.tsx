"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CreditCard,
  FileClock,
  FileText,
  Gavel,
  Search,
  ShieldCheck,
  Sparkles,
  Scale,
  WandSparkles,
} from "lucide-react";

import SIGIAChat from "@/components/sigia/SIGIAChat";

const atalhos = [
  {
    titulo: "IA Operacional",
    descricao: "Apoio em rotinas, ocorrências e decisões em campo.",
    href: "/sistema/ia",
    icone: ShieldCheck,
  },
  {
    titulo: "IA Jurídica",
    descricao: "Consultas legais, pareceres e apoio normativo.",
    href: "/sistema/ia-juridica",
    icone: Gavel,
  },
  {
    titulo: "Legislação",
    descricao: "Base normativa e busca inteligente.",
    href: "/sistema/legislacao",
    icone: Scale,
  },
  {
    titulo: "Busca",
    descricao: "Encontre informações estratégicas mais rápido.",
    href: "/sistema/busca",
    icone: Search,
  },
  {
    titulo: "Relatórios IA",
    descricao: "Textos, resumos e apoio analítico.",
    href: "/sistema/sigia/relatorios",
    icone: FileText,
  },
  {
    titulo: "Créditos",
    descricao: "Controle de consumo e utilização de IA.",
    href: "/sistema/ia-creditos",
    icone: CreditCard,
  },
  {
    titulo: "Auditoria",
    descricao: "Rastreabilidade e histórico de uso.",
    href: "/sistema/auditoria",
    icone: FileClock,
  },
];

const destaques = [
  {
    titulo: "Super IA operacional",
    descricao: "Converse, consulte, gere respostas e acelere o trabalho diário com contexto do sistema.",
    icone: Bot,
  },
  {
    titulo: "Respostas com contexto",
    descricao: "A SIGIA entende perfil, rotina e necessidades do ambiente SIG-GCM Brasil.",
    icone: BrainCircuit,
  },
  {
    titulo: "Experiência de primeiro mundo",
    descricao: "Interface premium, moderna, rápida e pronta para uso institucional.",
    icone: WandSparkles,
  },
];

export default function SIGIAPage() {
  return (
    <section className="min-h-screen bg-[#020817] px-4 pb-24 pt-4 text-white md:px-6 md:pt-6">
      <div className="mx-auto w-full max-w-[1700px] space-y-6">
        <header className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,.10),transparent_30%),linear-gradient(135deg,#07162d,#020817)] p-6 shadow-[0_30px_80px_rgba(0,0,0,.35)] md:p-8">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-cyan-200">
                <Sparkles className="h-4 w-4" />
                Inteligência de nova geração
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
                SIG<span className="text-cyan-300">IA</span>
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
                A central de inteligência do SIG-GCM Brasil em um ambiente premium,
                moderno e preparado para apoiar decisões operacionais, jurídicas,
                analíticas e institucionais.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:w-[520px]">
              {destaques.map((item) => {
                const Icone = item.icone;
                return (
                  <div
                    key={item.titulo}
                    className="rounded-2xl border border-white/10 bg-white/[.05] p-4 backdrop-blur"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
                      <Icone className="h-5 w-5" />
                    </div>
                    <h2 className="mt-4 text-sm font-black text-white">{item.titulo}</h2>
                    <p className="mt-2 text-xs leading-6 text-slate-400">{item.descricao}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </header>

        <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="overflow-hidden rounded-[30px] border border-cyan-400/15 bg-[linear-gradient(180deg,rgba(10,25,48,.96),rgba(3,12,27,.98))] shadow-[0_25px_70px_rgba(0,0,0,.28)]">
            <SIGIAChat />
          </div>

          <aside className="space-y-4">
            <div className="rounded-[28px] border border-white/10 bg-[#071225] p-5 shadow-xl">
              <p className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-300">
                Módulos inteligentes
              </p>
              <h2 className="mt-2 text-xl font-black">Acessos rápidos</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Navegue pelas áreas de IA, legislação, relatórios e auditoria sem sair do fluxo de trabalho.
              </p>

              <div className="mt-5 space-y-3">
                {atalhos.map((atalho) => {
                  const Icone = atalho.icone;
                  return (
                    <Link
                      key={atalho.href}
                      href={atalho.href}
                      className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/[.04]"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-400/10 text-cyan-200">
                        <Icone className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white">{atalho.titulo}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {atalho.descricao}
                        </p>
                      </div>

                      <ArrowRight className="mt-1 h-4 w-4 text-slate-600 transition group-hover:text-cyan-300" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
