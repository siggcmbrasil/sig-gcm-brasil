"use client";

import Link from "next/link";

import {
  FileText,
  FileSpreadsheet,
  FileCheck,
  Printer,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function PDFsPage() {
  const itens = [
    {
      titulo: "Ocorrências",
      descricao: "PDFs de ocorrências gerados pelo sistema.",
      icone: FileText,
      href: "/sistema/ocorrencias",
    },
    {
      titulo: "Relatórios",
      descricao: "Relatórios operacionais e administrativos.",
      icone: FileSpreadsheet,
      href: "/sistema/relatorios",
    },
    {
      titulo: "Ofícios",
      descricao: "Documentos oficiais emitidos pelo SIG.",
      icone: FileCheck,
      href: "/sistema/oficios",
    },
    {
      titulo: "Impressões",
      descricao: "Central de documentos para impressão.",
      icone: Printer,
      href: "/sistema/pdfs/impressao",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Central de PDFs"
        subtitulo="Documentos e arquivos gerados pelo SIG-GCM Brasil."
        icone={FileText}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {itens.map((item) => {
          const Icone = item.icone;

          return (
            <Link key={item.titulo} href={item.href}>
  <SigCard>
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                  <Icone className="w-8 h-8 text-cyan-400" />
                </div>

                <h2 className="text-xl font-black text-white">
                  {item.titulo}
                </h2>

                <p className="text-slate-400 text-sm mt-2">
                  {item.descricao}
                </p>
              </div>
              </SigCard>
</Link>
          );
        })}
      </div>
    </div>
  );
}