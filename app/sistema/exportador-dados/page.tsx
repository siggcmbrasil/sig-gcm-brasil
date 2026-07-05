"use client";

import {
  Database,
  Users,
  FileText,
  CarFront,
  Radio,
  ClipboardList,
  Download,
  History,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";
import ProtecaoModulo from "@/components/ProtecaoModulo";

export default function ExportadorDadosPage() {
  return (
  <ProtecaoModulo modulo="exportador_dados">
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Exportador de Dados"
        subtitulo="Exportação de dados, relatórios e backups do SIG-GCM Brasil."
        icone={Database}
      />

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SigActionCard
          href="/sistema/exportador-dados/guardas"
          titulo="Guardas"
          descricao="Exportar cadastro de guardas."
          icone={Users}
        />

        <SigActionCard
          href="/sistema/exportador-dados/ocorrencias"
          titulo="Ocorrências"
          descricao="Exportar ocorrências registradas."
          icone={FileText}
        />

        <SigActionCard
          href="/sistema/exportador-dados/viaturas"
          titulo="Viaturas"
          descricao="Exportar dados das viaturas."
          icone={CarFront}
        />

        <SigActionCard
          href="/sistema/exportador-dados/chamados"
          titulo="Chamados"
          descricao="Exportar chamados operacionais."
          icone={Radio}
        />

        <SigActionCard
          href="/sistema/exportador-dados/patrulhamentos"
          titulo="Patrulhamentos"
          descricao="Exportar patrulhamentos."
          icone={ClipboardList}
        />

        <SigActionCard
          href="/sistema/exportador-dados/completo"
          titulo="Exportação Completa"
          descricao="Exportar todos os dados do município."
          icone={Download}
        />

        <SigActionCard
          href="/sistema/exportador-dados/historico"
          titulo="Histórico"
          descricao="Visualizar exportações realizadas."
          icone={History}
        />
      </div>

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/30 p-4">
            <Database className="w-10 h-10 text-cyan-400" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">
              Central de Exportação
            </h2>

            <p className="text-slate-400 mt-2">
              Exporte informações operacionais, administrativas e relatórios
              do SIG-GCM Brasil de forma rápida e segura.
            </p>

            <div className="grid md:grid-cols-2 gap-3 mt-5">
              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
                <h3 className="font-bold text-white">
                  Exportação em JSON
                </h3>

                <p className="text-slate-400 text-sm mt-1">
                  Ideal para backups e integrações.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
                <h3 className="font-bold text-white">
                  Exportação em Excel
                </h3>

                <p className="text-slate-400 text-sm mt-1">
                  Relatórios para análise e impressão.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
                <h3 className="font-bold text-white">
                  Exportação Completa
                </h3>

                <p className="text-slate-400 text-sm mt-1">
                  Todos os dados do município em um único arquivo.
                </p>
              </div>

              <div className="rounded-xl bg-slate-900 border border-slate-800 p-4">
                <h3 className="font-bold text-white">
                  Auditoria
                </h3>

                <p className="text-slate-400 text-sm mt-1">
                  Todas as exportações ficam registradas no sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SigCard>
        </div>
  </ProtecaoModulo>
);
}