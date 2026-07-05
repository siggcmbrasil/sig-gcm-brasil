"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Database,
  Download,
  FileJson,
  Lock,
  Trash2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

type Backup = {
  id: number;
  nome: string | null;
  arquivo_url: string | null;
  tipo: string | null;
  modulo: string | null;
  formato: string | null;
  status: string | null;
  tamanho: string | null;
  observacao: string | null;
  criado_em: string | null;
};

export default function HistoricoBackupsPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      ) as UsuarioLogado;

      if (!dados?.id || !dados?.municipio_id) {
        setBloqueado(true);
        setCarregando(false);
        return;
      }

      if (
        ![
          "ADMIN",
          "COMANDANTE",
          "DIRETOR",
          "DESENVOLVEDOR",
        ].includes(dados.perfil || "")
      ) {
        await registrarAuditoria({
          modulo: "Backup",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso ao histórico de backups sem permissão.",
          tabela: "backups_sistema",
          detalhes: {
            usuario_id: dados.id,
            perfil: dados.perfil,
            municipio_id: dados.municipio_id,
          },
        });

        setBloqueado(true);
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Backup",
        acao: "ACESSO",
        descricao: "Acessou o histórico de backups.",
        tabela: "backups_sistema",
        detalhes: {
          usuario_id: dados.id,
          perfil: dados.perfil,
          municipio_id: dados.municipio_id,
        },
      });

      await carregarBackups(dados);
    }

    iniciar();
  }, []);

  function formatarDataHora(data: string | null) {
    if (!data) return "Data não informada";

    return new Date(data).toLocaleString("pt-BR", {
      timeZone: "America/Bahia",
    });
  }

  async function carregarBackups(usuarioAtual: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("backups_sistema")
      .select(
        "id, nome, arquivo_url, tipo, modulo, formato, status, tamanho, observacao, criado_em"
      )
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 499);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Backup",
        acao: "ERRO",
        descricao: "Erro ao carregar histórico de backups.",
        tabela: "backups_sistema",
        detalhes: {
          erro: error.message,
          usuario_id: usuarioAtual.id,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar histórico de backups.");
      return;
    }

    setBackups(data || []);
  }

  async function registrarDownload(item: Backup) {
    if (!usuario?.id || !usuario?.municipio_id) return;

    await registrarAuditoria({
      modulo: "Backup",
      acao: "EXPORTAR",
      descricao: `Baixou o backup ${item.nome || item.id}.`,
      tabela: "backups_sistema",
      registro_id: item.id,
      detalhes: {
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        backup: item,
      },
    });
  }

  async function excluirBackup(item: Backup) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    const motivo = prompt("Informe o motivo da exclusão do backup:");

    if (!motivo?.trim()) {
      alert("Informe o motivo da exclusão.");
      return;
    }

    if (!item.nome) {
      alert("Backup sem nome de arquivo.");
      return;
    }

    const { error: erroStorage } = await supabase.storage
      .from("backups")
      .remove([`${usuario.municipio_id}/${item.nome}`]);

    if (erroStorage) {
      await registrarAuditoria({
        modulo: "Backup",
        acao: "ERRO",
        descricao: "Erro ao excluir arquivo do backup no Storage.",
        tabela: "backups_sistema",
        registro_id: item.id,
        detalhes: {
          erro: erroStorage.message,
          motivo,
          backup: item,
        },
      });

      alert("Erro ao excluir arquivo do backup.");
      return;
    }

    const { error } = await supabase
      .from("backups_sistema")
      .delete()
      .eq("id", item.id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      await registrarAuditoria({
        modulo: "Backup",
        acao: "ERRO",
        descricao: "Erro ao excluir registro do backup.",
        tabela: "backups_sistema",
        registro_id: item.id,
        detalhes: {
          erro: error.message,
          motivo,
          backup: item,
        },
      });

      alert("Erro ao excluir backup.");
      return;
    }

    await registrarAuditoria({
      modulo: "Backup",
      acao: "EXCLUIR",
      descricao: `Excluiu o backup ${item.nome}.`,
      tabela: "backups_sistema",
      registro_id: item.id,
      detalhes: {
        motivo,
        backup: item,
      },
    });

    alert("Backup excluído.");
    await carregarBackups(usuario);
  }

  if (carregando) {
    return (
      <div className="p-4 md:p-6">
        <SigCard>
          <p className="text-slate-400">Carregando backups...</p>
        </SigCard>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <SigPageHeader
          titulo="Acesso Restrito"
          subtitulo="Você não possui permissão para acessar histórico de backups."
          icone={Lock}
        />

        <SigCard>
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Acesso negado
            </h2>

            <p className="text-slate-400 mt-2">
              Apenas perfis autorizados podem visualizar backups.
            </p>
          </div>
        </SigCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Histórico de Backups"
        subtitulo="Consulta dos backups gerados no município logado."
        icone={Clock}
      />

      <SigCard>
        {backups.length === 0 ? (
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
                <div className="flex items-start gap-3 min-w-0">
                  <FileJson className="w-7 h-7 text-green-400 mt-1 shrink-0" />

                  <div className="min-w-0">
                    <p className="font-black text-white break-words">
                      {item.nome || "Backup sem nome"}
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
                      <p className="text-sm text-slate-500 mt-1 break-words">
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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
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