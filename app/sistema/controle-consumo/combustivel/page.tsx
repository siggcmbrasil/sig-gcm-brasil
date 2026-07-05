"use client";

import {
  Fuel,
  Droplets,
  Wallet,
  BarChart3,
  FileText,
  Truck,
} from "lucide-react";

import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

export default function CombustivelPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Controle de Combustível"
        subtitulo="Gestão de abastecimentos, consumo e despesas das viaturas."
        icone={Fuel}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Truck className="w-8 h-8 text-cyan-400 mb-3" />
          <h3 className="text-lg font-black text-white">
            Viaturas
          </h3>
          <p className="text-2xl font-black text-white mt-2">
            00
          </p>
        </SigCard>

        <SigCard>
          <Droplets className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">
            Litros Consumidos
          </h3>
          <p className="text-2xl font-black text-white mt-2">
            0 L
          </p>
        </SigCard>

        <SigCard>
          <Wallet className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">
            Despesas
          </h3>
          <p className="text-2xl font-black text-white mt-2">
            R$ 0,00
          </p>
        </SigCard>

        <SigCard>
          <BarChart3 className="w-8 h-8 text-purple-400 mb-3" />
          <h3 className="text-lg font-black text-white">
            Consumo Médio
          </h3>
          <p className="text-2xl font-black text-white mt-2">
            0 km/L
          </p>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex items-center gap-4">
          <Fuel className="w-12 h-12 text-cyan-400" />

          <div>
            <h2 className="text-xl font-black text-white">
              Módulo em Construção
            </h2>

            <p className="text-slate-400 mt-2">
              O controle de combustível permitirá registrar
              abastecimentos, calcular consumo das viaturas,
              gerar relatórios e acompanhar despesas operacionais.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-cyan-400" />

          <div>
            <h3 className="font-black text-white">
              Funcionalidades Futuras
            </h3>

            <ul className="text-slate-400 mt-3 space-y-2">
              <li>• Registro de abastecimentos.</li>
              <li>• Controle por viatura.</li>
              <li>• Consumo médio automático.</li>
              <li>• Gastos mensais e anuais.</li>
              <li>• Relatórios e gráficos.</li>
              <li>• Alertas de consumo excessivo.</li>
            </ul>
          </div>
        </div>
      </SigCard>
    </div>
  );
}