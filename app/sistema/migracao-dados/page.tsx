"use client";

import Link from "next/link";
import {
  ArrowRightLeft,
  Bot,
  Database,
  FileClock,
  ShieldCheck,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function MigracaoDadosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Migração de Dados"
        subtitulo="Ferramentas para importação e migração de informações para o SIG-GCM Brasil."
        icone={ArrowRightLeft}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Database className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Área do Desenvolvedor
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Central de Migração
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Ferramenta preparada para auxiliar municípios na migração de
              dados de outros sistemas para o SIG-GCM Brasil, com validação,
              auditoria e importação segura.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-4 gap-4">
  <SigCard>
    <h3 className="text-slate-400 text-sm">Migrações</h3>
    <p className="text-4xl font-black text-white mt-2">0</p>
  </SigCard>

  <SigCard>
    <h3 className="text-slate-400 text-sm">Guardas Importados</h3>
    <p className="text-4xl font-black text-cyan-400 mt-2">0</p>
  </SigCard>

  <SigCard>
    <h3 className="text-slate-400 text-sm">Ocorrências Importadas</h3>
    <p className="text-4xl font-black text-yellow-400 mt-2">0</p>
  </SigCard>

  <SigCard>
    <h3 className="text-slate-400 text-sm">Erros Encontrados</h3>
    <p className="text-4xl font-black text-red-400 mt-2">0</p>
  </SigCard>
</div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link
          href="/sistema/migracao-dados/assistente"
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 hover:border-yellow-500/60 transition"
        >
          <Bot className="w-10 h-10 text-yellow-400 mb-4" />

          <h3 className="text-xl font-black text-white">
            Assistente de Migração
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Guia passo a passo para importar dados de outros sistemas.
          </p>
        </Link>

        <Link
          href="/sistema/migracao-dados/historico"
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 hover:border-yellow-500/60 transition"
        >
          <FileClock className="w-10 h-10 text-yellow-400 mb-4" />

          <h3 className="text-xl font-black text-white">
            Histórico de Migrações
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Consulte todas as migrações realizadas no sistema.
          </p>
        </Link>
        <Link
  href="/sistema/importador-dados"
  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 hover:border-cyan-500/60 transition"
>
  <Database className="w-10 h-10 text-cyan-400 mb-4" />

  <h3 className="text-xl font-black text-white">
    Importador de Dados
  </h3>

  <p className="text-sm text-slate-400 mt-2">
    Importação de CSV, Excel e JSON.
  </p>
</Link>

<Link
  href="/sistema/migracao-dados/inconsistencias"
  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-6 hover:border-red-500/60 transition"
>
  <ShieldCheck className="w-10 h-10 text-red-400 mb-4" />

  <h3 className="text-xl font-black text-white">
    Inconsistências
  </h3>

  <p className="text-sm text-slate-400 mt-2">
    Verificar erros encontrados nas importações.
  </p>
</Link>
      </div>

      <SigCard>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-yellow-400" />
          Funcionalidades Planejadas
        </h3>

        <div className="mt-4 grid md:grid-cols-2 gap-3 text-sm text-slate-400">
          <p>• Migração de Guardas Municipais</p>
          <p>• Migração de Usuários</p>
          <p>• Migração de Viaturas</p>
          <p>• Migração de Equipamentos</p>
          <p>• Migração de Escalas</p>
          <p>• Migração de Ocorrências</p>
          <p>• Importação em CSV e Excel</p>
          <p>• Validação automática dos dados</p>
          <p>• Correção de duplicidades</p>
          <p>• Auditoria completa</p>
          <p>• Relatório de inconsistências</p>
          <p>• Importação por município</p>
          <p>• Importação de fotos e documentos</p>
          <p>• Importação de patrulhamentos</p>
          <p>• Migração automática do SIS</p>
          <p>• Assistente com IA</p>
          <p>• Detecção de campos incompatíveis</p>
          <p>• Backup antes da importação</p>
          <p>• Desfazer última migração</p>
          <p>• Importação em lote multi-município</p>
        </div>
      </SigCard>
    </div>
  );
}