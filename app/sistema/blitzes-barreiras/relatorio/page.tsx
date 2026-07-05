"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle,
  Download,
  FileText,
  Shield,
  Siren,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: number;
  municipio_id: number;
  perfil?: string;
};

type Operacao = {
  id: number;
  tipo: string | null;
  local: string | null;
  responsavel: string | null;
  observacoes: string | null;
  data: string | null;
  status: string | null;
};

export default function RelatorioBlitzesPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [operacoes, setOperacoes] = useState<Operacao[]>([]);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      if (!dados?.id || !dados?.municipio_id) {
        alert("Sessão inválida.");
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Blitzes e Barreiras",
        acao: "ACESSO",
        descricao: "Acessou o relatório de blitzes e barreiras.",
        tabela: "blitzes_barreiras",
        detalhes: {
          usuario_id: dados.id,
          municipio_id: dados.municipio_id,
        },
      });

      await carregar(dados);
    }

    iniciar();
  }, []);

  async function carregar(usuarioAtual: UsuarioLogado) {
    setCarregando(true);

    const { data, error } = await supabase
      .from("blitzes_barreiras")
      .select("id, tipo, local, responsavel, observacoes, data, status")
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("data", { ascending: false })
      .range(0, 499);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Blitzes e Barreiras",
        acao: "ERRO",
        descricao: "Erro ao carregar relatório de operações.",
        tabela: "blitzes_barreiras",
        detalhes: {
          erro: error.message,
          usuario_id: usuarioAtual.id,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar relatório.");
      return;
    }

    setOperacoes(data || []);
  }

  const lista = useMemo(() => {
    return operacoes.filter((item) => {
      if (!dataInicio && !dataFim) return true;

      const dataOperacao = item.data || "";

      if (dataInicio && dataOperacao < dataInicio) return false;
      if (dataFim && dataOperacao > dataFim) return false;

      return true;
    });
  }, [operacoes, dataInicio, dataFim]);

  const resumo = useMemo(() => {
    return {
      total: lista.length,
      blitzes: lista.filter((item) => item.tipo === "BLITZ").length,
      barreiras: lista.filter((item) => item.tipo === "BARREIRA").length,
      finalizadas: lista.filter((item) => item.status === "FINALIZADA").length,
    };
  }, [lista]);

  async function gerarRelatorio() {
    if (!usuario?.id || !usuario?.municipio_id) {
      alert("Sessão inválida.");
      return;
    }

    await registrarAuditoria({
      modulo: "Blitzes e Barreiras",
      acao: "EXPORTAR",
      descricao: "Gerou/imprimiu relatório de blitzes e barreiras.",
      tabela: "blitzes_barreiras",
      detalhes: {
        usuario_id: usuario.id,
        municipio_id: usuario.municipio_id,
        filtros: {
          data_inicio: dataInicio || null,
          data_fim: dataFim || null,
        },
        totais: resumo,
      },
    });

    window.print();
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <SigPageHeader
        titulo="Relatório de Operações"
        subtitulo="Estatísticas e relatórios de blitzes e barreiras."
        icone={FileText}
      />

      <div className="grid md:grid-cols-4 gap-4">
        <SigCard>
          <p className="text-slate-400">Total de Operações</p>
          <h2 className="text-4xl font-black mt-2">
            {carregando ? "..." : resumo.total}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Blitzes</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {carregando ? "..." : resumo.blitzes}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Barreiras</p>
          <h2 className="text-4xl font-black text-cyan-400 mt-2">
            {carregando ? "..." : resumo.barreiras}
          </h2>
        </SigCard>

        <SigCard>
          <p className="text-slate-400">Finalizadas</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {carregando ? "..." : resumo.finalizadas}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="label">Data Inicial</label>
            <input
              type="date"
              className="input"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Data Final</label>
            <input
              type="date"
              className="input"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={gerarRelatorio}
              disabled={carregando}
              className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={18} />
              Gerar Relatório
            </button>
          </div>
        </div>
      </SigCard>

      <SigCard>
        <div className="flex items-center gap-4 mb-6">
          <Shield size={40} className="text-yellow-400" />

          <div>
            <h2 className="font-black text-xl">Operações Encontradas</h2>
            <p className="text-slate-400">
              {lista.length} operação(ões) encontrada(s).
            </p>
          </div>
        </div>

        {carregando ? (
          <p className="text-slate-400 text-center py-10">
            Carregando relatório...
          </p>
        ) : lista.length === 0 ? (
          <p className="text-slate-400 text-center py-10">
            Nenhuma operação encontrada.
          </p>
        ) : (
          <div className="space-y-4">
            {lista.map((item) => (
              <div
                key={item.id}
                className="border border-slate-800 rounded-xl p-4 bg-slate-950/50"
              >
                <div className="flex items-start gap-3">
                  <Siren className="text-yellow-400 shrink-0" />

                  <div className="flex-1">
                    <h3 className="font-black text-lg">
                      {item.tipo || "Operação"}
                    </h3>

                    <p className="text-slate-300">
                      {item.local || "Local não informado"}
                    </p>

                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-400">
                      <span className="flex items-center gap-2">
                        <CalendarDays size={16} />
                        {item.data || "Data não informada"}
                      </span>

                      <span className="flex items-center gap-2">
                        <CheckCircle size={16} />
                        {item.status || "PLANEJADA"}
                      </span>
                    </div>

                    {item.responsavel && (
                      <p className="mt-2 text-slate-400">
                        Responsável: {item.responsavel}
                      </p>
                    )}

                    {item.observacoes && (
                      <p className="mt-2 text-slate-500 whitespace-pre-wrap break-words">
                        {item.observacoes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SigCard>
    </div>
  );
}