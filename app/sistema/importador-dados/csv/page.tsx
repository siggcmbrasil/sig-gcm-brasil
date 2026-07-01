"use client";

import {
  Download,
  FileSpreadsheet,
  Upload,
  Database,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";

export default function CSVPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="CSV"
        subtitulo="Importação e exportação de dados em formato CSV."
        icone={FileSpreadsheet}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Database className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Ferramenta Administrativa
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central CSV
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Ferramenta para importação, exportação e migração de dados
              entre municípios e sistemas compatíveis com o SIG-GCM Brasil.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SigActionCard
          href="#"
          titulo="Exportar Guardas"
          descricao="Gerar arquivo CSV dos guardas cadastrados."
          icone={Download}
        />

        <SigActionCard
          href="#"
          titulo="Exportar Ocorrências"
          descricao="Gerar arquivo CSV das ocorrências."
          icone={Download}
        />

        <SigActionCard
          href="#"
          titulo="Importar Dados"
          descricao="Importar planilhas para o sistema."
          icone={Upload}
        />

        <SigActionCard
          href="#"
          titulo="Modelos"
          descricao="Baixar modelos de importação."
          icone={FileSpreadsheet}
        />
      </div>

      <SigCard>
        <div className="text-center py-12">
          <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h3 className="text-xl font-black text-white">
            Módulo em Desenvolvimento
          </h3>

          <p className="text-slate-400 mt-2">
            Funcionalidades planejadas:
          </p>

          <div className="mt-6 grid md:grid-cols-2 gap-3 text-sm text-slate-400 text-left max-w-3xl mx-auto">
            <p>• Exportar Guardas</p>
            <p>• Exportar Viaturas</p>
            <p>• Exportar Equipamentos</p>
            <p>• Exportar Ocorrências</p>
            <p>• Exportar Pessoas Abordadas</p>
            <p>• Exportar Veículos Abordados</p>
            <p>• Importação em lote</p>
            <p>• Modelos CSV padronizados</p>
            <p>• Validação automática</p>
            <p>• Histórico de importações</p>
            <p>• Auditoria completa</p>
            <p>• Exportação por município</p>
          </div>
        </div>
      </SigCard>
    </div>
  );
}