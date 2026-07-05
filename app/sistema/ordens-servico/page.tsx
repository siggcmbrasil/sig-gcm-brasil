"use client";

import Link from "next/link";
import {
  ClipboardList,
  PlusCircle,
  FileText,
  Clock,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function Page() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Ordens de Serviço"
        subtitulo="Planejamento, emissão e acompanhamento das ordens de serviço da Guarda Municipal."
        icone={ClipboardList}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-cyan-400">
              0
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Total
            </p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-yellow-400">
              0
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Pendentes
            </p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-blue-400">
              0
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Em Andamento
            </p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-green-400">
              0
            </p>
            <p className="text-slate-400 text-sm mt-1">
              Concluídas
            </p>
          </div>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar ordem de serviço..."
          />

          <Link href="/sistema/ordens-servico/nova">
            <SigButton>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Ordem
            </SigButton>
          </Link>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ClipboardList className="w-16 h-16 text-slate-600 mb-4" />

          <h2 className="text-2xl font-black text-white">
            Nenhuma ordem de serviço encontrada
          </h2>

          <p className="text-slate-400 mt-2 max-w-xl">
            As ordens de serviço cadastradas aparecerão aqui automaticamente.
          </p>

          <div className="flex gap-3 mt-6">
            <Link href="/sistema/relatorios">
              <SigButton>
                <FileText className="w-4 h-4 mr-2" />
                Relatórios
              </SigButton>
            </Link>

            <Link href="/sistema/escalas">
              <SigButton>
                <Clock className="w-4 h-4 mr-2" />
                Escalas
              </SigButton>
            </Link>
          </div>
        </div>
      </SigCard>
    </div>
  );
}