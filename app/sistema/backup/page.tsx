"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Database,
  Download,
  FileJson,
  Lock,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { gerarBackupAutomatico } from "@/lib/backup";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigActionCard from "@/components/sig/SigActionCard";

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
  tamanho: string | null;
  criado_em: string | null;
};

export default function BackupPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [gerando, setGerando] = useState(false);
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
          descricao: "Tentativa de acesso ao módulo de backup sem permissão.",
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
        descricao: "Acessou a Central de Backup.",
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
      .select("id, nome, arquivo_url, tipo, tamanho, criado_em")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 99);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Backup",
        acao: "ERRO",
        descricao: "Erro ao carregar backups.",
        tabela: "backups_sistema",
        detalhes: {
          erro: error.message,
          usuario_id: usuarioAtual.id,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar backups.");
      return;
    }

    setBackups(data || []);
  }

  async function criarBackup() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    setGerando(true);

    try {
      await gerarBackupAutomatico(usuario, "backup_manual");

      await registrarAuditoria({
        modulo: "Backup",
        acao: "CRIAR",
        descricao: "Criou backup manual do sistema.",
        tabela: "backups_sistema",
        detalhes: {
          usuario_id: usuario.id,
          municipio_id: usuario.municipio_id,
          tipo: "backup_manual",
        },
      });

      alert("Backup criado com sucesso.");
      await carregarBackups(usuario);
    } catch (error: any) {
      await registrarAuditoria({
        modulo: "Backup",
        acao: "ERRO",
        descricao: "Erro ao criar backup manual.",
        tabela: "backups_sistema",
        detalhes: {
          erro: error?.message || String(error),
          usuario_id: usuario.id,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao criar backup.");
    }

    setGerando(false);
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
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo="Acesso Restrito"
          subtitulo="Você não possui permissão para acessar Backup."
          icone={Lock}
        />

        <SigCard>
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Acesso negado
            </h2>

            <p className="text-slate-400 mt-2">
              Apenas perfis autorizados podem acessar backups do sistema.
            </p>
          </div>
        </SigCard>
      </div>
    );
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
              Todo backup respeita o município logado e gera auditoria para segurança dos dados.
            </p>
          </div>
        </div>
      </SigCard>

      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={criarBackup}
          disabled={gerando}
          className="rounded-2xl border border-slate-700 bg-slate-900 p-5 text-left hover:border-blue-500 transition disabled:opacity-50"
        >
          <Download className="w-8 h-8 text-blue-400 mb-3" />

          <h3 className="font-black text-white">Criar Backup</h3>

          <p className="text-sm text-slate-400 mt-1">
            {gerando ? "Gerando backup..." : "Gerar backup manual em JSON."}
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

            <p className="text-slate-400">Nenhum backup criado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950/40 p-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <FileJson className="w-6 h-6 text-green-400 mt-1 shrink-0" />

                  <div className="min-w-0">
                    <p className="font-bold text-white break-words">
                      {item.nome || "Backup sem nome"}
                    </p>

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