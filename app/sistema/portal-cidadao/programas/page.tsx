"use client";

import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export default function ProgramasPortalCidadaoPage() {
  return (
    <main className="min-h-screen bg-[#07152E] p-4 md:p-6 text-white">
      <Link
        href="/sistema/portal-cidadao"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white"
      >
        <ArrowLeft size={18} />
        Voltar
      </Link>

      <section className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8">
        <Construction className="mb-4 text-[#C9A227]" size={42} />

        <h1 className="text-3xl font-black">Programas do Cidadão</h1>

        <p className="mt-2 text-slate-400">
          Página preparada para futuros programas, projetos sociais e ações da Guarda Municipal.
        </p>
      </section>
    </main>
  );
}