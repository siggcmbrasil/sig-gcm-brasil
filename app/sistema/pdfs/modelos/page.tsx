"use client";

import Link from "next/link";
import {
  FileText,
  FileCheck,
  ClipboardList,
  ShieldCheck,
  CarFront,
  UserCheck,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function ModelosPDFPage() {
  const modelos = [
    {
      titulo: "Modelo de Ocorrência",
      descricao: "Estrutura padrão para impressão ou preenchimento manual.",
      icone: FileText,
      href: "/sistema/ocorrencias/nova",
    },
    {
      titulo: "Modelo de Ofício",
      descricao: "Modelo institucional para comunicações oficiais.",
      icone: FileCheck,
      href: "/sistema/oficios",
    },
    {
      titulo: "Relatório de Plantão",
      descricao: "Modelo de relatório operacional do serviço diário.",
      icone: ClipboardList,
      href: "/sistema/relatorios/plantao",
    },
    {
      titulo: "Checklist de Viatura",
      descricao: "Modelo para conferência de veículo antes do serviço.",
      icone: CarFront,
      href: "/sistema/viaturas",
    },
    {
      titulo: "Termo de Entrega",
      descricao: "Modelo para entrega de equipamentos, documentos ou materiais.",
      icone: ShieldCheck,
      href: "/sistema/patrimonio",
    },
    {
      titulo: "Ficha de Abordagem",
      descricao: "Modelo operacional para registro rápido de abordagem.",
      icone: UserCheck,
      href: "/sistema/abordagens",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Modelos de PDFs"
        subtitulo="Modelos institucionais para impressão e uso operacional."
        icone={FileText}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {modelos.map((modelo) => {
          const Icone = modelo.icone;

          return (
            <Link key={modelo.titulo} href={modelo.href}>
              <SigCard>
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                    <Icone className="w-8 h-8 text-cyan-400" />
                  </div>

                  <h2 className="text-xl font-black text-white">
                    {modelo.titulo}
                  </h2>

                  <p className="text-slate-400 text-sm mt-2">
                    {modelo.descricao}
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