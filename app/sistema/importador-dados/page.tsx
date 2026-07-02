"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Database,
  Eye,
  FileSpreadsheet,
  FileUp,
  ShieldCheck,
  Table,
  Upload,
  History,
  FileJson,
  Users,
  CarFront,
  MapPin,
  ClipboardList,
  User,
  Shield,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function ImportadorDadosPage() {
  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Importador de Dados"
        subtitulo="Importação controlada de dados para o SIG-GCM Brasil."
        icone={FileUp}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <Database className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-yellow-400 font-bold">
              Área Administrativa
            </p>

            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Importação Segura de Dados
            </h2>

            <p className="text-slate-400 mt-2 max-w-3xl leading-relaxed">
              Importe planilhas, cadastros e dados administrativos de forma
              controlada, com validação, auditoria, pré-visualização e
              separação automática por município.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-3 gap-4">
        <SigCard>
          <FileSpreadsheet className="w-8 h-8 text-yellow-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Planilhas
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Suporte para CSV, XLS, XLSX e modelos padronizados.
          </p>
        </SigCard>

        <SigCard>
          <ShieldCheck className="w-8 h-8 text-emerald-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Validação
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Verificação de dados antes da gravação no banco.
          </p>
        </SigCard>

        <SigCard>
          <AlertTriangle className="w-8 h-8 text-orange-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Auditoria
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Toda importação gera registros de segurança.
          </p>
        </SigCard>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Link
          href="/sistema/importador-dados/csv"
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 hover:border-yellow-500/60 transition"
        >
          <FileSpreadsheet className="w-8 h-8 text-yellow-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            CSV
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Importar arquivos CSV.
          </p>
        </Link>

        <Link
          href="/sistema/importador-dados/excel"
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 hover:border-emerald-500/60 transition"
        >
          <Table className="w-8 h-8 text-emerald-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Excel
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Importar planilhas XLS e XLSX.
          </p>
        </Link>

        <Link
          href="/sistema/importador-dados/json"
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 hover:border-cyan-500/60 transition"
        >
          <FileJson className="w-8 h-8 text-cyan-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            JSON
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Importar arquivos JSON.
          </p>
        </Link>

        <Link
          href="/sistema/importador-dados/preview"
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 hover:border-purple-500/60 transition"
        >
          <Eye className="w-8 h-8 text-purple-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Pré-visualização
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Conferir os dados antes de importar.
          </p>
        </Link>

        <Link
          href="/sistema/importador-dados/historico"
          className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 hover:border-orange-500/60 transition"
        >
          <History className="w-8 h-8 text-orange-400 mb-3" />

          <h3 className="text-lg font-black text-white">
            Histórico
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Consultar importações realizadas.
          </p>
        </Link>
      </div>

      <SigCard>
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/70 p-8 text-center">
          <Upload className="w-14 h-14 mx-auto text-slate-500 mb-4" />

          <h3 className="text-xl font-black text-white">
            Enviar Arquivo
          </h3>

          <p className="text-slate-400 mt-2">
            Selecione um arquivo para iniciar a importação.
          </p>

          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            className="mt-6 block w-full max-w-md mx-auto rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300"
          />

          <button className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-6 py-3 text-sm font-black text-slate-950 hover:bg-yellow-400 transition">
            <Upload className="w-5 h-5" />
            Importar Dados
          </button>
        </div>
      </SigCard>

      <SigCard>
        <h3 className="text-xl font-black text-white">
          Tipos de Dados Suportados
        </h3>

        <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            <Users className="text-cyan-400" />
            Guardas Municipais
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            <User className="text-cyan-400" />
            Usuários
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            <CarFront className="text-cyan-400" />
            Viaturas
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            <Shield className="text-cyan-400" />
            Equipamentos
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            <MapPin className="text-cyan-400" />
            Locais Estratégicos
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            <ClipboardList className="text-cyan-400" />
            Escalas e Guarnições
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            🚔 Patrulhamentos
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            🚨 Ocorrências
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            🧍 Pessoas Abordadas
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            🚗 Veículos Abordados
          </div>

          <div className="rounded-xl bg-slate-900 p-4 border border-slate-800 flex items-center gap-3">
            🔄 Dados de Outros Sistemas
          </div>
        </div>
      </SigCard>
    </div>
  );
}