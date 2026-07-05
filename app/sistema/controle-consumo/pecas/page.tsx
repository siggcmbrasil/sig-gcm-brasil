"use client";

import {
  Wrench,
  Package,
  PlusCircle,
  FileText,
  AlertTriangle,
  BarChart3,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function PecasPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Controle de Peças"
        subtitulo="Gestão de peças, trocas, estoque e manutenção das viaturas."
        icone={Wrench}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Package className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">Peças</h3>
          <p className="text-2xl font-black text-white mt-2">00</p>
        </SigCard>

        <SigCard>
          <Wrench className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Trocas</h3>
          <p className="text-2xl font-black text-white mt-2">00</p>
        </SigCard>

        <SigCard>
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <h3 className="text-lg font-black text-white">Baixo Estoque</h3>
          <p className="text-2xl font-black text-white mt-2">00</p>
        </SigCard>

        <SigCard>
          <BarChart3 className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Gastos</h3>
          <p className="text-2xl font-black text-white mt-2">R$ 0,00</p>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/30 p-4">
            <Wrench className="w-10 h-10 text-cyan-400" />
          </div>

          <div>
            <h2 className="text-xl font-black text-white">
              Módulo em Construção
            </h2>

            <p className="text-slate-400 mt-2">
              O controle de peças permitirá registrar peças compradas,
              peças utilizadas em viaturas, estoque mínimo, manutenção,
              despesas e histórico por veículo.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-4">
          Funcionalidades planejadas
        </h3>

        <div className="grid md:grid-cols-2 gap-3 text-slate-400">
          <p>• Cadastro de peças.</p>
          <p>• Controle de estoque.</p>
          <p>• Registro de troca por viatura.</p>
          <p>• Custo por manutenção.</p>
          <p>• Alerta de estoque baixo.</p>
          <p>• Relatórios por período.</p>
        </div>
      </SigCard>
    </div>
  );
}