"use client";

import Link from "next/link";
import {
  Package,
  PlusCircle,
  Search,
  FileText,
  Shield,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";
import SigButton from "@/components/sig/SigButton";

export default function ObjetosApreendidosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Objetos Apreendidos"
        subtitulo="Consulta e gerenciamento de objetos vinculados às ocorrências."
        icone={Package}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-cyan-400">0</p>
            <p className="text-slate-400 text-sm mt-1">
              Objetos Cadastrados
            </p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-yellow-400">0</p>
            <p className="text-slate-400 text-sm mt-1">
              Apreendidos
            </p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-green-400">0</p>
            <p className="text-slate-400 text-sm mt-1">
              Restituídos
            </p>
          </div>
        </SigCard>

        <SigCard>
          <div className="text-center">
            <p className="text-3xl font-black text-red-400">0</p>
            <p className="text-slate-400 text-sm mt-1">
              Destruídos
            </p>
          </div>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="input flex-1"
            placeholder="Pesquisar por descrição, numeração ou ocorrência..."
          />

          <SigButton>
            <Search className="w-4 h-4 mr-2" />
            Pesquisar
          </SigButton>

          <Link href="/sistema/ocorrencias/nova">
            <SigButton>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nova Ocorrência
            </SigButton>
          </Link>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-16 h-16 text-slate-600 mb-4" />

          <h2 className="text-2xl font-black text-white">
            Nenhum objeto encontrado
          </h2>

          <p className="text-slate-400 mt-2 max-w-xl">
            Os objetos apreendidos cadastrados nas ocorrências aparecerão aqui
            automaticamente.
          </p>

          <div className="flex gap-3 mt-6">
            <Link href="/sistema/ocorrencias">
              <SigButton>
                <FileText className="w-4 h-4 mr-2" />
                Ocorrências
              </SigButton>
            </Link>

            <Link href="/sistema/relatorios">
              <SigButton>
                <Shield className="w-4 h-4 mr-2" />
                Relatórios
              </SigButton>
            </Link>
          </div>
        </div>
      </SigCard>
    </div>
  );
}