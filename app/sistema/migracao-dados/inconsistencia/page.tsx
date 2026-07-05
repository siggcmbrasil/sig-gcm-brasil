"use client";

import {
  AlertTriangle,
  FileWarning,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function InconsistenciasPage() {
  const inconsistencias = [
    {
      tipo: "CPF duplicado",
      detalhe: "João Silva - 123.456.789-00",
      status: "Pendente",
    },
    {
      tipo: "Matrícula duplicada",
      detalhe: "Matrícula 001 cadastrada duas vezes",
      status: "Erro",
    },
    {
      tipo: "Campo obrigatório vazio",
      detalhe: "Nome do guarda não informado",
      status: "Pendente",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Inconsistências"
        subtitulo="Erros e divergências encontradas durante as migrações."
        icone={FileWarning}
      />

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <AlertTriangle className="w-8 h-8 text-orange-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Pendentes
          </h3>

          <p className="text-2xl font-black text-white mt-2">
            02
          </p>
        </SigCard>

        <SigCard>
          <XCircle className="w-8 h-8 text-red-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Erros
          </h3>

          <p className="text-2xl font-black text-white mt-2">
            01
          </p>
        </SigCard>

        <SigCard>
          <ShieldCheck className="w-8 h-8 text-cyan-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Corrigidos
          </h3>

          <p className="text-2xl font-black text-white mt-2">
            00
          </p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Inconsistências Encontradas
        </h3>

        <div className="space-y-4">
          {inconsistencias.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-black text-white">
                    {item.tipo}
                  </h4>

                  <p className="text-slate-400 mt-2">
                    {item.detalhe}
                  </p>
                </div>

                <span
                  className={
                    item.status === "Pendente"
                      ? "rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30"
                      : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/30"
                  }
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-lg font-black text-white">
          Futuramente
        </h3>

        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
          <p>• Correção automática de duplicidades</p>
          <p>• Mesclagem de registros</p>
          <p>• Sugestões por IA</p>
          <p>• Correção em lote</p>
          <p>• Exportação dos erros encontrados</p>
          <p>• Reprocessar importação</p>
          <p>• Relatório completo das inconsistências</p>
          <p>• Auditoria de todas as correções</p>
        </div>
      </SigCard>
    </div>
  );
}