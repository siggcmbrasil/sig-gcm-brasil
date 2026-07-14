"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: number;
  nome?: string;
  perfil?: string;
  municipio_id: number;
};

type AlertaOperacional = {
  id: number;
  municipio_id: number;
  titulo: string;
  mensagem: string;
  nivel: "BAIXO" | "MEDIO" | "ALTO" | string;
  origem: string | null;
  ativo: boolean;
  criado_em: string | null;
};

export default function AlertasPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [alertas, setAlertas] = useState<AlertaOperacional[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("TODOS");

  useEffect(() => {
    const usuarioSalvo = JSON.parse(
      localStorage.getItem("usuarioLogado") || "{}"
    );

    if (!usuarioSalvo?.id || !usuarioSalvo?.municipio_id) {
      alert("Sessão inválida. Faça login novamente.");
      setCarregando(false);
      return;
    }

    setUsuario(usuarioSalvo);
    carregar(usuarioSalvo);
  }, []);

  async function carregar(usuarioAtual: UsuarioLogado) {
    try {
      setCarregando(true);

      const { data, error } = await supabase
        .from("alertas_operacionais")
        .select(
          "id, municipio_id, titulo, mensagem, nivel, origem, ativo, criado_em"
        )
        .eq("municipio_id", usuarioAtual.municipio_id)
        .eq("ativo", true)
        .order("criado_em", { ascending: false })
        .limit(100);

      if (error) {
        await registrarAuditoria({
          modulo: "Alertas Operacionais",
          acao: "ERRO",
          descricao: "Erro ao carregar alertas operacionais.",
          tabela: "alertas_operacionais",
          detalhes: {
            erro: error.message,
            municipio_id: usuarioAtual.municipio_id,
          },
        });

        alert("Erro ao carregar alertas.");
        return;
      }

      setAlertas(data || []);

      await registrarAuditoria({
        modulo: "Alertas Operacionais",
        acao: "ACESSO",
        descricao: "Acessou a tela de alertas operacionais.",
        tabela: "alertas_operacionais",
        detalhes: {
          total_alertas: data?.length || 0,
          municipio_id: usuarioAtual.municipio_id,
        },
      });
    } finally {
      setCarregando(false);
    }
  }

  async function resolverAlerta(id: number) {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }

    if (
      ![
        "ADMIN",
        "COMANDANTE",
        "DIRETOR",
        "DESENVOLVEDOR",
        "CMT_GUARNICAO",
      ].includes(usuario.perfil || "")
    ) {
      alert("Você não possui permissão para resolver alertas.");
      return;
    }

    const alerta = alertas.find((item) => item.id === id);

    if (!alerta) {
      alert("Alerta não encontrado.");
      return;
    }

    const motivo = prompt("Informe o motivo da resolução do alerta:");

    if (!motivo?.trim()) {
      alert("Informe o motivo da resolução.");
      return;
    }

    const { error } = await supabase
      .from("alertas_operacionais")
      .update({
        ativo: false,
        resolvido_por: usuario.id,
        resolvido_em: new Date().toISOString(),
        motivo_resolucao: motivo.trim(),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("municipio_id", usuario.municipio_id);

    if (error) {
      await registrarAuditoria({
        modulo: "Alertas Operacionais",
        acao: "ERRO",
        descricao: "Erro ao resolver alerta operacional.",
        tabela: "alertas_operacionais",
        registro_id: id,
        detalhes: {
          erro: error.message,
          motivo,
        },
      });

      alert("Erro ao resolver alerta.");
      return;
    }

    await registrarAuditoria({
      modulo: "Alertas Operacionais",
      acao: "RESOLVER",
      descricao: `Resolveu o alerta ${alerta.titulo}.`,
      tabela: "alertas_operacionais",
      registro_id: id,
      detalhes: {
        alerta,
        motivo: motivo.trim(),
      },
    });

    await carregar(usuario);
  }

  function corNivel(nivel: string) {
    if (nivel === "ALTO") {
      return "text-red-400 border-red-500/30 bg-red-500/10";
    }

    if (nivel === "MEDIO") {
      return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
    }

    return "text-cyan-400 border-cyan-500/30 bg-cyan-500/10";
  }

  const alertasFiltrados = useMemo(() => {
    return alertas.filter((alerta) => {
      const texto = `${alerta.titulo} ${alerta.mensagem} ${
        alerta.origem || ""
      }`.toLowerCase();

      const passouBusca = texto.includes(busca.toLowerCase());

      const passouNivel =
        nivelFiltro === "TODOS" || alerta.nivel === nivelFiltro;

      return passouBusca && passouNivel;
    });
  }, [alertas, busca, nivelFiltro]);

  const altos = alertas.filter((alerta) => alerta.nivel === "ALTO").length;
  const medios = alertas.filter((alerta) => alerta.nivel === "MEDIO").length;
  const baixos = alertas.filter((alerta) => alerta.nivel === "BAIXO").length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Alertas Operacionais"
        subtitulo="Monitoramento de situações críticas e eventos relevantes do município."
        icone={Activity}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <ShieldAlert className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-400 text-sm">Alertas ativos</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {alertas.length}
          </h2>
        </SigCard>

        <SigCard>
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-slate-400 text-sm">Nível alto</p>
          <h2 className="text-4xl font-black text-red-400 mt-2">
            {altos}
          </h2>
        </SigCard>

        <SigCard>
          <Activity className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Nível médio</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {medios}
          </h2>
        </SigCard>

        <SigCard>
          <CheckCircle className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Nível baixo</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {baixos}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-black text-white">
              Lista de Alertas
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Exibindo somente alertas ativos do município logado.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-3">
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar alerta..."
              className="input w-full md:w-72"
            />

            <select
              value={nivelFiltro}
              onChange={(e) => setNivelFiltro(e.target.value)}
              className="input w-full md:w-44"
            >
              <option value="TODOS">Todos os níveis</option>
              <option value="ALTO">Alto</option>
              <option value="MEDIO">Médio</option>
              <option value="BAIXO">Baixo</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <p className="text-slate-400">Carregando alertas...</p>
        ) : alertasFiltrados.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-16 h-16 mx-auto text-cyan-400 mb-4" />

            <h2 className="text-2xl font-black text-white">
              Nenhum alerta encontrado
            </h2>

            <p className="text-slate-400 mt-2">
              Os alertas automáticos aparecerão aqui após a análise de ocorrências.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alertasFiltrados.map((alerta) => (
              <div
                key={alerta.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-xs font-black ${corNivel(
                        alerta.nivel || "MEDIO"
                      )}`}
                    >
                      {alerta.nivel || "MEDIO"}
                    </span>

                    <h3 className="text-xl font-black text-white mt-3 break-words">
                      {alerta.titulo}
                    </h3>

                    <p className="text-slate-400 mt-2 break-words">
                      {alerta.mensagem}
                    </p>

                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-slate-500">
                        Origem: {alerta.origem || "-"}
                      </p>

                      <p className="text-xs text-slate-500">
                        Criado em:{" "}
                        {alerta.criado_em
                          ? new Date(alerta.criado_em).toLocaleString("pt-BR")
                          : "-"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => resolverAlerta(alerta.id)}
                    className="btn-secondary inline-flex items-center justify-center gap-2 shrink-0"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Resolver
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