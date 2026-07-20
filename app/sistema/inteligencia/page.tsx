import Link from "next/link";
import { Bot, Scale, BookOpen, FileText, BarChart3, BrainCircuit, Sparkles } from "lucide-react";

const cards = [
  { titulo: "IA Operacional", icone: Bot, href: "/sistema/ia", descricao: "Assistente inteligente para apoio operacional." },
  { titulo: "IA Jurídica", icone: Scale, href: "/sistema/ia-juridica", descricao: "Consultas jurídicas e apoio legal." },
  { titulo: "IA Legislação", icone: BookOpen, href: "/sistema/legislacao", descricao: "Pesquisa inteligente na legislação." },
  { titulo: "IA Relatórios", icone: FileText, href: "/sistema/sigia/relatorios", descricao: "Auxílio na elaboração de relatórios." },
  { titulo: "IA Estatística", icone: BarChart3, href: "/sistema/estatisticas", descricao: "Análise inteligente de indicadores." },
  { titulo: "Central Estratégica", icone: BrainCircuit, href: "/sistema/central-inteligencia", descricao: "Visão integrada da inteligência municipal." },
];

export default function InteligenciaPage() {
  return (
    <section className="min-h-screen bg-[#020817] px-4 py-5 text-white md:px-6">
      <div className="mx-auto max-w-[1600px] space-y-5">
        <header className="relative overflow-hidden rounded-[32px] border border-cyan-400/20 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.18),transparent_34%),linear-gradient(135deg,#07182f,#020817)] p-6 shadow-2xl md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.18em] text-cyan-200"><Sparkles className="h-4 w-4" /> Inteligência aplicada</div>
          <h1 className="mt-4 text-4xl font-black tracking-[-.05em] md:text-6xl">Central de Inteligência</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">Inteligência Artificial aplicada à operação, legislação, relatórios e análise estratégica da Guarda Municipal.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((card) => {
            const Icone = card.icone;
            return (
              <Link key={card.titulo} href={card.href} className="group rounded-[26px] border border-white/10 bg-[#071225] p-5 transition hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-[#091a33]">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-cyan-200"><Icone className="h-6 w-6" /></div>
                  <span className="rounded-full border border-cyan-400/15 bg-cyan-400/[.06] px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-cyan-300">IA</span>
                </div>
                <h2 className="mt-5 text-xl font-black">{card.titulo}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">{card.descricao}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
