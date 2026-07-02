"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Database,
  Download,
  FileJson,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

export default function HistoricoBackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

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

  async function registrarAuditoria(
    acao: string,
    detalhes: string,
    registroId?: string
  ) {
    const usuario = usuarioLogado();

    await supabase.from("auditoria_sistema").insert({
      municipio_id: usuario.municipio_id,
      usuario_id: usuario.id,
      modulo: "BACKUP",
      acao,
      registro_id: registroId || null,
      detalhes,
    });
  }

  async function carregarBackups() {
    setCarregando(true);

    const usuario = usuarioLogado();

    const { data, error } = await supabase
      .from("backups_sistema")
      .select("*")
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error(error);
      alert("Erro ao carregar histórico de backups.");
      setCarregando(false);
      return;
    }

    setBackups(data || []);
    setCarregando(false);
  }

  async function registrarDownload(item: any) {
    await registrarAuditoria(
      "DOWNLOAD_BACKUP",
      `Download do backup: ${item.nome}`,
      item.id
    );
  }

  async function excluirBackup(item: any) {
  const confirmar = confirm(
    `Deseja excluir o backup ${item.nome}?`
  );

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
    `Excluiu o backup ${item.nome}`,
    item.id
  );

  alert("Backup excluído.");
  carregarBackups();
}

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Histórico de Backups"
        subtitulo="Consulta dos backups gerados no município logado."
        icone={Clock}
      />

      <SigCard>
        {carregando ? (
          <p className="text-slate-400">Carregando backups...</p>
        ) : backups.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 mx-auto text-slate-600 mb-4" />

            <h3 className="text-xl font-black text-white">
              Nenhum backup encontrado
            </h3>

            <p className="text-slate-400 mt-2">
              Quando um backup for criado, ele aparecerá aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <FileJson className="w-7 h-7 text-green-400 mt-1" />

                  <div>
                    <p className="font-black text-white">
                      {item.nome}
                    </p>

                    <p className="text-sm text-slate-400">
                      {formatarDataHora(item.criado_em)} •{" "}
                      {item.tipo || "MANUAL"} •{" "}
                      {item.modulo || "COMPLETO"} •{" "}
                      {item.formato || "JSON"}
                    </p>

                    <p className="text-sm text-slate-500">
                      Status: {item.status || "GERADO"} • Tamanho:{" "}
                      {item.tamanho || "não informado"}
                    </p>

                    {item.observacao && (
                      <p className="text-sm text-slate-500 mt-1">
                        {item.observacao}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.arquivo_url && (
                    <a
                      href={item.arquivo_url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => registrarDownload(item)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
                    >
                      <Download className="w-4 h-4" />
                      Baixar
                    </a>
                  )}

                  <button
  type="button"
  onClick={() => excluirBackup(item)}
  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
>
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