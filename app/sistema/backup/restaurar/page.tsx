"use client";

import { useEffect, useState } from "react";
import { FileJson, Lock, ShieldAlert, Upload } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import { gerarBackupAutomatico } from "@/lib/backup";

import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

export default function RestaurarBackupPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [restaurando, setRestaurando] = useState(false);
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

      if (!["ADMIN", "DESENVOLVEDOR"].includes(dados.perfil || "")) {
        await registrarAuditoria({
          modulo: "Backup",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso à restauração de backup sem permissão.",
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
        descricao: "Acessou a tela de restauração de backup.",
        tabela: "backups_sistema",
        detalhes: {
          usuario_id: dados.id,
          perfil: dados.perfil,
          municipio_id: dados.municipio_id,
        },
      });

      setCarregando(false);
    }

    iniciar();
  }, []);

  async function restaurarBackup() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    if (!arquivo) {
      alert("Selecione um arquivo de backup.");
      return;
    }

    if (!arquivo.name.toLowerCase().endsWith(".json")) {
      alert("Somente arquivos JSON são permitidos.");
      return;
    }

    if (arquivo.size > 20 * 1024 * 1024) {
      alert("Arquivo muito grande. Limite máximo: 20MB.");
      return;
    }

    const motivo = prompt("Informe o motivo da restauração:");

    if (!motivo?.trim()) {
      alert("Informe o motivo da restauração.");
      return;
    }

    const confirmar = confirm(
      "Atenção: restauração de backup é uma ação crítica. Um backup de segurança será criado antes da restauração. Deseja continuar?"
    );

    if (!confirmar) return;

    setRestaurando(true);

    try {
      const texto = await arquivo.text();
      const dados = JSON.parse(texto);

      if (!dados || typeof dados !== "object") {
        throw new Error("Arquivo JSON inválido.");
      }

      if (Number(dados.municipio_id) !== Number(usuario.municipio_id)) {
        await registrarAuditoria({
          modulo: "Backup",
          acao: "ERRO",
          descricao: "Tentativa de restaurar backup de outro município.",
          tabela: "backups_sistema",
          detalhes: {
            arquivo: arquivo.name,
            municipio_backup: dados?.municipio_id,
            municipio_usuario: usuario.municipio_id,
            motivo,
          },
        });

        alert("Este backup pertence a outro município.");
        setRestaurando(false);
        return;
      }

      await gerarBackupAutomatico(usuario, "pre_restauracao");

      if (Array.isArray(dados.guardas) && dados.guardas.length > 0) {
        await supabase.from("guardas").upsert(dados.guardas);
      }

      if (Array.isArray(dados.ocorrencias) && dados.ocorrencias.length > 0) {
        await supabase.from("ocorrencias").upsert(dados.ocorrencias);
      }

      if (Array.isArray(dados.viaturas) && dados.viaturas.length > 0) {
        await supabase.from("viaturas").upsert(dados.viaturas);
      }

      if (Array.isArray(dados.chamados) && dados.chamados.length > 0) {
        await supabase.from("chamados").upsert(dados.chamados);
      }

      if (Array.isArray(dados.patrulhamentos) && dados.patrulhamentos.length > 0) {
        await supabase.from("patrulhamentos").upsert(dados.patrulhamentos);
      }

      await registrarAuditoria({
        modulo: "Backup",
        acao: "RESTAURAR",
        descricao: `Restaurou backup: ${arquivo.name}.`,
        tabela: "backups_sistema",
        detalhes: {
          arquivo: arquivo.name,
          motivo,
          municipio_id: usuario.municipio_id,
          usuario_id: usuario.id,
          totais: {
            guardas: dados.guardas?.length || 0,
            ocorrencias: dados.ocorrencias?.length || 0,
            viaturas: dados.viaturas?.length || 0,
            chamados: dados.chamados?.length || 0,
            patrulhamentos: dados.patrulhamentos?.length || 0,
          },
        },
      });

      alert("Backup restaurado com sucesso.");
      setArquivo(null);
    } catch (error: any) {
      await registrarAuditoria({
        modulo: "Backup",
        acao: "ERRO",
        descricao: "Erro ao restaurar backup.",
        tabela: "backups_sistema",
        detalhes: {
          erro: error?.message || String(error),
          arquivo: arquivo.name,
          usuario_id: usuario.id,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao ler ou restaurar o arquivo de backup.");
    }

    setRestaurando(false);
  }

  if (carregando) {
    return (
      <div className="p-4 md:p-6">
        <SigCard>
          <p className="text-slate-400">Carregando restauração...</p>
        </SigCard>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <SigPageHeader
          titulo="Acesso Restrito"
          subtitulo="Você não possui permissão para restaurar backups."
          icone={Lock}
        />

        <SigCard>
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Acesso negado
            </h2>

            <p className="text-slate-400 mt-2">
              Apenas ADMIN ou DESENVOLVEDOR podem restaurar backups.
            </p>
          </div>
        </SigCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Restaurar Backup"
        subtitulo="Importação controlada de arquivos de backup do SIG-GCM Brasil."
        icone={Upload}
      />

      <SigCard>
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white">
              Ação Sensível
            </h2>

            <p className="text-slate-400 mt-2">
              A restauração exige permissão elevada, motivo obrigatório,
              validação de município e backup automático antes da alteração.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-8 text-center">
            <FileJson className="w-14 h-14 mx-auto text-blue-400 mb-4" />

            <h3 className="text-xl font-black text-white">
              Selecionar arquivo JSON
            </h3>

            <p className="text-slate-400 mt-2">
              Escolha um arquivo de backup gerado pelo SIG-GCM Brasil.
            </p>

            <input
              type="file"
              accept=".json"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              className="mt-6 text-sm text-slate-300"
            />

            {arquivo && (
              <p className="text-green-400 text-sm mt-4">
                Arquivo selecionado: {arquivo.name}
              </p>
            )}
          </div>

          <button
            onClick={restaurarBackup}
            disabled={restaurando}
            className="w-full rounded-2xl bg-red-600 px-5 py-4 font-black text-white hover:bg-red-500 disabled:opacity-50"
          >
            {restaurando ? "Restaurando backup..." : "Validar e Restaurar Backup"}
          </button>
        </div>
      </SigCard>
    </div>
  );
}