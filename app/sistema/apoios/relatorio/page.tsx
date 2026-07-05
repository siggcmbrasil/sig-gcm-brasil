"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  PhoneCall,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { registrarAuditoria } from "@/lib/auditoria";
import SigPageHeader from "@/components/sig/SigPageHeader";
import SigCard from "@/components/sig/SigCard";

type UsuarioLogado = {
  id: number;
  municipio_id: number;
  perfil?: string;
  nome?: string;
};

type Apoio = {
  id: number;
  tipo: string | null;
  orgao_solicitante: string | null;
  solicitante: string | null;
  local: string | null;
  data: string | null;
  hora: string | null;
  status: string | null;
  observacoes: string | null;
};

export default function RelatorioApoiosPage() {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [apoios, setApoios] = useState<Apoio[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [tipoFiltro, setTipoFiltro] = useState("TODOS");
  const [busca, setBusca] = useState("");

  useEffect(() => {
    async function iniciar() {
      const dados = JSON.parse(
        localStorage.getItem("usuarioLogado") || "{}"
      );

      if (!dados?.id || !dados?.municipio_id) {
        alert("Sessão inválida. Faça login novamente.");
        setCarregando(false);
        return;
      }

      setUsuario(dados);

      await registrarAuditoria({
        modulo: "Relatório de Apoios",
        acao: "ACESSO",
        descricao: "Acessou o relatório de apoios.",
        tabela: "apoios",
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
      .from("apoios")
      .select(
        "id, tipo, orgao_solicitante, solicitante, local, data, hora, status, observacoes"
      )
      .eq("municipio_id", usuarioAtual.municipio_id)
      .order("data", { ascending: false })
      .range(0, 199);

    setCarregando(false);

    if (error) {
      await registrarAuditoria({
        modulo: "Relatório de Apoios",
        acao: "ERRO",
        descricao: "Erro ao carregar relatório de apoios.",
        tabela: "apoios",
        detalhes: {
          erro: error.message,
          municipio_id: usuarioAtual.municipio_id,
        },
      });

      alert("Erro ao carregar relatório de apoios.");
      return;
    }

    setApoios(data || []);
  }

  const apoiosFiltrados = useMemo(() => {
    return apoios.filter((item) => {
      const texto = `
        ${item.tipo || ""}
        ${item.orgao_solicitante || ""}
        ${item.solicitante || ""}
        ${item.local || ""}
        ${item.observacoes || ""}
      `.toLowerCase();

      return (
        texto.includes(busca.toLowerCase()) &&
        (statusFiltro === "TODOS" || item.status === statusFiltro) &&
        (tipoFiltro === "TODOS" || item.tipo === tipoFiltro)
      );
    });
  }, [apoios, busca, statusFiltro, tipoFiltro]);

  const tipos = Array.from(
    new Set(apoios.map((item) => item.tipo).filter(Boolean))
  );

  const abertos = apoiosFiltrados.filter(
    (item) => (item.status || "ABERTO") === "ABERTO"
  ).length;

  const andamento = apoiosFiltrados.filter(
    (item) => item.status === "EM_ANDAMENTO"
  ).length;

  const finalizados = apoiosFiltrados.filter(
    (item) => item.status === "FINALIZADO"
  ).length;

  const cancelados = apoiosFiltrados.filter(
    (item) => item.status === "CANCELADO"
  ).length;

  return (
    <div className="p-4 md:p-6 pb-24 space-y-6">
      <SigPageHeader
        titulo="Relatório de Apoios"
        subtitulo="Análise dos apoios operacionais e institucionais registrados."
        icone={BarChart3}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SigCard>
          <PhoneCall className="w-8 h-8 text-cyan-400 mb-3" />
          <p className="text-slate-400 text-sm">Total filtrado</p>
          <h2 className="text-4xl font-black text-white mt-2">
            {carregando ? "..." : apoiosFiltrados.length}
          </h2>
        </SigCard>

        <SigCard>
          <Clock className="w-8 h-8 text-yellow-400 mb-3" />
          <p className="text-slate-400 text-sm">Abertos</p>
          <h2 className="text-4xl font-black text-yellow-400 mt-2">
            {carregando ? "..." : abertos}
          </h2>
        </SigCard>

        <SigCard>
          <Building2 className="w-8 h-8 text-orange-400 mb-3" />
          <p className="text-slate-400 text-sm">Em andamento</p>
          <h2 className="text-4xl font-black text-orange-400 mt-2">
            {carregando ? "..." : andamento}
          </h2>
        </SigCard>

        <SigCard>
          <CheckCircle className="w-8 h-8 text-emerald-400 mb-3" />
          <p className="text-slate-400 text-sm">Finalizados</p>
          <h2 className="text-4xl font-black text-emerald-400 mt-2">
            {carregando ? "..." : finalizados}
          </h2>
        </SigCard>
      </div>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Filtros do relatório
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            className="input"
            placeholder="Buscar por órgão, local, solicitante..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />

          <select
            className="input"
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
          >
            <option value="TODOS">Todos os status</option>
            <option value="ABERTO">Aberto</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="FINALIZADO">Finalizado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>

          <select
            className="input"
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
          >
            <option value="TODOS">Todos os tipos</option>
            {tipos.map((tipo) => (
              <option key={String(tipo)} value={String(tipo)}>
                {String(tipo)}
              </option>
            ))}
          </select>
        </div>
      </SigCard>

      <SigCard>
        <h2 className="text-xl font-black text-white mb-4">
          Registros do relatório
        </h2>

        {carregando ? (
          <p className="text-slate-400">Carregando relatório...</p>
        ) : apoiosFiltrados.length === 0 ? (
          <p className="text-slate-400">Nenhum apoio encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="text-left py-3 pr-4">Data</th>
                  <th className="text-left py-3 pr-4">Tipo</th>
                  <th className="text-left py-3 pr-4">Órgão</th>
                  <th className="text-left py-3 pr-4">Local</th>
                  <th className="text-left py-3 pr-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {apoiosFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-900 text-slate-300"
                  >
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        {item.data || "-"} {item.hora ? `às ${item.hora}` : ""}
                      </span>
                    </td>

                    <td className="py-3 pr-4 font-bold text-white">
                      {item.tipo || "Apoio"}
                    </td>

                    <td className="py-3 pr-4">
                      {item.orgao_solicitante || "Não informado"}
                    </td>

                    <td className="py-3 pr-4">
                      {item.local || "-"}
                    </td>

                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 text-xs font-bold text-cyan-400">
                        {item.status || "ABERTO"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-slate-500 mt-4">
          Cancelados no filtro atual: {cancelados}
        </p>
      </SigCard>
    </div>
  );
}