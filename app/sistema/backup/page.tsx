"use client";

import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  Clock,
} from "lucide-react";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";

export default function BackupPage() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Backup do Sistema"
        subtitulo="Gerenciamento de backups e restauração do SIG-GCM Brasil."
        icone={Database}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-yellow-500/10 border border-yellow-500/30 p-4">
            <ShieldCheck className="w-10 h-10 text-yellow-400" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">
              Central de Backup
            </h2>

            <p className="text-slate-400 mt-2">
              Este módulo permitirá criar backups completos do sistema,
              restaurar dados e realizar exportações de segurança.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-3 gap-4">
        <SigActionCard
          href="#"
          titulo="Criar Backup"
          descricao="Gerar backup completo do banco de dados."
          icone={Download}
        />

        <SigActionCard
          href="#"
          titulo="Restaurar Backup"
          descricao="Importar um arquivo de backup."
          icone={Upload}
        />

        <SigActionCard
          href="#"
          titulo="Histórico"
          descricao="Visualizar backups anteriores."
          icone={Clock}
        />
      </div>

      <SigCard>
        <div className="text-center py-12">
          <Database className="w-16 h-16 mx-auto text-slate-600 mb-4" />

          <h3 className="text-xl font-bold text-white">
            Módulo em Desenvolvimento
          </h3>

          <p className="text-slate-400 mt-2">
            Futuramente será possível:
          </p>

          <ul className="mt-4 text-slate-400 space-y-2">
            <li>• Backup completo do banco de dados</li>
            <li>• Exportação em JSON e SQL</li>
            <li>• Backup automático agendado</li>
            <li>• Backup por município</li>
            <li>• Restauração seletiva de dados</li>
            <li>• Armazenamento em nuvem</li>
            <li>• Criptografia dos arquivos de backup</li>
          </ul>
        </div>
      </SigCard>
    </div>
  );
}