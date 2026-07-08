"use client";

import Link from "next/link";
import {
  BookOpen,
  Bot,
  Download,
  FileText,
  Gavel,
  Newspaper,
  Scale,
  Search,
  Star,
} from "lucide-react";

import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCard from "@/components/sig/SigCard";

const cards = [
  {
    titulo: "Biblioteca Jurídica",
    descricao: "Leis, códigos, decretos, POPs e manuais da Guarda.",
    href: "/sistema/legislacao",
    icone: BookOpen,
  },
{
  titulo: "Pesquisa Jurídica",
  descricao: "Tela exclusiva para pesquisar lei, artigo, palavra-chave ou assunto.",
  href: "/sistema/legislacao/pesquisa",
  icone: Search,
},
  {
    titulo: "IA Jurídica",
    descricao: "Assistente para interpretação jurídica e apoio operacional.",
    href: "/sistema/ia-juridica",
    icone: Bot,
  },
  {
    titulo: "Notícias",
    descricao: "Segurança pública, Guarda Municipal, STF, STJ e SENASP.",
    href: "/sistema/central-legislacao/noticias",
    icone: Newspaper,
  },
  {
    titulo: "Atualizações",
    descricao: "Novas leis, decretos, portarias e jurisprudências.",
    href: "/sistema/central-legislacao/atualizacoes",
    icone: FileText,
  },
  {
    titulo: "Favoritos",
    descricao: "Leis, artigos, PDFs e conteúdos salvos pelo usuário.",
    href: "/sistema/central-legislacao/favoritos",
    icone: Star,
  },
  {
    titulo: "Downloads",
    descricao: "Cartilhas, POPs, modelos e materiais institucionais.",
    href: "/sistema/central-legislacao/downloads",
    icone: Download,
  },
];

export default function CentralLegislacaoPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="Central de Legislação"
        descricao="Biblioteca jurídica, notícias, atualizações e apoio jurídico para a Guarda Municipal."
        icone={Scale}
      />

      <SigCard>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-[#C9A227]">
              Consulta rápida
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              Pesquisar legislação
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Pesquise leis, artigos, assuntos e fundamentos jurídicos.
            </p>
          </div>

          <Link
            href="/sistema/legislacao"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-5 py-3 font-black text-black hover:bg-yellow-400"
          >
            <Search size={18} />
            Abrir pesquisa
          </Link>
        </div>
      </SigCard>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {cards.map((card) => {
          const Icone = card.icone;

          return (
            <Link
              key={card.href + card.titulo}
              href={card.href}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-[#C9A227]/70 hover:bg-white/10"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9A227]/30 bg-[#C9A227]/10">
                <Icone className="h-7 w-7 text-[#C9A227]" />
              </div>

              <h2 className="text-xl font-black text-white">
                {card.titulo}
              </h2>

              <p className="mt-2 text-sm text-slate-400">
                {card.descricao}
              </p>
            </Link>
          );
        })}
      </div>

      <section className="grid gap-5 lg:grid-cols-2">
        <SigCard>
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <Newspaper className="text-[#C9A227]" />
            Notícias filtradas
          </h2>

          <p className="mt-3 text-sm text-slate-400">
            A central poderá exibir somente notícias relacionadas à Guarda
            Municipal, segurança pública, trânsito, SENASP, Ministério da
            Justiça, STF e STJ.
          </p>
        </SigCard>

        <SigCard>
          <h2 className="flex items-center gap-2 text-xl font-black text-white">
            <Gavel className="text-[#C9A227]" />
            Apoio ao guarda
          </h2>

          <p className="mt-3 text-sm text-slate-400">
            O guarda poderá consultar legislação, salvar favoritos, acompanhar
            atualizações e usar a IA Jurídica quando necessário.
          </p>
        </SigCard>
      </section>
    </section>
  );
}