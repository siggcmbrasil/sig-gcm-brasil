"use client";

import { useEffect, useState } from "react";
import {
  Database,
  Download,
  Upload,
  ShieldCheck,
  Clock,
  Lock,
  FileJson,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";
import { gerarBackupAutomatico } from "@/lib/backup";

export default function BackupPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    carregarBackups();
  }, []);

  function usuarioLogado() {
    return JSON.parse(localStorage.getItem("usuarioLogado") || "{}");
  }

  function formatarDataHora(data: string) {
    if (!data) return "Data não informada";

    return new Date(data).toLocaleString("pt-BR", {
      timeZone: "America/Bahia",
    });
  }

  async function registrarAuditoria(acao: string, detalhes: string) {
    const usuario = usuarioLogado();

    await supabase.from("auditoria_sistema").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario.id,
      modulo: "BACKUP",
      acao,
      detalhes,
    });
  }

  async function carregarBackups() {
    const usuario = usuarioLogado();

    const { data } = await supabase
      .from("backups_sistema")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    setBackups(data || []);
  }

  async function criarBackup() {
    setCarregando(true);

    try {
      const usuario = usuarioLogado();

      await gerarBackupAutomatico(usuario, "backup_manual");

      await registrarAuditoria("CRIAR_BACKUP", "Backup manual criado.");

      alert("Backup criado com sucesso.");
      await carregarBackups();
    } catch (error) {
      console.error(error);

      await registrarAuditoria("ERRO_BACKUP", "Erro ao criar backup.");

      alert("Erro ao criar backup.");
    }

    setCarregando(false);
  }

  async function registrarDownload(item: any) {
    await registrarAuditoria(
      "DOWNLOAD_BACKUP",
      `Baixou o backup ${item.nome}`
    );
  }

  async function excluirBackup(item: any) {
    const confirmar = confirm(`Deseja excluir o backup ${item.nome}?`);

    if (!confirmar) return;

    const usuario = usuarioLogado();

    await supabase.storage
      .from("backups")
      .remove([`${usuario.municipio_id}/${item.nome}`]);

    const { error } = await supabase
      .from("backups_sistema")
      .delete()
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      console.error(error);
      alert("Erro ao excluir backup.");
      return;
    }

    await registrarAuditoria(
      "EXCLUIR_BACKUP",
      `Excluiu o backup ${item.nome}`
    );

    alert("Backup excluído.");
    await carregarBackups();
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Backup do Sistema"
        subtitulo="Gerenciamento de backups, restauração e segurança do SIG-GCM Brasil."
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
              Todo backup respeita o município logado e gera registro de
              auditoria para segurança dos dados.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={criarBackup}
          disabled={carregando}
          className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-left hover:border-blue-500 transition disabled:opacity-50"
        >
          <Download className="w-8 h-8 text-blue-400 mb-3" />

          <h3 className="font-black text-white">Criar Backup</h3>

          <p className="text-sm text-slate-400 mt-1">
            {carregando ? "Gerando backup..." : "Gerar backup manual em JSON."}
          </p>
        </button>

        <SigActionCard
          href="/sistema/backup/restaurar"
          titulo="Restaurar Backup"
          descricao="Importar arquivo com autorização."
          icone={Upload}
        />

        <SigActionCard
          href="/sistema/backup/auditoria"
          titulo="Auditoria"
          descricao="Ver ações realizadas no módulo."
          icone={Lock}
        />
      </div>

      <SigCard>
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-blue-400" />

          <h3 className="text-xl font-black text-white">
            Últimos Backups
          </h3>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 mx-auto text-slate-600 mb-4" />

            <p className="text-slate-400">
              Nenhum backup criado ainda.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4"
              >
                <div className="flex items-start gap-3">
                  <FileJson className="w-6 h-6 text-green-400 mt-1" />

                  <div>
                    <p className="font-bold text-white">{item.nome}</p>

                    <p className="text-sm text-slate-400">
                      {formatarDataHora(item.criado_em)} •{" "}
                      {item.tipo || "MANUAL"} •{" "}
                      {item.tamanho || "sem tamanho"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.arquivo_url && (
                    <a
                      href={item.arquivo_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => registrarDownload(item)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => excluirBackup(item)}
                    className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}