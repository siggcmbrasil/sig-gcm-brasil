"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  FileText,
  Lock,
  Search,
  Shield,
  UserCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: number;
  perfil?: string;
  municipio_id: number;
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [consultas, setConsultas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");
  const [moduloFiltro, setModuloFiltro] = useState("");
  const [acaoFiltro, setAcaoFiltro] = useState("");
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
          modulo: "Auditoria",
          acao: "ACESSO_NEGADO",
          descricao: "Tentativa de acesso à Central de Auditoria sem permissão.",
          tabela: "auditoria",
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
        modulo: "Auditoria",
        acao: "ACESSO",
        descricao: "Acessou a Central de Auditoria.",
        tabela: "auditoria",
        detalhes: {
          usuario_id: usuario.id,
          perfil: usuario.perfil,
          municipio_id: usuario.municipio_id,
        },
      });

      await carregar(usuario);
    }

    iniciar();
  }, []);

  async function carregar(usuario: UsuarioLogado) {
    setCarregando(true);

    const { data: logsData, error: erroLogs } = await supabase
      .from("auditoria")
      .select(
        "id, usuario_nome, modulo, acao, descricao, criado_em, municipio_id"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 499);

    const { data: consultasData, error: erroConsultas } = await supabase
      .from("consultas_operacionais")
      .select(
        "id, tipo, consulta, motivo, resultado, criado_em, municipio_id"
      )
      .eq("municipio_id", usuario.municipio_id)
      .order("criado_em", { ascending: false })
      .range(0, 499);

    setCarregando(false);

    if (erroLogs || erroConsultas) {
      await registrarAuditoria({
        modulo: "Auditoria",
        acao: "ERRO",
        descricao: "Erro ao carregar Central de Auditoria.",
        tabela: "auditoria",
        detalhes: {
          erro_logs: erroLogs?.message,
          erro_consultas: erroConsultas?.message,
          municipio_id: usuario.municipio_id,
        },
      });

      alert("Erro ao carregar auditoria.");
      return;
    }

    setLogs(logsData || []);
    setConsultas(consultasData || []);
  }

  const logsFiltrados = useMemo(() => {
    return logs.filter((item) => {
      const texto = `
        ${item.usuario_nome || ""}
        ${item.descricao || ""}
        ${item.modulo || ""}
        ${item.acao || ""}
      `.toLowerCase();

      return (
        texto.includes(busca.toLowerCase()) &&
        (!moduloFiltro || item.modulo === moduloFiltro) &&
        (!acaoFiltro || item.acao === acaoFiltro)
      );
    });
  }, [logs, busca, moduloFiltro, acaoFiltro]);

  const modulos = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.modulo).filter(Boolean)));
  }, [logs]);

  const acoes = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.acao).filter(Boolean)));
  }, [logs]);

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
      <div className="p-4 md:p-6 pb-24 space-y-6">
        <SigPageHeader
          titulo="Acesso Restrito"
          subtitulo="Você não possui permissão para acessar a Central de Auditoria."
          icone={Lock}
        />

        <SigCard>
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto text-red-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Acesso negado
            </h2>

            <p className="text-slate-400 mt-2">
              Apenas perfis autorizados podem visualizar auditorias e consultas.
            </p>
          </div>
        </SigCard>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Auditoria do Sistema"
        subtitulo="Registro completo das ações realizadas no SIG-GCM Brasil."
        icone={Shield}
      />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <ResumoCard titulo="Logs" valor={logs.length} icone={Activity} />
        <ResumoCard titulo="Consultas" valor={consultas.length} icone={Search} />
        <ResumoCard titulo="Módulos" valor={modulos.length} icone={FileText} />
        <ResumoCard
          titulo="Usuários"
          valor={new Set(logs.map((l) => l.usuario_nome).filter(Boolean)).size}
          icone={UserCheck}
        />
      </div>

      <SigCard>
        <div className="grid md:grid-cols-3 gap-3">
          <input
            className="input"
            placeholder="Pesquisar por usuário, descrição, módulo ou ação..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="input"
            value={moduloFiltro}
            onChange={(e) => setModuloFiltro(e.target.value)}
          >
            <option value="">Todos os módulos</option>
            {modulos.map((modulo) => (
              <option key={String(modulo)} value={String(modulo)}>
                {String(modulo)}
              </option>
            ))}
          </select>

          <select
            className="input"
            value={acaoFiltro}
            onChange={(e) => setAcaoFiltro(e.target.value)}
          >
            <option value="">Todas as ações</option>
            {acoes.map((acao) => (
              <option key={String(acao)} value={String(acao)}>
                {String(acao)}
              </option>
            ))}
          </select>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Consultas Operacionais
        </h2>

        {consultas.length === 0 ? (
          <p className="text-slate-400">
            Nenhuma consulta operacional registrada.
          </p>
        ) : (
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {consultas.map((item) => (
              <div
                key={`consulta-${item.id}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge texto={item.tipo || "TIPO"} cor="yellow" />
                  <Badge texto="CONSULTA OPERACIONAL" cor="blue" />
                  <Badge
                    texto={item.resultado || "EM_DESENVOLVIMENTO"}
                    cor="slate"
                  />
                </div>

                <p className="font-bold text-white">
                  Consulta: {item.consulta}
                </p>

                <p className="text-slate-300 mt-2">
                  Motivo: {item.motivo || "-"}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  {item.criado_em
                    ? new Date(item.criado_em).toLocaleString("pt-BR")
                    : "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Registros de Auditoria
        </h2>

        {logsFiltrados.length === 0 ? (
          <p className="text-slate-400">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <div className="space-y-3">
            {logsFiltrados.map((item) => (
              <div
                key={`log-${item.id}`}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge texto={item.acao || "AÇÃO"} cor="blue" />
                  <Badge texto={item.modulo || "MÓDULO"} cor="yellow" />
                </div>

                <p className="font-bold text-white">
                  {item.usuario_nome || "Usuário não informado"}
                </p>

                <p className="text-slate-300 mt-2">
                  {item.descricao || "-"}
                </p>

                <p className="text-xs text-slate-500 mt-3">
                  {item.criado_em
                    ? new Date(item.criado_em).toLocaleString("pt-BR")
                    : "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}

function ResumoCard({
  titulo,
  valor,
  icone: Icone,
}: {
  titulo: string;
  valor: number;
  icone: any;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 min-h-[110px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{titulo}</p>
          <h2 className="text-3xl font-black text-white mt-1">{valor}</h2>
        </div>

        <Icone className="w-7 h-7 text-blue-400" />
      </div>
    </div>
  );
}

function Badge({
  texto,
  cor,
}: {
  texto: string;
  cor: "blue" | "yellow" | "slate";
}) {
  const cores = {
    blue: "bg-blue-700 text-white",
    yellow: "bg-yellow-700 text-white",
    slate: "bg-slate-700 text-white",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${cores[cor]}`}>
      {texto}
    </span>
  );
}