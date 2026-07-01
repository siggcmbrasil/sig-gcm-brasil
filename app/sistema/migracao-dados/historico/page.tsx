"use client";

import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  FileClock,
  FileSpreadsheet,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function HistoricoMigracaoPage() {
  const historico = [
    {
      data: "29/06/2026",
      municipio: "Biritinga-BA",
      origem: "Planilha Excel",
      registros: 128,
      usuario: "Desenvolvedor",
      status: "Concluída",
    },
    {
      data: "28/06/2026",
      municipio: "Cidade Modelo",
      origem: "Arquivo CSV",
      registros: 42,
      usuario: "Administrador",
      status: "Pendente",
    },
    {
      data: "27/06/2026",
      municipio: "Serrinha-BA",
      origem: "Sistema Externo",
      registros: 15,
      usuario: "Desenvolvedor",
      status: "Erro",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Histórico de Migrações"
        subtitulo="Registro de importações e migrações realizadas no SIG-GCM Brasil."
        icone={FileClock}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Database className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Migrações</h3>
          <p className="text-2xl font-black text-white mt-2">03</p>
        </SigCard>

        <SigCard>
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Concluídas</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
        </SigCard>

        <SigCard>
          <AlertTriangle className="w-8 h-8 text-orange-400 mb-3" />
          <h3 className="text-lg font-black text-white">Pendentes</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
        </SigCard>

        <SigCard>
          <XCircle className="w-8 h-8 text-red-400 mb-3" />
          <h3 className="text-lg font-black text-white">Com Erro</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Últimas Migrações
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Município</th>
                <th className="p-3 text-left">Origem</th>
                <th className="p-3 text-left">Registros</th>
                <th className="p-3 text-left">Usuário</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {historico.map((item, index) => (
                <tr key={index} className="text-slate-300">
                  <td className="p-3">{item.data}</td>
                  <td className="p-3">{item.municipio}</td>
                  <td className="p-3">{item.origem}</td>
                  <td className="p-3">{item.registros}</td>
                  <td className="p-3">{item.usuario}</td>
                  <td className="p-3">
                    <span
                      className={
                        item.status === "Concluída"
                          ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30"
                          : item.status === "Pendente"
                          ? "rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-400 border border-orange-500/30"
                          : "rounded-full bg-red-500/10 px-3 py-1 text-xs font-bold text-red-400 border border-red-500/30"
                      }
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
          Auditoria da Migração
        </h3>

        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
          <p>• Usuário responsável pela migração</p>
          <p>• Município de destino</p>
          <p>• Origem dos dados</p>
          <p>• Quantidade de registros importados</p>
          <p>• Registros com erro</p>
          <p>• Data e hora da execução</p>
          <p>• Relatório final da importação</p>
          <p>• Rastreamento para LGPD e segurança</p>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-center gap-4">
          <Clock className="w-10 h-10 text-slate-500" />

          <div>
            <h3 className="text-lg font-black text-white">
              Histórico Demonstrativo
            </h3>

            <p className="text-slate-400 mt-1">
              Futuramente esta tela buscará os registros reais da tabela de
              auditoria e migração do banco de dados.
            </p>
          </div>
        </div>
      </SigCard>
    </div>
  );
}