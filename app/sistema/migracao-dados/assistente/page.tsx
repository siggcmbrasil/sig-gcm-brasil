"use client";

import {
  Bot,
  CheckCircle,
  Database,
  FileSpreadsheet,
  ShieldCheck,
  Upload,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigButton from "@/components/sig/SigButton";

export default function AssistenteMigracaoPage() {
  const etapas = [
    "Selecionar o tipo de importação",
    "Enviar o arquivo CSV ou Excel",
    "Validar os dados encontrados",
    "Corrigir inconsistências",
    "Pré-visualizar os registros",
    "Executar a importação",
    "Gerar relatório final",
  ];

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Assistente de Migração"
        subtitulo="Importação guiada de dados para o SIG-GCM Brasil."
        icone={Bot}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Bot className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Assistente Inteligente
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Migração Guiada
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              O assistente irá conduzir o processo de migração passo a passo,
              validando os dados e reduzindo erros durante a importação.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <Database className="w-8 h-8 text-yellow-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Sistemas
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Importação de dados de outros sistemas.
          </p>
        </SigCard>

        <SigCard>
          <FileSpreadsheet className="w-8 h-8 text-emerald-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Planilhas
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Suporte para CSV, XLS e XLSX.
          </p>
        </SigCard>

        <SigCard>
          <ShieldCheck className="w-8 h-8 text-blue-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Segurança
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Auditoria completa da importação.
          </p>
        </SigCard>

        <SigCard>
          <Upload className="w-8 h-8 text-orange-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Importação
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Processo automatizado e assistido.
          </p>
        </SigCard>
      </div>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Etapas da Migração
        </h3>

        <div className="space-y-3">
          {etapas.map((etapa, index) => (
            <div
              key={index}
              className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500 text-slate-950 font-black">
                {index + 1}
              </div>

              <div>
                <p className="font-bold text-white">
                  {etapa}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-xl font-black text-white mb-5">
          Dados Suportados Futuramente
        </h3>

        <div className="grid md:grid-cols-2 gap-3 text-sm text-slate-400">
          <p>• Guardas Municipais</p>
          <p>• Usuários</p>
          <p>• Viaturas</p>
          <p>• Equipamentos</p>
          <p>• Ocorrências</p>
          <p>• Pessoas Abordadas</p>
          <p>• Veículos Abordados</p>
          <p>• Patrulhamentos</p>
          <p>• Escalas</p>
          <p>• Guarnições</p>
          <p>• Locais Estratégicos</p>
          <p>• Dados de outros sistemas</p>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <CheckCircle className="w-14 h-14 text-yellow-400 mb-4" />

          <h3 className="text-xl font-black text-white">
            Assistente em Desenvolvimento
          </h3>

          <p className="text-slate-400 mt-2 max-w-2xl">
            Futuramente o assistente realizará toda a migração de forma
            automática, analisando os arquivos e sugerindo correções antes da
            importação definitiva.
          </p>

          <div className="mt-6">
            <SigButton>
              Iniciar Assistente
            </SigButton>
          </div>
        </div>
      </SigCard>
    </div>
  );
}