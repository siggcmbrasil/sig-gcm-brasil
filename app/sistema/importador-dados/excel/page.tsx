"use client";

import {
  Download,
  FileSpreadsheet,
  FileUp,
  Table,
  Upload,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function ExcelPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Excel"
        subtitulo="Importação e exportação de planilhas XLS e XLSX."
        icone={Table}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <FileSpreadsheet className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Área do Desenvolvedor
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Importação de Planilhas
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Ferramenta preparada para importar e exportar dados através de
              arquivos Excel, facilitando migrações de outros sistemas e
              cadastros em massa no SIG-GCM Brasil.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <Upload className="w-8 h-8 text-yellow-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Importação
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Importação de planilhas XLS e XLSX.
          </p>
        </SigCard>

        <SigCard>
          <Download className="w-8 h-8 text-emerald-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Exportação
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Exportação de dados do sistema para Excel.
          </p>
        </SigCard>

        <SigCard>
          <FileSpreadsheet className="w-8 h-8 text-blue-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Modelos
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Modelos padronizados para importação.
          </p>
        </SigCard>
      </div>

      <SigCard>
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-8 text-center">
          <FileUp className="w-14 h-14 mx-auto text-slate-500 mb-4" />

          <h3 className="text-xl font-black text-white">
            Selecionar Planilha
          </h3>

          <p className="text-slate-400 mt-2">
            Escolha um arquivo Excel para iniciar a importação.
          </p>

          <input
            type="file"
            accept=".xls,.xlsx"
            className="mt-6 block w-full max-w-md mx-auto rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300"
          />

          <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-yellow-400 transition">
            <Upload className="w-5 h-5" />
            Importar Planilha
          </button>
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-lg font-black text-white">
          Dados suportados futuramente
        </h3>

        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
          <p>• Guardas Municipais</p>
          <p>• Usuários</p>
          <p>• Viaturas</p>
          <p>• Equipamentos</p>
          <p>• Escalas</p>
          <p>• Guarnições</p>
          <p>• Pessoas Abordadas</p>
          <p>• Veículos Abordados</p>
          <p>• Patrulhamentos</p>
          <p>• Ocorrências</p>
          <p>• Locais Estratégicos</p>
          <p>• Migração de outros sistemas</p>
        </div>
      </SigCard>
    </div>
  );
}