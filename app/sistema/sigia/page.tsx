"use client";

import Link from "next/link";
import {
  Bot,
  Brain,
  CreditCard,
  FileClock,
  FileText,
  Gavel,
  Search,
  ShieldCheck,
  Scale,
} from "lucide-react";

import SIGIAChat from "@/components/sigia/SIGIAChat";
import SigCentralHeader from "@/components/sig/SigCentralHeader";
import SigCard from "@/components/sig/SigCard";

const atalhos = [
  {
    titulo: "IA Operacional",
    href: "/sistema/ia",
    icone: ShieldCheck,
  },
  {
    titulo: "IA Jurídica",
    href: "/sistema/ia-juridica",
    icone: Gavel,
  },
  {
    titulo: "Legislação",
    href: "/sistema/legislacao",
    icone: Scale,
  },
  {
    titulo: "Busca",
    href: "/sistema/busca",
    icone: Search,
  },
  {
    titulo: "Relatórios IA",
    href: "/sistema/sigia/relatorios",
    icone: FileText,
  },
  {
    titulo: "Créditos",
    href: "/sistema/ia-creditos",
    icone: CreditCard,
  },
  {
    titulo: "Auditoria",
    href: "/sistema/auditoria",
    icone: FileClock,
  },
];

export default function SIGIAPage() {
  return (
    <section className="p-4 md:p-6 pb-24 space-y-6">
      <SigCentralHeader
        titulo="SIGIA"
        descricao="Assistente inteligente do SIG-GCM Brasil."
        icone={Brain}
      />

      <SigCard>
        <div className="mb-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10">
            <Bot className="h-9 w-9 text-cyan-400" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">
              Converse com a SIGIA
            </h2>

            <p className="text-sm text-slate-400">
              Use para apoio operacional, jurídico, relatórios e dúvidas do sistema.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950/70">
          <SIGIAChat />
        </div>
      </SigCard>

      <section>
        <h2 className="mb-3 text-lg font-black text-white">
          Atalhos rápidos
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {atalhos.map((atalho) => {
            const Icone = atalho.icone;

            return (
              <Link
                key={atalho.href}
                href={atalho.href}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:border-[#C9A227]/70 hover:bg-white/10"
              >
                <Icone className="mx-auto h-6 w-6 text-[#C9A227]" />

                <p className="mt-2 text-sm font-bold text-white">
                  {atalho.titulo}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </section>
  );
}