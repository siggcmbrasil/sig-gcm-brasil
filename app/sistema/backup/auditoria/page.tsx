"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, Search, ShieldCheck } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigCard from "@/components/sig/SigCard";
import SigPageHeader from "@/components/sig/SigPageHeader";

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

type LogBackup = {
  id: number;
  municipio_id: number | null;
  usuario_id: number | null;
  registro_id: number | null;
  modulo: string | null;
  acao: string | null;
  detalhes: string | null;
  criado_em: string | null;
};

export default function AuditoriaBackupPage() {
  const [logs, setLogs] = useState<LogBackup[]>([]);
  const [busca, setBusca] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    async function iniciar() {
      const usuario = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      ) as UsuarioLogado;

      if (!usuario?.id || !usuario?.municipio_id) {
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
        ].includes(usuario.perfil || "")
      ) {
        await registrarAuditoria({
          modulo: "Backup",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso à auditoria de backups sem permissão.",
          tabela: "auditoria_sistema",
          detalhes: {
            usuario_id: usuario.id,
            perfil: usuario.perfil,
            municipio_id: usuario.municipio_id,
          },
        });

        setBloqueado(true);
        setCarregando(false);
        return;
      }

      await registrarAuditoria({
        modulo: "Backup",
        acao: "ACESSO",
        descricao: "Acessou a auditoria de backups.",
        tabela: "auditoria_sistema",
        detalhes: {
          usuario_id: usuario.id,
          perfil: usuario.perfil,
          municipio_id: usuario.municipio_id,
        },
      });

      await carregarAuditoria(usuario);
    }

    iniciar();
  }, []);

  async function carregarAuditoria(usuario: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("auditoria_sistema")
      .select(
        "id, municipio_id, usuario_id, registro_id, modulo, acao, detalhes, criado_em"
      )
      .eq("municipio_id", usuario.municipio_id)
      .eq("modulo", "BACKUP")
      .order("criado_em", { ascending: false })
      .range(0, 499);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Backup",
        acao: "ERRO",
        descricao: "Erro ao carregar auditoria de backups.",
        tabela: "auditoria_sistema",
        detalhes: {
          erro: error.message,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao carregar auditoria de backups.");
      return;
    }

    setLogs(data || []);
  }

  const filtrados = useMemo(() => {
    return logs.filter((item) => {
      const texto = `
        ${item.acao || ""}
        ${item.detalhes || ""}
        ${item.registro_id || ""}
        ${item.usuario_id || ""}
      `.toLowerCase();

      return texto.includes(busca.toLowerCase());
    });
  }, [logs, busca]);

  if (carregando) {
    return (
      <div className="p-4 md:p-6">
        <SigCard>
          <p className="text-slate-400">Carregando auditoria...</p>
        </SigCard>
      </div>
    );
  }

  if (bloqueado) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <SigPageHeader
          titulo="Acesso Restrito"
          subtitulo="Você não possui permissão para acessar auditoria de backups."
          icone={Lock}
        />

        <SigCard>
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Acesso negado
            </h2>

            <p className="text-slate-400 mt-2">
              Apenas perfis autorizados podem visualizar esta auditoria.
            </p>
          </div>
        </SigCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Auditoria de Backups"
        subtitulo="Registro das ações realizadas no módulo de backup."
        icone={Lock}
      />

      <SigCard>
        <div className="flex items-center gap-3 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4">
          <ShieldCheck className="w-8 h-8 text-blue-400" />

          <div>
            <h2 className="text-lg font-black text-white">
              Segurança e rastreabilidade
            </h2>

            <p className="text-sm text-slate-400">
              Aqui ficam registradas ações como criação, download, restauração,
              exclusão e erros no módulo de backup.
            </p>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />

          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por ação, detalhe, usuário ou registro..."
            className="input pl-12"
          />
        </div>
      </SigCard>

      <SigCard>
        {filtrados.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-slate-600 mb-4" />

            <h3 className="text-xl font-black text-white">
              Nenhum registro encontrado
            </h3>

            <p className="text-slate-400 mt-2">
              As ações de backup aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtrados.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-700 bg-slate-950/50 p-4"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <div>
                    <p className="font-black text-white">
                      {item.acao || "AÇÃO NÃO INFORMADA"}
                    </p>

                    <p className="text-sm text-slate-400 mt-1">
                      {item.detalhes || "Sem detalhes informados."}
                    </p>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">
                    {item.criado_em
                      ? new Date(item.criado_em).toLocaleString("pt-BR")
                      : "-"}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-500">
                  <p>Município: {item.municipio_id || "—"}</p>
                  <p>Usuário: {item.usuario_id || "—"}</p>
                  <p>Registro: {item.registro_id || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}