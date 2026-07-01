"use client";

import {
  AlertTriangle,
  CheckCircle,
  Eye,
  FileCheck,
  FileSpreadsheet,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function PreviewImportacaoPage() {
  const dadosExemplo = [
    {
      nome: "Guarda Exemplo 01",
      matricula: "0001",
      cargo: "Guarda Municipal",
      status: "Válido",
    },
    {
      nome: "Guarda Exemplo 02",
      matricula: "0002",
      cargo: "Guarda Municipal",
      status: "Pendente",
    },
    {
      nome: "Guarda Exemplo 03",
      matricula: "0003",
      cargo: "Guarda Municipal",
      status: "Erro",
    },
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Pré-visualização"
        subtitulo="Conferência dos dados antes da importação definitiva."
        icone={Eye}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <FileCheck className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Validação de Importação
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Conferência Antes de Gravar
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Esta tela servirá para revisar registros importados de CSV ou
              Excel antes de salvar definitivamente no banco de dados.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <FileSpreadsheet className="w-8 h-8 text-yellow-400 mb-3" />
          <h3 className="text-lg font-black text-white">Registros</h3>
          <p className="text-2xl font-black text-white mt-2">03</p>
          <p className="text-sm text-slate-400 mt-1">Linhas detectadas</p>
        </SigCard>

        <SigCard>
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
          <h3 className="text-lg font-black text-white">Válidos</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
          <p className="text-sm text-slate-400 mt-1">Prontos para importar</p>
        </SigCard>

        <SigCard>
          <AlertTriangle className="w-8 h-8 text-orange-400 mb-3" />
          <h3 className="text-lg font-black text-white">Pendentes</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
          <p className="text-sm text-slate-400 mt-1">Precisam de revisão</p>
        </SigCard>

        <SigCard>
          <XCircle className="w-8 h-8 text-red-400 mb-3" />
          <h3 className="text-lg font-black text-white">Erros</h3>
          <p className="text-2xl font-black text-white mt-2">01</p>
          <p className="text-sm text-slate-400 mt-1">Não serão importados</p>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <h3 className="text-lg font-black text-white">
              Prévia dos Dados
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Exemplo visual da tabela que será importada.
            </p>
          </div>

          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-5 py-3 text-sm font-black text-slate-950 hover:bg-yellow-400 transition">
            <Upload className="w-5 h-5" />
            Confirmar Importação
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-300">
              <tr>
                <th className="p-3 text-left">Nome</th>
                <th className="p-3 text-left">Matrícula</th>
                <th className="p-3 text-left">Cargo</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800">
              {dadosExemplo.map((item, index) => (
                <tr key={index} className="text-slate-300">
                  <td className="p-3">{item.nome}</td>
                  <td className="p-3">{item.matricula}</td>
                  <td className="p-3">{item.cargo}</td>
                  <td className="p-3">
                    <span
                      className={
                        item.status === "Válido"
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
          Regras da Importação
        </h3>

        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
          <p>• Validar campos obrigatórios</p>
          <p>• Separar dados por município</p>
          <p>• Impedir duplicidade de matrícula</p>
          <p>• Conferir CPF, placa e telefone</p>
          <p>• Registrar auditoria da importação</p>
          <p>• Permitir importar apenas dados válidos</p>
        </div>
      </SigCard>
    </div>
  );
}