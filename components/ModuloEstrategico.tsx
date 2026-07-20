import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Construction,
  Globe2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export type RecursoModulo = {
  titulo: string;
  descricao: string;
  href?: string;
  icone: LucideIcon;
  status?: "ATIVO" | "NOVO" | "EM_EXPANSAO";
  categoria?: string;
};

export type IndicadorModulo = {
  rotulo: string;
  valor: string;
  descricao?: string;
};

export default function ModuloEstrategico({
  titulo,
  subtitulo,
  descricao,
  icone: Icone,
  recursos,
  indicadores = [],
  nivel = "Plataforma institucional",
  selo = "PADRÃO INTERNACIONAL",
}: {
  titulo: string;
  subtitulo: string;
  descricao: string;
  icone: LucideIcon;
  recursos: RecursoModulo[];
  indicadores?: IndicadorModulo[];
  nivel?: string;
  selo?: string;
}) {
  const ativos = recursos.filter((recurso) => recurso.status !== "EM_EXPANSAO").length;

  return (
    <main className="min-h-screen bg-[#020817] px-4 py-6 text-white lg:px-8">
      <div className="mx-auto max-w-[1720px] space-y-6">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
          <Link href="/sistema" className="transition hover:text-cyan-300">SIG-GCM Brasil</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/sistema/central-modulos" className="transition hover:text-cyan-300">Ecossistema</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-slate-300">{titulo}</span>
        </nav>

        <header className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-[radial-gradient(circle_at_85%_15%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_10%_90%,rgba(59,130,246,0.16),transparent_30%),linear-gradient(135deg,#07152e,#020817)] p-6 shadow-2xl shadow-cyan-950/25 lg:p-9">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4 lg:gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-cyan-200 shadow-lg shadow-cyan-950/30 lg:h-20 lg:w-20">
                <Icone className="h-8 w-8 lg:h-10 lg:w-10" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">{subtitulo}</p>
                  <span className="rounded-full border border-blue-400/20 bg-blue-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-200">{nivel}</span>
                </div>
                <h1 className="mt-3 text-3xl font-black tracking-tight lg:text-5xl">{titulo}</h1>
                <p className="mt-4 max-w-5xl text-sm leading-7 text-slate-300 lg:text-base">{descricao}</p>
              </div>
            </div>

            <div className="grid min-w-fit gap-2 sm:grid-cols-2 xl:grid-cols-1">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-4 py-3 text-xs font-black text-emerald-300">
                <ShieldCheck className="h-4 w-4" />
                MULTI-MUNICÍPIO + RLS
              </div>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-4 py-3 text-xs font-black text-cyan-200">
                <Globe2 className="h-4 w-4" />
                {selo}
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {(indicadores.length ? indicadores : [
              { rotulo: "Capacidades", valor: String(recursos.length), descricao: "recursos organizados" },
              { rotulo: "Disponibilidade", valor: String(ativos), descricao: "áreas ativas ou novas" },
              { rotulo: "Segurança", valor: "RLS", descricao: "isolamento institucional" },
              { rotulo: "Governança", valor: "Auditável", descricao: "rastreabilidade por padrão" },
            ]).map((indicador) => (
              <div key={indicador.rotulo} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{indicador.rotulo}</p>
                <p className="mt-1 text-xl font-black text-white">{indicador.valor}</p>
                {indicador.descricao ? <p className="mt-1 text-xs text-slate-500">{indicador.descricao}</p> : null}
              </div>
            ))}
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {recursos.map((recurso) => {
            const RecursoIcone = recurso.icone;
            const conteudo = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 transition group-hover:scale-105 group-hover:border-cyan-300/40">
                    <RecursoIcone className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${
                    recurso.status === "EM_EXPANSAO"
                      ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                      : recurso.status === "NOVO"
                        ? "border-cyan-400/25 bg-cyan-400/10 text-cyan-200"
                        : "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
                  }`}>
                    {recurso.status === "EM_EXPANSAO" ? "EM EXPANSÃO" : recurso.status === "NOVO" ? "NOVO" : "ATIVO"}
                  </span>
                </div>
                {recurso.categoria ? <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-500">{recurso.categoria}</p> : null}
                <h2 className={`${recurso.categoria ? "mt-2" : "mt-5"} text-lg font-black text-slate-100`}>{recurso.titulo}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{recurso.descricao}</p>
                <div className="mt-5 flex items-center gap-2 text-xs font-black text-cyan-300">
                  {recurso.href ? <><span>Acessar capacidade</span><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></> : <><Construction className="h-4 w-4" /><span>Estrutura preparada</span></>}
                </div>
              </>
            );

            return recurso.href ? (
              <Link key={recurso.titulo} href={recurso.href} className="group rounded-3xl border border-white/10 bg-[#071225] p-5 shadow-lg shadow-black/10 transition hover:-translate-y-1 hover:border-cyan-400/35 hover:bg-[#091a33] hover:shadow-cyan-950/20">{conteudo}</Link>
            ) : (
              <article key={recurso.titulo} className="group rounded-3xl border border-white/10 bg-[#071225] p-5">{conteudo}</article>
            );
          })}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
            <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
            <div><p className="font-black text-slate-200">Segurança por desenho</p><p className="mt-1 leading-6">Isolamento municipal, perfis de acesso e trilhas de auditoria preparados para operação institucional.</p></div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
            <div><p className="font-black text-slate-200">Experiência executiva</p><p className="mt-1 leading-6">Interface consistente para comando, operação em campo, gestão administrativa e apresentação comercial.</p></div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-300" />
            <div><p className="font-black text-slate-200">Arquitetura preservada</p><p className="mt-1 leading-6">Os módulos mantêm a identidade visual e os fluxos já existentes do SIG-GCM Brasil.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
